<template>
  <!-- Floating stand-in for the collapsed top bar. One pill, one button: click
       anywhere to restore the bar. Glass is intentional here — a small floating
       container is one of the few places the design allows blur. -->
  <div class="fixed top-[calc(var(--mobile-nav-height)+0.6rem)] right-4 z-30">
    <button
      ref="pill"
      type="button"
      class="bg-base-200/85 text-base-content hover:bg-base-200 focus-visible:ring-primary/60 relative flex items-center gap-3 rounded-full py-2 pr-2.5 pl-3.5 shadow-lg backdrop-blur-md transition-[background-color,box-shadow] duration-200 hover:shadow-xl focus:outline-none focus-visible:ring-2"
      :title="$t('button.expand-top-bar')"
      :aria-label="$t('button.expand-top-bar')"
      @click="$emit('expand')"
    >
      <!-- The pill has no CSS border; this SVG is the only outline, so the
           accent progress can never double it. The faint track is always drawn
           (acts as the border); the accent fills the same path from 12 o'clock
           clockwise while paused. -->
      <svg
        v-if="ringPath"
        class="pointer-events-none absolute inset-0 h-full w-full"
        :viewBox="`0 0 ${size.w} ${size.h}`"
        fill="none"
        aria-hidden="true"
      >
        <path :d="ringPath" class="stroke-base-content/15" stroke-width="1.5" />
        <path
          v-if="paused"
          :d="ringPath"
          class="stroke-primary"
          stroke-width="1.5"
          stroke-linecap="round"
          pathLength="100"
          :stroke-dasharray="`${Math.max(0.5, clamped * 100)} 100`"
        />
      </svg>

      <!-- Scroll-position percentage on the left of the chip (only while paused). -->
      <transition name="pct">
        <span v-if="paused" class="text-primary flex items-center gap-3 text-sm font-semibold tabular-nums">
          {{ Math.round(clamped * 100) }}%
          <span class="bg-base-content/15 h-4 w-px"></span>
        </span>
      </transition>

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

// Rounded-rect (pill) outline that starts at 12 o'clock and runs clockwise, so
// the stroke-dasharray fill grows from the top center. Built from the measured
// size so the corners stay circular at any width.
const ringPath = computed(() => {
  // Sit on the pill's 1px border so the accent overlays it rather than forming a
  // second ring just inside it.
  const inset = 0.75;
  const w = size.w - inset * 2;
  const h = size.h - inset * 2;
  if (w <= 0 || h <= 0) return "";
  const r = h / 2;
  const x = inset;
  const y = inset;
  const cx = x + w / 2;
  return [
    `M ${cx} ${y}`, // start at top center
    `H ${x + w - r}`, // top edge, rightward (clockwise)
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`, // top-right corner
    `V ${y + h - r}`, // right edge
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`, // bottom-right corner
    `H ${x + r}`, // bottom edge
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`, // bottom-left corner
    `V ${y + r}`, // left edge
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`, // top-left corner
    "Z", // close back to top center
  ].join(" ");
});
</script>

<style scoped>
.pct-enter-active,
.pct-leave-active {
  transition:
    max-width 220ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 160ms ease;
  overflow: hidden;
  max-width: 6rem;
}
.pct-enter-from,
.pct-leave-to {
  max-width: 0;
  opacity: 0;
}
</style>
