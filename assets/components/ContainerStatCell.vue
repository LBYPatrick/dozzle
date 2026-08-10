<template>
  <div
    v-if="isMobile"
    class="flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium tabular-nums"
    :class="type === 'cpu' ? 'bg-primary/10 text-primary-safe' : 'bg-secondary/10 text-secondary-safe'"
  >
    <component :is="type === 'cpu' ? PhCpu : PhMemory" class="size-3.5 shrink-0" />
    <span>{{ displayValue }}</span>
  </div>
  <div v-else class="flex flex-row items-center gap-2" :class="{ 'opacity-45': !isRunning }">
    <!-- A stopped container has no load to plot. A flat green line across a
         dozen exited rows says "healthy" about something that isn't running at
         all; the rule says nothing, which is the truth. -->
    <div v-if="!isRunning" class="bg-base-content/15 h-px flex-1"></div>
    <template v-else-if="mode === 'chart'">
      <!-- Area, not bars. At the idle values most rows sit at, a bar series
           renders as a row of specks; a filled curve stays a legible line. -->
      <BarChart class="h-5 flex-1" shape="area" :tone-class="toneClass" :chart-data="chartData" />
    </template>
    <template v-else>
      <progress class="progress flex-1" :class="progressClass" :value="averageValue" max="100"></progress>
    </template>
    <span class="min-w-12 text-right text-sm tabular-nums">{{ displayValue }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Container } from "@/models/Container";
import type { Host } from "@/stores/hosts";
import PhCpu from "~icons/ph/cpu";
import PhMemory from "~icons/ph/memory";

const {
  container,
  type,
  host,
  mode = "chart",
} = defineProps<{
  container: Container;
  type: "cpu" | "mem";
  host: Host;
  mode?: "chart" | "progress";
}>();

function totalCores(): number {
  if (container.cpuLimit && container.cpuLimit > 0) {
    return container.cpuLimit;
  }
  return host.nCPU ?? 1;
}

const isRunning = computed(() => container.state === "running");

const chartData = computed(() => {
  if (type === "cpu") {
    const cores = totalCores();
    return container.statsHistory.map((stat) => {
      const percent = Math.min(stat.cpu / cores, 100);
      return { percent, value: stat.cpu };
    });
  }
  return container.statsHistory.map((stat) => {
    const percent = Math.min(stat.memory, 100);
    return { percent, value: stat.memoryUsage };
  });
});

const averageValue = computed(() => {
  if (type === "cpu") {
    const cores = totalCores();
    return Math.min(container.movingAverage.cpu / cores, 100);
  }
  return container.movingAverage.memory;
});

const displayValue = computed(() => {
  if (type === "cpu") {
    return `${cpuDisplayValue(averageValue.value, container.movingAverage.cpu).toFixed(0)}%`;
  }
  return formatBytes(container.movingAverage.memoryUsage);
});

// The area shape paints with currentColor, so the same thresholds are expressed
// as a text colour rather than a background.
const toneClass = computed(() => {
  const value = averageValue.value;
  if (value <= 50) return "text-success";
  if (value <= 70) return "text-secondary-safe";
  if (value <= 90) return "text-warning";
  return "text-error";
});

const progressClass = computed(() => {
  const value = averageValue.value;
  if (value <= 50) return "progress-success";
  if (value <= 70) return "progress-secondary";
  if (value <= 90) return "progress-warning";
  return "progress-error";
});
</script>
