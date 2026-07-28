<template>
  <!-- The dot lives inside a box exactly one log line tall and is centred in it,
       so it lines up with the first line of the message no matter what font size
       the log list is set to. The stretched variants (multi-line grouped
       entries) let the dot fill the box instead. -->
  <div :data-position="position" class="log-level w-2.5 flex-none">
    <div :data-level="level" class="dot" :class="{ showUnknown }"></div>
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
<style>
@reference "@/main.css";
[data-level="debug"],
[data-level="trace"] {
  @apply !bg-purple;
}

[data-level="info"] {
  @apply !bg-green;
}

[data-level="error"],
[data-level="fatal"] {
  @apply !bg-red;
}

[data-level="warn"] {
  @apply !bg-orange;
}

[data-level="unknown"].show-unknown {
  @apply !bg-base-300;
}
</style>
