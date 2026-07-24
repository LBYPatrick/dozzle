<template>
  <!-- Floating stand-in for the collapsed top bar. The whole pill is a button so
       clicking anywhere restores the bar. Glass is intentional here: it is a
       small floating container, one of the few places the design allows blur. -->
  <div class="fixed top-[calc(var(--mobile-nav-height)+0.6rem)] right-4 z-30 flex items-stretch md:top-3">
    <!-- Progress "piece": a distinct left segment that fills as you scroll away
         from the tail. Different shade, animates in from the left. The perimeter
         circuit around the main pill deliberately does not run through it. -->
    <transition name="piece">
      <div
        v-if="paused"
        class="border-base-content/10 bg-primary/10 relative w-2.5 overflow-hidden rounded-l-full border border-r-0 shadow-lg backdrop-blur-md"
        :title="`${Math.round(clamped * 100)}%`"
      >
        <div
          class="bg-primary/70 absolute inset-x-0 bottom-0 transition-[height] duration-200 ease-out"
          :style="{ height: `${clamped * 100}%` }"
        ></div>
      </div>
    </transition>

    <button
      ref="pill"
      type="button"
      class="border-base-content/10 bg-base-200/85 text-base-content hover:bg-base-200 focus-visible:ring-primary/60 relative flex items-center gap-3 border py-2 pr-2.5 pl-3.5 shadow-lg backdrop-blur-md transition-[transform,background-color,border-radius] duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2"
      :class="paused ? 'rounded-r-full' : 'rounded-full'"
      :title="$t('button.expand-top-bar')"
      :aria-label="$t('button.expand-top-bar')"
      @click="$emit('expand')"
    >
      <!-- Perimeter circuit progress, hugs the pill border while paused. -->
      <svg
        v-if="paused && size.w > 0"
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        fill="none"
        aria-hidden="true"
      >
        <rect
          :x="1"
          :y="1"
          :width="size.w - 2"
          :height="size.h - 2"
          :rx="(size.h - 2) / 2"
          class="stroke-base-content/10"
          stroke-width="2"
          pathLength="100"
        />
        <rect
          :x="1"
          :y="1"
          :width="size.w - 2"
          :height="size.h - 2"
          :rx="(size.h - 2) / 2"
          class="stroke-primary"
          stroke-width="2"
          stroke-linecap="round"
          pathLength="100"
          :stroke-dasharray="`${Math.max(0.5, clamped * 100)} 100`"
          :stroke-dashoffset="0"
          :transform="`rotate(180 ${size.w / 2} ${size.h / 2})`"
        />
      </svg>

      <span class="text-primary flex items-center gap-1.5">
        <span v-if="loading" class="loading loading-spinner loading-xs"></span>
        <PhCpu v-else class="size-4" />
        <span class="text-sm font-semibold tabular-nums">{{ cpu.toFixed(1) }}%</span>
      </span>
      <span class="bg-base-content/15 h-4 w-px"></span>
      <span class="text-secondary flex items-center gap-1.5">
        <PhMemory class="size-4" />
        <span class="text-sm font-semibold tabular-nums">{{
          formatBytes(memoryUsage, { short: true, decimals: 1 })
        }}</span>
      </span>
      <span class="bg-base-content/5 text-base-content/50 ml-0.5 flex size-6 items-center justify-center rounded-full">
        <mdi:chevron-down class="size-4" />
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import type { Container } from "@/models/Container";
import { useLiveStatTotals } from "@/composable/liveStatTotals";
import PhCpu from "~icons/ph/cpu";
import PhMemory from "~icons/ph/memory";

const {
  containers,
  loading = false,
  paused = false,
  progress = 1,
} = defineProps<{ containers: Container[]; loading?: boolean; paused?: boolean; progress?: number }>();

defineEmits<{ expand: [] }>();

const { cpu, memoryUsage } = useLiveStatTotals(() => containers);

const clamped = computed(() => Math.min(1, Math.max(0, progress)));

const pill = ref<HTMLElement>();
const size = reactive({ w: 0, h: 0 });
useResizeObserver(pill, ([entry]) => {
  const el = entry.target as HTMLElement;
  size.w = el.offsetWidth;
  size.h = el.offsetHeight;
});
</script>

<style scoped>
.piece-enter-active,
.piece-leave-active {
  transition:
    width 200ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 160ms ease;
  overflow: hidden;
}
.piece-enter-from,
.piece-leave-to {
  width: 0;
  opacity: 0;
}
</style>
