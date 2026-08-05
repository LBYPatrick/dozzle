<template>
  <ul
    class="group pt-4"
    :class="{ 'disable-wrap': !softWrap, [size]: true, compact }"
    :style="{ '--log-source-chars': sourceChars }"
    data-logs
  >
    <li
      v-for="item in messages"
      ref="list"
      :key="item.id"
      :id="item.id.toString()"
      :data-time="item.date.getTime()"
      class="group/entry"
      :class="{ 'log-permalink-target': permalinkLogId === item.id.toString() }"
    >
      <component :is="item.getComponent()" :log-entry="item" />
    </li>
  </ul>
</template>

<script lang="ts" setup>
import type { LogEntry, LogMessage } from "@/models/LogEntry";

const { progress, currentDate } = useScrollContext();

const { messages } = defineProps<{
  messages: LogEntry<LogMessage>[];
}>();

const { containers, showContainerName, showHostname } = useLoggingContext();

const { hosts } = useHosts();

// How wide the provenance column needs to be, in characters, for every name on
// screen to fit. Computed once for the list rather than per row — there are
// thousands of rows — and shared through a CSS variable so every cell lands on
// the same edge and the timestamps stay flush.
//
// It measures only what is actually rendered: counting host names into the width
// while hostnames are hidden would reserve a column nobody can see. The value is
// a floor rather than a fixed width (see LogSource), so getting it wrong costs
// alignment, never legibility.
const MIN_SOURCE_CHARS = 12;

const containerStore = useContainerStore();

const sourceChars = computed(() => {
  let longest = 0;

  const measure = (containerId: string | undefined) => {
    if (!containerId) return;
    const c = containerStore.findContainerById?.(containerId);
    if (showContainerName?.value ?? true) {
      longest = Math.max(longest, c?.name?.length ?? 0);
    }
    if (showHostname?.value ?? true) {
      longest = Math.max(longest, hosts.value[c?.host as string]?.name?.length ?? 0);
    }
  };

  // The containers the view is scoped to...
  for (const container of containers.value) {
    // Optional throughout: a container can be in the list before the store has
    // filled it in, and reading .length off that undefined threw during render,
    // taking the whole log list down with it.
    if (showContainerName?.value ?? true) {
      longest = Math.max(longest, container?.name?.length ?? 0);
    }
    if (showHostname?.value ?? true) {
      longest = Math.max(longest, hosts.value[container?.host]?.name?.length ?? 0);
    }
  }

  // ...and anything the rows actually reference, which is not always the same
  // set: a line can outlive the container it came from, and backfill reaches
  // back past what is currently listed. Measuring only the scope let those rows
  // exceed the column, and since the width is uniform that would have meant
  // clipping them.
  for (const message of messages) {
    measure(message.containerID);
  }

  return Math.max(longest, MIN_SOURCE_CHARS);
});

const route = useRoute();
const permalinkLogId = computed(() => (typeof route.query.logId === "string" ? route.query.logId : ""));

const list = ref<HTMLElement[]>([]);

// The start of the span progress is measured against: the oldest container in
// view, so a merged/host/stack view is measured rather than skipped. It used to
// bail unless exactly one container was in view, which left `progress` at its
// default — and that default said 100%.
const spanStart = computed(() => {
  const stamps = containers.value.map((c) => c.created).filter(hasTimestamp);
  if (stamps.length === 0) return undefined;
  return new Date(Math.min(...stamps.map((d) => d.getTime())));
});

let previousDate = new Date();
useIntersectionObserver(
  list,
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const time = entry.target.getAttribute("data-time");
        if (time) {
          const date = new Date(parseInt(time));
          if (+date === +previousDate) break;
          previousDate = date;
          currentDate.value = date;
          const start = spanStart.value;
          progress.value = start ? scrollProgress(date, start, new Date()) : undefined;
          break;
        }
      }
    }
  },
  {
    rootMargin: "-10% 0px -10% 0px",
    threshold: 1,
  },
);
</script>
<style scoped>
@reference "@/main.css";
ul {
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Consolas,
    Liberation Mono,
    monaco,
    Menlo,
    monospace;

  > li {
    @apply flex px-2 py-1 break-words last:snap-end odd:bg-gray-400/[0.07] md:px-4;
    &:last-child {
      scroll-margin-block-end: 5rem;
    }

    &.log-permalink-target {
      @apply bg-secondary/15 border-secondary -ml-1 border-l-4 pl-3;
      animation: log-permalink-pulse 1.4s ease-out;
    }
  }

  &.small {
    @apply text-[0.7em];
  }

  &.medium {
    @apply text-[0.8em];
  }

  &.large {
    @apply text-[1em];
  }

  &.compact {
    > li {
      @apply py-0;
    }

    :deep(.tag) {
      @apply rounded-none;
    }
  }

  :deep(mark) {
    @apply bg-secondary inline-block rounded-xs;
    animation: pops 200ms ease-out;
  }

  :deep(a[rel~="external"]) {
    /* Links inside log messages sit on the log surface, where the raw accent
     measured under 2:1 on the light theme. */
    @apply underline-offset-4 hover:underline;
    color: var(--color-primary-text);
  }
}

@keyframes pops {
  0% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1.05);
  }
}

@keyframes log-permalink-pulse {
  0% {
    background-color: var(--color-secondary);
  }
  100% {
    /* Settle to the resting bg-secondary/15 declared on the .li above. */
    background-color: color-mix(in oklab, var(--color-secondary) 15%, transparent);
  }
}
</style>
