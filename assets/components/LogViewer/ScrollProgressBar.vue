<template>
  <!-- The log progress bar that spans the bottom of the two-row container bar.
       Determinate: how far back through the loaded history you've scrolled
       (driven by the visible line's timestamp in LogList). The percentage and
       date readout live in the bar's second row, not here. -->
  <div class="bg-base-content/10 relative h-[3px] w-full overflow-hidden">
    <div class="fill absolute inset-y-0 left-0 rounded-r-full" :style="{ width: `${clamped * 100}%` }">
      <!-- A sheen that travels the length of the filled span, so the bar reads
           as live even while the scroll position is momentarily still. -->
      <div class="sheen absolute inset-0"></div>
      <!-- Leading edge highlight: a soft cap that lands where progress stops. -->
      <div class="bg-primary absolute inset-y-0 right-0 w-1.5 rounded-full blur-[1px]"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { progress } = defineProps<{ progress: number }>();

const clamped = computed(() => Math.min(1, Math.max(0, progress)));
</script>

<style scoped>
@reference "@/main.css";

.fill {
  @apply bg-primary;
  /* Spring-ish easing so a jump in scroll position settles instead of snapping. */
  transition: width 320ms cubic-bezier(0.32, 0.72, 0, 1);
}

.sheen {
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in oklab, var(--color-base-100) 70%, transparent) 50%,
    transparent 100%
  );
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: progress-sheen 1.8s ease-in-out infinite;
}

@keyframes progress-sheen {
  0% {
    background-position: -60% 0;
  }
  100% {
    background-position: 160% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fill {
    transition: none;
  }
  .sheen {
    animation: none;
  }
}
</style>
