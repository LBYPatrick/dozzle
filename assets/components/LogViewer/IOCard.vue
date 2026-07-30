<template>
  <!-- Network and disk throughput. Shares the compact stat card's chrome, name
       column and typography with StatSummaryCard so the two widgets in the bar
       read as one pair rather than two unrelated pills — each row is
       "what it is, then the numbers", at the same baseline and the same
       column positions. -->
  <button
    type="button"
    class="stat-card io-card focus-fill group/stat min-w-0 max-md:hidden @max-5xl:hidden"
    :class="[gridClass, { unavailable }]"
    :title="`${tooltip}\n\n${$t('toolbar.stat-cycle')}`"
    @click="$emit('cycle')"
  >
    <!-- Live per-second rate, split by direction. -->
    <template v-if="mode === 'current'">
      <PhNetwork class="text-primary size-3.5" />
      <span class="name">{{ $t("label.net") }}</span>
      <PhArrowUp class="text-base-content/45 size-3" />
      <span class="value">{{ measured(rate(networkTx)) }}</span>
      <PhArrowDown class="text-base-content/45 size-3" />
      <span class="value">{{ measured(rate(networkRx)) }}</span>

      <PhHardDrives class="text-secondary size-3.5" />
      <span class="name">{{ $t("label.disk") }}</span>
      <PhArrowUp class="text-base-content/45 size-3" />
      <span class="value">{{ measured(rate(diskWrite)) }}</span>
      <PhArrowDown class="text-base-content/45 size-3" />
      <span class="value">{{ measured(rate(diskRead)) }}</span>
    </template>

    <!-- Trend over the tracked window, matching the CPU/memory sparklines. -->
    <template v-else>
      <PhNetwork class="text-primary size-3.5" />
      <span class="name">{{ $t("label.net") }}</span>
      <BarChart
        :chart-data="networkSeries"
        :shape="trendShape"
        bar-class="bg-primary opacity-80"
        tone-class="text-primary"
        class="h-4 w-20"
      />
      <span class="value">{{ rate(networkTx + networkRx) }}</span>

      <PhHardDrives class="text-secondary size-3.5" />
      <span class="name">{{ $t("label.disk") }}</span>
      <BarChart
        :chart-data="diskSeries"
        :shape="trendShape"
        bar-class="bg-secondary opacity-80"
        tone-class="text-secondary"
        class="h-4 w-20"
      />
      <span class="value">{{ rate(diskWrite + diskRead) }}</span>
    </template>
  </button>
</template>

<script lang="ts" setup>
import BarChart, { type BarDataPoint } from "@/components/BarChart.vue";
import PhNetwork from "~icons/ph/network";
import PhHardDrives from "~icons/ph/hard-drives";
import PhArrowUp from "~icons/ph/arrow-up";
import PhArrowDown from "~icons/ph/arrow-down";

defineEmits<{ cycle: [] }>();

const {
  mode,
  networkRx,
  networkTx,
  diskRead,
  diskWrite,
  unavailable = false,
} = defineProps<{
  mode: "current" | "chart";
  /** No running container to report on: show N/A instead of zeros. */
  unavailable?: boolean;
  networkRx: number;
  networkTx: number;
  diskRead: number;
  diskWrite: number;
  networkSeries: BarDataPoint[];
  diskSeries: BarDataPoint[];
}>();

const gridClass = computed(() => {
  switch (mode) {
    case "current":
      return "grid-cols-[auto_2.1rem_auto_4rem_auto_4rem]";
    case "chart":
      return "grid-cols-[auto_2.1rem_minmax(2rem,1fr)_4.5rem]";
  }
});

const { t } = useI18n();
const measured = (label: string) => (unavailable ? t("label.not-available") : label);

const rate = (bytes: number) => `${formatBytes(bytes, { short: true, decimals: 1 })}/s`;

const tooltip = computed(
  () =>
    t("tooltip.network-io", { tx: formatBytes(networkTx), rx: formatBytes(networkRx) }) +
    "\n" +
    t("tooltip.disk-io", { write: formatBytes(diskWrite), read: formatBytes(diskRead) }),
);
</script>

<style scoped>
@reference "@/main.css";

.io-card {
  text-align: left;
  cursor: pointer;
  transition: background-color 0.18s ease;
}

.io-card.unavailable .name,
.io-card.unavailable .value,
.io-card.unavailable > svg {
  opacity: 0.55;
}

.io-card:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
}

/* Focus comes from the shared .focus-fill language in main.css. */
.io-card:focus {
  outline: none;
}

.value {
  @apply text-base-content text-right text-[12px] font-semibold whitespace-nowrap;
}
</style>
