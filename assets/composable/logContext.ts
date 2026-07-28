import { Container } from "@/models/Container";
import { Level } from "@/models/LogEntry";

type LogContext = {
  streamConfig: { stdout: boolean; stderr: boolean };
  containers: Container[];
  loadingMore: boolean;
  hasComplexLogs: boolean;
  levels: Set<Level>;
  showContainerName: boolean;
  showHostname: boolean;
  historical: boolean;
  // Set by the log stream so the scroll widget can jump straight to the oldest
  // window ("go to top") or reconnect to the live tail ("go to bottom"), without
  // materializing every line in between.
  jumpToOldest?: () => Promise<void>;
  reconnect?: () => void;
};

export const allLevels: Level[] = ["info", "debug", "warn", "error", "fatal", "trace", "unknown"];

// export for testing
export const loggingContextKey = Symbol("loggingContext") as InjectionKey<LogContext>;
const searchParams = new URLSearchParams(window.location.search);
const stdout = searchParams.has("stdout") ? searchParams.get("stdout") === "true" : true;
const stderr = searchParams.has("stderr") ? searchParams.get("stderr") === "true" : true;

export const provideLoggingContext = (
  containers: Ref<Container[]>,
  { showContainerName = false, showHostname = false, historical = false } = {},
) => {
  provide(
    loggingContextKey,
    reactive({
      streamConfig: { stdout, stderr },
      containers,
      loadingMore: false,
      hasComplexLogs: false,
      levels: new Set<Level>(allLevels),
      showContainerName,
      showHostname,
      historical,
      jumpToOldest: undefined as LogContext["jumpToOldest"],
      reconnect: undefined as LogContext["reconnect"],
    }),
  );
};

// `toRefs` allocates a ref per key on every call, and this composable is called
// once per rendered log row (LogItem, LogActions) — several thousand throwaway
// refs whenever the stream reconnects and the whole list is rebuilt. The refs
// for a given context object are always equivalent, so hand back the same set.
const refsByContext = new WeakMap<object, ReturnType<typeof toRefs<LogContext>>>();

export const useLoggingContext = () => {
  const context = inject(
    loggingContextKey,
    reactive({
      streamConfig: { stdout: true, stderr: true },
      containers: [],
      loadingMore: false,
      hasComplexLogs: false,
      levels: new Set<Level>(allLevels),
      showContainerName: false,
      showHostname: false,
      historical: false,
      jumpToOldest: undefined as LogContext["jumpToOldest"],
      reconnect: undefined as LogContext["reconnect"],
    }),
  );

  let refs = refsByContext.get(context);
  if (!refs) {
    refs = toRefs(context);
    refsByContext.set(context, refs);
  }
  return refs;
};
