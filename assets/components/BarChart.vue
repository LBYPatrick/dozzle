<template>
  <!-- Three shapes over one downsampled series. Bars stay the default and keep
       their per-bar hover; line and area are drawn as a single stretched SVG
       path, which is why they cost nothing extra to render and need no charting
       library. -->
  <div ref="chartContainer" class="flex items-end gap-[2px]" v-if="shape === 'bars'" @mousemove="onContainerHover">
    <div
      v-for="(bar, i) in downsampledBars"
      :key="i"
      class="bar min-h-px flex-1 rounded-t-sm"
      :class="barClass"
      :style="{ '--height': `${maxValue > 0 ? (bar.percent / maxValue) * 100 : 0}%` }"
    ></div>
  </div>
  <div ref="chartContainer" class="relative" :class="toneClass" v-else>
    <!-- preserveAspectRatio=none lets one 100x100 path stretch to any box; the
         stroke is kept honest with vector-effect so it does not stretch too. -->
    <svg class="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path v-if="shape === 'area'" :d="areaPath" fill="currentColor" opacity="0.22" />
      <polyline
        :points="linePoints"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </div>
</template>

<style scoped>
.bar {
  height: var(--height);
  will-change: height;
  contain: layout;
}
</style>

<script setup lang="ts">
export interface BarDataPoint {
  percent: number;
  value: number;
}

export type ChartShape = "bars" | "line" | "area";

const {
  chartData,
  barClass = "",
  shape = "bars",
  toneClass = "",
} = defineProps<{
  chartData: BarDataPoint[];
  barClass?: string;
  /** Bars are the default; line and area are the same series, drawn as a path. */
  shape?: ChartShape;
  /** Text colour class for the line/area shapes, which paint with currentColor. */
  toneClass?: string;
}>();

const hoverValue = defineEmit<[value: number]>();

const chartContainer = ref<HTMLElement | null>(null);
const { width } = useElementSize(chartContainer);

const BAR_WIDTH = 3;
const GAP = 2;

const availableBars = computed(() => Math.floor(width.value / (BAR_WIDTH + GAP)));
const bucketSize = computed(() => Math.ceil(chartData.length / availableBars.value));

const downsampledBars = ref<BarDataPoint[]>([]);
const maxValue = computed(() => {
  const dataMax = Math.max(0, ...downsampledBars.value.map((b) => b.percent));
  return Math.max(dataMax * 1.25, 1);
});
// Full recalculate when width/bucket size changes
watch([availableBars, bucketSize], () => {
  recalculate();
  changeCounter.value = 0;
});

// On data changes, only update the last bar unless a new bucket boundary is crossed.
// A wholesale replacement of the series (e.g. switching containers) is not detected
// here; the parent owns that and must call the exposed recalculate() on switch.
const changeCounter = ref(0);
let initialized = false;
watch(
  () => chartData.at(-1),
  () => {
    if (!initialized) {
      initialized = true;
      recalculate();
      return;
    }
    changeCounter.value++;
    if (changeCounter.value >= bucketSize.value) {
      recalculate();
      changeCounter.value = 0;
    } else {
      updateLastBar();
    }
  },
);

defineExpose({ recalculate });

// Series mapped into the 100x100 viewBox, top-down (SVG y grows downward).
const points = computed(() => {
  const bars = downsampledBars.value;
  if (bars.length === 0) return [];
  const step = bars.length > 1 ? 100 / (bars.length - 1) : 0;
  return bars.map((bar, i) => {
    const y = maxValue.value > 0 ? 100 - (bar.percent / maxValue.value) * 100 : 100;
    return [bars.length > 1 ? i * step : 50, Math.min(100, Math.max(0, y))] as const;
  });
});

const linePoints = computed(() => points.value.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" "));

const areaPath = computed(() => {
  const pts = points.value;
  if (pts.length === 0) return "";
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  return `${line} L${pts[pts.length - 1][0].toFixed(2)},100 L${pts[0][0].toFixed(2)},100 Z`;
});

function averageBucket(bucket: BarDataPoint[]): BarDataPoint {
  const percent = bucket.reduce((sum, d) => sum + d.percent, 0) / bucket.length;
  const value = bucket.reduce((sum, d) => sum + d.value, 0) / bucket.length;
  return { percent, value };
}

function recalculate() {
  if (availableBars.value === 0) return;

  if (chartData.length <= availableBars.value) {
    downsampledBars.value = [...chartData];
    return;
  }

  const size = bucketSize.value;
  const result: BarDataPoint[] = [];
  const numBuckets = Math.ceil(chartData.length / size);

  for (let i = 0; i < numBuckets; i++) {
    const start = i * size;
    const end = Math.min(start + size, chartData.length);
    result.push(averageBucket(chartData.slice(start, end)));
  }

  downsampledBars.value = result.slice(-availableBars.value);
}

function updateLastBar() {
  if (downsampledBars.value.length === 0) return;

  const size = bucketSize.value;
  const lastBucketStart = (Math.ceil(chartData.length / size) - 1) * size;
  const bucket = chartData.slice(lastBucketStart);

  downsampledBars.value[downsampledBars.value.length - 1] = averageBucket(bucket);
}

function onContainerHover(event: MouseEvent) {
  if (!chartContainer.value) return;

  const bars = chartContainer.value.children;
  if (bars.length === 0) return;

  const mouseX = event.clientX;
  let index = 0;

  // Find the bar whose column contains the mouse x position
  for (let i = 0; i < bars.length; i++) {
    const rect = bars[i].getBoundingClientRect();
    if (mouseX >= rect.left) {
      index = i;
    } else {
      break;
    }
  }

  hoverValue(downsampledBars.value[index].value);
}
</script>
