<template>
  <!-- Floating stand-in for the collapsed top bar. One pill, one button: click
       anywhere to restore the bar. Glass is intentional here — a small floating
       container is one of the few places the design allows blur. -->
  <div class="fixed top-[calc(var(--mobile-nav-height)+0.6rem)] right-4 z-30">
    <button
      type="button"
      class="bg-base-200/85 text-base-content hover:bg-base-200 focus-ring relative flex items-center gap-3 rounded-[var(--control-radius)] py-2 pr-2.5 pl-3.5 shadow-lg backdrop-blur-md transition-[background-color,box-shadow] duration-200 hover:shadow-xl"
      :title="$t('button.expand-top-bar')"
      :aria-label="$t('button.expand-top-bar')"
      @click="$emit('expand')"
    >
      <!-- Circuit on the widget edge: spins indeterminately while logs load
           (unknown progress), otherwise fills clockwise with the scroll-position
           progress once you scroll up from the tail. Radius matches the widget. -->
      <CircuitRing v-if="loading" indeterminate :stroke-width="1.5" :radius="8" />
      <CircuitRing v-else-if="paused" :progress="progress" :stroke-width="1.5" :radius="8" />

      <!-- Scroll-position percentage on the left, while scrolled up. -->
      <transition name="pct">
        <span v-if="paused && !loading" class="text-primary flex items-center gap-3 text-sm font-semibold tabular-nums">
          {{ Math.round(clamped * 100) }}%
          <span class="bg-base-content/15 h-4 w-px"></span>
        </span>
      </transition>

      <span class="text-primary flex items-center gap-1.5">
        <PhCpu class="size-4" />
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
