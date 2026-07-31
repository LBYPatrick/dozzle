<template>
  <!-- The container state tally as one proportional strip, sat flush along the
       bottom edge of its cell like the fill line on a battery.

       A tally of five states could be five numbers, but nobody subtracts them
       to get the ratio — and the ratio is the whole question ("is most of my
       fleet up?"). One strip answers it without being read. -->
  <div class="ribbon flex w-full" role="img" :aria-label="summary">
    <span
      v-for="segment in visible"
      :key="segment.key"
      class="segment h-full"
      :class="segment.class"
      :style="{ width: `${(segment.count / total) * 100}%` }"
      :title="`${segment.label} · ${segment.count}`"
    />
  </div>
</template>

<script setup lang="ts">
export type StateSegment = {
  key: string;
  label: string;
  count: number;
  /** Tailwind background class for this slice. */
  class: string;
};

const { segments } = defineProps<{ segments: StateSegment[] }>();

const total = computed(() => segments.reduce((sum, segment) => sum + segment.count, 0));
const visible = computed(() => (total.value > 0 ? segments.filter((segment) => segment.count > 0) : []));

// The strip is the only thing carrying this breakdown, and it is a shape. Screen
// readers get the same tally as words rather than a decorative div.
const summary = computed(() => visible.value.map((segment) => `${segment.count} ${segment.label}`).join(", "));
</script>

<style scoped>
.ribbon {
  height: 5px;
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
}

.segment {
  transition: width 400ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Slices meet at hairlines. Each carries its own separator rather than the
   track drawing gaps, which would misreport the proportions it exists to show. */
.segment + .segment {
  box-shadow: inset 1px 0 0 color-mix(in oklab, var(--color-base-100) 70%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .segment {
    transition: none;
  }
}
</style>
