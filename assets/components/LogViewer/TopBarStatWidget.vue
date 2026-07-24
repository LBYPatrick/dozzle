<template>
  <!-- Floating stand-in for the collapsed top bar. One pill, one button: click
       anywhere to restore the bar. Glass is intentional here — a small floating
       container is one of the few places the design allows blur. -->
  <div class="fixed top-[calc(var(--mobile-nav-height)+0.6rem)] right-4 z-30">
    <button
      type="button"
      class="bg-base-200/85 text-base-content hover:bg-base-200 focus-visible:ring-primary/60 relative flex items-center gap-3 rounded-full py-2 pr-2.5 pl-3.5 shadow-lg backdrop-blur-md transition-[background-color,box-shadow] duration-200 hover:shadow-xl focus:outline-none focus-visible:ring-2"
      :title="$t('button.expand-top-bar')"
      :aria-label="$t('button.expand-top-bar')"
      @click="$emit('expand')"
    >
      <!-- Spinning "circuit" while logs load (progress is unknown). Drawn on the
           pill edge so it reads as an animated border. -->
      <CircuitRing v-if="loading" indeterminate :stroke-width="1.5" />

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

const { containers, loading = false } = defineProps<{ containers: Container[]; loading?: boolean }>();

defineEmits<{ expand: [] }>();

const { cpu, memoryUsage } = useLiveStatTotals(() => containers);
</script>
