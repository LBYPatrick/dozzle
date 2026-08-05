import { ShallowRef, type Ref } from "vue";

import debounce from "lodash.debounce";
import {
  type LogEvent,
  type JSONObject,
  type LogMessage,
  LogEntry,
  asLogEntry,
  ContainerEventLogEntry,
  ComplexLogEntry,
  SkippedLogsEntry,
  LoadMoreLogEntry,
} from "@/models/LogEntry";
import { Service, Stack } from "@/models/Stack";
import { Container, GroupedContainers } from "@/models/Container";
import { parseMessage, loadBetween, mergeLoadedLogs } from "@/composable/loadBetween";
import { useLogLoader } from "@/composable/logLoader";
import { loggingContextKey } from "@/composable/logContext";
import { parseEventData } from "@/utils/events";
import type { SearchStatus } from "@/composable/search";

export function useContainerStream(container: Ref<Container>): LogStreamSource {
  const url = computed(() => `/api/hosts/${container.value.host}/containers/${container.value.id}/logs/stream`);
  return useLogStream(url, container);
}

export function useHostStream(host: Ref<Host>): LogStreamSource {
  return useLogStream(computed(() => `/api/hosts/${host.value.id}/logs/stream`));
}

export function useHostGroupStream(group: Ref<{ name: string }>): LogStreamSource {
  return useLogStream(computed(() => `/api/host-groups/${encodeURIComponent(group.value.name)}/logs/stream`));
}

export function useStackStream(stack: Ref<Stack>): LogStreamSource {
  const labels = computed(() => `com.docker.stack.namespace:${stack.value.name}`);
  return useLogStream(computed(() => `/api/labels/${labels.value}/logs/stream`));
}

export function useGroupedStream(group: Ref<GroupedContainers>): LogStreamSource {
  return useLogStream(computed(() => `/api/groups/${group.value.name}/logs/stream`));
}

// Every running container on every host. Backs fleet-wide log search: the
// server's backward scan already runs across whatever set it is given, so this
// is search across everything without an index and without leaving the host.
export function useAllContainersStream(hosts?: Ref<string[]>): LogStreamSource {
  // The entity ref every other stream source receives is, for this one, the set
  // of hosts to query — empty meaning all of them. Sent as a param rather than
  // filtered client-side so the server's backward scan only reads the machines
  // you asked about.
  return useLogStream(
    computed(() => {
      const selected = hosts?.value ?? [];
      return selected.length > 0
        ? `/api/logs/stream?hosts=${selected.map(encodeURIComponent).join(",")}`
        : `/api/logs/stream`;
    }),
  );
}

export function useMergedStream(containers: Ref<Container[]>): LogStreamSource {
  const url = computed(() => {
    const ids = containers.value.map((c) => c.id).join(",");
    return `/api/hosts/${containers.value[0].host}/logs/mergedStream/${ids}`;
  });

  return useLogStream(url);
}

export function useServiceStream(service: Ref<Service>): LogStreamSource {
  const labels = computed(() => `com.docker.swarm.service.name:${service.value.name}`);
  return useLogStream(computed(() => `/api/labels/${labels.value}/logs/stream`));
}

export function useNamespaceStream(namespace: Ref<{ name: string }>): LogStreamSource {
  const labels = computed(() => `@k8s.namespace:${namespace.value.name}`);
  return useLogStream(computed(() => `/api/labels/${labels.value}/logs/stream`));
}

export function useOwnerStream(owner: Ref<{ label: string }>): LogStreamSource {
  const labels = computed(() => `${owner.value.label}:true`);
  return useLogStream(computed(() => `/api/labels/${labels.value}/logs/stream`));
}

export type LogStreamSource = ReturnType<typeof useLogStream>;

function useLogStream(url: Ref<string>, container?: Ref<Container>) {
  // Resolved here rather than at module scope: search state is per log view, so
  // it has to be injected from within the component that owns the stream.
  const { isSearching, debouncedSearchFilter, inverseFilter } = useSearchFilter();

  const messages: ShallowRef<LogEntry<LogMessage>[]> = shallowRef([]);
  // Plain array, not a ref: nothing watches the buffer, and the old
  // `buffer.value = [...buffer.value, entry]` copied the whole thing once per
  // incoming line — quadratic against the burst of backfill that arrives every
  // time the stream reconnects (a stdout/stderr toggle, a level change).
  let buffer: LogEntry<LogMessage>[] = [];
  const opened = ref(false);
  const loading = ref(true);
  const error = ref(false);
  const searchStatus = ref<SearchStatus>({ active: false, done: false, matches: 0 });
  const { paused: scrollingPaused } = useScrollContext();
  const { streamConfig, hasComplexLogs, levels, loadingMore, containers } = useLoggingContext();
  let initial = true;

  const params = computed(() => {
    const params = new URLSearchParams();
    if (streamConfig.value.stdout) params.append("stdout", "1");
    if (streamConfig.value.stderr) params.append("stderr", "1");
    if (isSearching.value) {
      params.append("filter", debouncedSearchFilter.value);
      if (inverseFilter.value) params.append("inverse", "true");
    }
    // Multi-container views default to running containers only; this asks the
    // server to include the stopped ones too. Sent for every stream — the
    // single-container and merged routes name their containers outright and
    // ignore it, which keeps one setting rather than one per view.
    if (showAllContainers.value) params.append("stopped", "1");
    for (const level of levels.value) {
      params.append("levels", level);
    }
    return params;
  });

  const allContainers = computed(() => (container ? [container.value] : containers.value));
  const { loadOlderLogs, loadSkippedLogs } = useLogLoader(messages, allContainers, params, loadingMore);

  // Jump straight to the container's first lines by fetching only the oldest
  // window (from each container's creation), instead of lazily loading every
  // line in between. Pausing means any live logs that arrive while viewing the
  // head collect as a skipped marker rather than appending; "go to bottom"
  // reconnects to the live tail.
  async function loadOldest() {
    const cs = allContainers.value;
    if (cs.length === 0) return;
    loadingMore.value = true;
    try {
      const perContainer = Math.max(1, Math.ceil(config.maxLogs / cs.length));
      const results = await Promise.all(
        cs.map((c) => loadBetween(c, params, c.created, new Date(), { maxStart: perContainer })),
      );
      const head = mergeLoadedLogs(results).slice(0, config.maxLogs);
      if (head.length === 0) return;
      scrollingPaused.value = true;
      messages.value = [new LoadMoreLogEntry(new Date(), loadOlderLogs), ...head];
    } catch (err) {
      console.error(err);
    } finally {
      loadingMore.value = false;
    }
  }

  const loggingContextRaw = inject(loggingContextKey);
  if (loggingContextRaw) {
    loggingContextRaw.jumpToOldest = loadOldest;
    loggingContextRaw.reconnect = () => connect();
  }

  function flushNow() {
    if (messages.value.length + buffer.length > config.maxLogs) {
      if (scrollingPaused.value === true) {
        if (messages.value.at(-1) instanceof SkippedLogsEntry) {
          const lastEvent = messages.value.at(-1) as SkippedLogsEntry;
          const lastItem = buffer.at(-1) as LogEntry<string | JSONObject>;
          lastEvent.addSkippedEntries(buffer.length, lastItem);
        } else {
          const firstItem = buffer.at(0) as LogEntry<string | JSONObject>;
          const lastItem = buffer.at(-1) as LogEntry<string | JSONObject>;
          messages.value = [
            ...messages.value,
            new SkippedLogsEntry(new Date(), buffer.length, firstItem, lastItem, loadSkippedLogs),
          ];
        }
        buffer = [];
      } else {
        if (buffer.length > config.maxLogs / 2) {
          messages.value = buffer.slice(-config.maxLogs / 2);
        } else {
          messages.value = [...messages.value, ...buffer].slice(-config.maxLogs);
        }
        buffer = [];
      }
    } else {
      if (initial) {
        // sort the buffer the very first time because of multiple logs in parallel
        buffer.sort((a, b) => a.date.getTime() - b.date.getTime());

        if (container || containers.value.length > 0) {
          const loadMoreItem = new LoadMoreLogEntry(new Date(), loadOlderLogs);
          messages.value = [loadMoreItem];
        }
        initial = false;
      }
      messages.value = [...messages.value, ...buffer];
      buffer = [];
    }
  }
  const flushBuffer = debounce(flushNow, 250, { maxWait: 1000 });

  // Search results arrive as one SSE event per time window the server scans, and
  // they used to be spliced into `messages` synchronously as each one landed.
  // Every event therefore rebuilt the whole array and re-rendered every row —
  // and because these prepend, every existing row moved, so Vue patched all of
  // them. Ten windows against a list already holding hundreds of lines is what
  // froze the page, and only ever when there were matches: no matches, no
  // events, no work.
  //
  // Batched through the same 250ms/1000ms cadence the live stream uses, so a
  // burst of windows costs one rebuild instead of one per window.
  let backfillBuffer: LogEntry<LogMessage>[] = [];

  function flushBackfillNow() {
    if (backfillBuffer.length === 0) return;
    // Capped like the live path, which had a ceiling all along while this one
    // did not: prepended results could push the list past maxLogs and every
    // subsequent render paid for rows nobody had scrolled to. The tail is what
    // gets dropped, since backfill is reaching backwards and the oldest lines
    // are the ones furthest from what was asked for.
    messages.value = [...backfillBuffer, ...messages.value].slice(0, config.maxLogs);
    backfillBuffer = [];
  }
  const flushBackfill = debounce(flushBackfillNow, 250, { maxWait: 1000 });

  let es: EventSource | null = null;

  function close() {
    if (es) {
      es.close();
      es = null;
    }
  }

  function clearMessages() {
    flushBuffer.cancel();
    flushBackfill.cancel();
    messages.value = [];
    buffer = [];
    backfillBuffer = [];
  }

  // The url may already carry params of its own (the fleet stream's host
  // filter), so the separator cannot be assumed.
  const urlWithParams = computed(() => {
    const separator = url.value.includes("?") ? "&" : "?";
    return withBase(`${url.value}${separator}${params.value.toString()}`);
  });

  function connect({ clear } = { clear: true }) {
    close();
    if (clear) clearMessages();
    opened.value = false;
    loading.value = true;
    error.value = false;
    initial = true;
    searchStatus.value = { active: isSearching.value, done: false, matches: 0 };
    es = new EventSource(urlWithParams.value);
    es.addEventListener("container-event", (e) => {
      const event = parseEventData<{
        actorId: string;
        name: "container-stopped" | "container-started";
        time: string;
      }>(e);
      const containerEvent = new ContainerEventLogEntry(
        event.name == "container-started" ? "Container started" : "Container stopped",
        event.actorId,
        new Date(event.time),
        event.name,
      );

      buffer.push(containerEvent);
      flushBuffer();
      flushBuffer.flush();
    });

    es.addEventListener("logs-backfill", (e) => {
      const data = parseEventData<LogEvent[]>(e);
      const logs = data.map((e) => asLogEntry(e));
      // Each window is older than the one before it, so a new batch goes in
      // front of the batches already waiting — the same order the unbuffered
      // version produced by prepending each event as it arrived.
      backfillBuffer = [...logs, ...backfillBuffer];
      flushBackfill();
    });

    es.addEventListener("search-status", (e) => {
      const data = parseEventData<{
        scannedTo: string;
        matches: number;
        done: boolean;
        reason?: "capped" | "exhausted";
      }>(e);
      searchStatus.value = {
        active: !data.done,
        done: data.done,
        matches: data.matches,
        scannedTo: data.scannedTo,
        reason: data.reason,
      };
      // Nothing more is coming, so do not sit on the last batch for the debounce
      // interval — that would read as the search having stalled at the end.
      if (data.done) flushBackfill.flush();
    });

    es.onmessage = (e) => {
      if (e.data) {
        buffer.push(parseMessage(e.data));
        flushBuffer();
      }
    };
    es.onerror = () => {
      error.value = true;
    };
    es.onopen = () => {
      loading.value = false;
      opened.value = true;
      error.value = false;
    };
  }

  watch(urlWithParams, () => connect(), { immediate: true });

  onScopeDispose(() => close());

  watch(messages, () => {
    if (messages.value.length > 1) {
      hasComplexLogs.value = messages.value.some((m) => m instanceof ComplexLogEntry);
    }
  });

  return {
    messages,
    opened,
    error,
    loading,
    searchStatus,
  };
}
