<template>
  <!-- The log progress bar that spans the bottom of the two-row container bar.
       Determinate: how far back through the loaded history you've scrolled
       (driven by the visible line's timestamp in LogList). The percentage and
       date readout live in the bar's second row, not here. -->
  <div class="bg-base-content/10 h-[3px] w-full overflow-hidden">
    <div
      class="bg-primary h-full rounded-r-full transition-[width] duration-200 ease-out"
      :style="{ width: `${clamped * 100}%` }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
const { progress } = defineProps<{ progress: number }>();

const clamped = computed(() => Math.min(1, Math.max(0, progress)));
</script>
