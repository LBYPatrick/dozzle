<template>
  <!-- A rounded-pill perimeter ring for a `relative` parent. Two modes:
       indeterminate spins a short arc (unknown progress); determinate fills from
       12 o'clock clockwise. Sits on the parent's edge so it reads as its border. -->
  <span ref="root" class="pointer-events-none absolute inset-0">
    <svg v-if="ringPath" class="h-full w-full" :viewBox="`0 0 ${size.w} ${size.h}`" fill="none" aria-hidden="true">
      <path v-if="track" :d="ringPath" class="stroke-base-content/15" :stroke-width="strokeWidth" />
      <path
        :d="ringPath"
        class="stroke-primary"
        :class="{ 'circuit-spin': indeterminate }"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        pathLength="100"
        :stroke-dasharray="dashArray"
      />
    </svg>
  </span>
</template>

<script lang="ts" setup>
const {
  progress = 1,
  indeterminate = false,
  track = false,
  strokeWidth = 1.5,
  radius,
} = defineProps<{
  progress?: number;
  indeterminate?: boolean;
  track?: boolean;
  strokeWidth?: number;
  // Corner radius in px so the ring can match a rounded-rect parent. Defaults to
  // a full pill (half the height).
  radius?: number;
}>();

const root = ref<HTMLElement>();
const size = reactive({ w: 0, h: 0 });
useResizeObserver(root, ([entry]) => {
  const el = entry.target as HTMLElement;
  size.w = el.offsetWidth;
  size.h = el.offsetHeight;
});

const clamped = computed(() => Math.min(1, Math.max(0, progress)));
const dashArray = computed(() => (indeterminate ? "24 100" : `${Math.max(0.5, clamped.value * 100)} 100`));

// Rounded-rect outline starting at 12 o'clock, running clockwise. Stroke is
// centered on the box edge (inset = half the stroke width) so it lines up with a
// rounded-full parent instead of forming a second inner ring.
const ringPath = computed(() => {
  const inset = strokeWidth / 2;
  const w = size.w - inset * 2;
  const h = size.h - inset * 2;
  if (w <= 0 || h <= 0) return "";
  const r = Math.min(radius ?? h / 2, h / 2, w / 2);
  const x = inset;
  const y = inset;
  const cx = x + w / 2;
  return [
    `M ${cx} ${y}`,
    `H ${x + w - r}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
});
</script>

<style scoped>
.circuit-spin {
  animation: circuit-spin 1.1s linear infinite;
}
@keyframes circuit-spin {
  to {
    stroke-dashoffset: -100;
  }
}
</style>
