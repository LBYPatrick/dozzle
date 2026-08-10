<template>
  <!-- The dot lives inside a box exactly one log line tall and is centred in it,
       so it lines up with the first line of the message no matter what font size
       the log list is set to. The stretched variants (multi-line grouped
       entries) let the dot fill the box instead.

       The mark carries the level twice: in hue, and in shape. Hue alone meant a
       colour-blind reader got no level information anywhere in the log stream —
       the primary scanning affordance of the product — and the level ramp is
       tuned per theme rather than reusing the shared decorative hues, which
       measured 1.81:1 (warn on light) and 2.96:1 (debug on dark). -->
  <!-- role="img" only when there is a name to announce. An img role with no
       accessible name is worse than no role: it puts an unlabelled graphic in
       the tree on every single log line. -->
  <div
    :data-position="position"
    class="log-level w-2.5 flex-none"
    :title="levelTitle"
    :aria-label="levelTitle"
    :role="levelTitle ? 'img' : undefined"
  >
    <div :data-level="level" class="dot level-fill" :class="{ 'show-unknown': showUnknown }"></div>
  </div>
</template>
<script lang="ts" setup>
import { Position, Level } from "@/models/LogEntry";

const {
  level,
  position,
  showUnknown = false,
} = defineProps<{
  level?: Level;
  position?: Position;
  showUnknown?: boolean;
}>();

// Named, so the mark is not purely visual. Only on the first row of a grouped
// entry — repeating it down a stack trace would have a screen reader announce
// "error" once per line.
const levelTitle = computed(() =>
  !level || level === "unknown" || position === "middle" || position === "end" ? undefined : level,
);
</script>

<style scoped>
.log-level {
  display: flex;
  align-items: center;
  height: var(--log-line, 1.45em);
}

.dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 0.5rem;
}

[data-position="start"],
[data-position="middle"],
[data-position="end"] {
  align-self: stretch;
  height: auto;
}

[data-position="start"] .dot,
[data-position="middle"] .dot,
[data-position="end"] .dot {
  height: 100%;
}

[data-position="start"] .dot {
  border-radius: 0.375rem 0.375rem 0 0;
}

[data-position="middle"] .dot {
  border-radius: 0;
}

[data-position="end"] .dot {
  border-radius: 0 0 0.375rem 0.375rem;
}
</style>
