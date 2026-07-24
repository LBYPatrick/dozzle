<template>
  <!-- Determinate scroll-position progress for the expanded top bar: a thin
       primary line spanning the bar's width, with a small readout pill at the
       trailing edge. Meant to be overlaid at the bar's bottom border. -->
  <div class="relative">
    <div class="bg-base-content/10 h-[3px] w-full overflow-hidden">
      <div
        class="bg-primary h-full rounded-r-full transition-[width] duration-200 ease-out"
        :style="{ width: `${clamped * 100}%` }"
      ></div>
    </div>
    <div
      class="border-base-content/10 bg-base-100/85 absolute top-1.5 right-3 flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs shadow-sm backdrop-blur"
    >
      <span class="text-primary font-semibold tabular-nums">{{ Math.ceil(clamped * 100) }}%</span>
      <RelativeTime :date="date" class="text-base-content/50 whitespace-nowrap" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { progress, date } = defineProps<{ progress: number; date: Date }>();

const clamped = computed(() => Math.min(1, Math.max(0, progress)));
</script>
