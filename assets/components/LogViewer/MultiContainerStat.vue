<template>
  <!-- self-stretch: the bar row centres its children, so without this the
       cards size to their content and the expanded trends get no height. -->
  <div class="flex min-w-0 items-stretch gap-2.5 self-stretch">
    <!-- Each widget sits in a slot that animates its own width. The forms are
         different sizes and the network widget swaps components outright
         between them, so the slot — not the card — is what has to be measured
         and driven across the change. -->
    <div ref="ioSlot" class="stat-slot">
      <IOCard
        v-if="ioStatMode === 'current'"
        mode="current"
        :network-rx="networkRate.rx"
        :network-tx="networkRate.tx"
        :disk-read="diskRate.read"
        :disk-write="diskRate.write"
        :network-series="networkSeries"
        :disk-series="diskSeries"
        :unavailable="!hasStats"
        @cycle="cycleIoMode"
      />
      <StatSummaryCard
        v-else
        ref="ioCard"
        :rows="ioRows"
        :variant="ioStatMode === 'chart' ? 'chart' : 'meter'"
        :title="ioTooltip"
        :unavailable="!hasStats"
        class="max-md:hidden"
        @cycle="cycleIoMode"
      />
    </div>

    <!-- CPU and memory: one card in both forms, so expanding does not move the
         figures — only the middle column changes from a meter to its trend. -->
    <div ref="resourceSlot" class="stat-slot">
      <StatSummaryCard
        ref="resourceCard"
        :rows="resourceRows"
        :variant="compactStats ? 'meter' : 'chart'"
        :title="summaryTooltip"
        :unavailable="!hasStats"
        class="max-md:hidden"
        @cycle="cycleResourceMode"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Container, Stat, emptyStat } from "@/models/Container";
import IOCard from "@/components/LogViewer/IOCard.vue";
import StatSummaryCard, { type StatSummaryRow } from "@/components/LogViewer/StatSummaryCard.vue";
import PhCpu from "~icons/ph/cpu";
import PhMemory from "~icons/ph/memory";
import PhNetwork from "~icons/ph/network";
import PhHardDrives from "~icons/ph/hard-drives";

const { containers } = defineProps<{
  containers: Container[];
}>();

const { t } = useI18n();

const totalStat = ref<Stat>(emptyStat());
const { history, reset } = useSimpleRefHistory(totalStat, { capacity: 300 });
const { hosts } = useHosts();
const resourceCard = useTemplateRef<{ recalculate: () => void }>("resourceCard");
const ioCard = useTemplateRef<{ recalculate: () => void }>("ioCard");

const resourceSlot = useTemplateRef<HTMLElement>("resourceSlot");
const ioSlot = useTemplateRef<HTMLElement>("ioSlot");
useAnimatedWidth(resourceSlot, () => resourceStatMode.value);
useAnimatedWidth(ioSlot, () => ioStatMode.value);
const networkRate = ref({ rx: 0, tx: 0 });
const diskRate = ref({ read: 0, write: 0 });

const roundCPU = (num: number) => (Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1));

// Raw per-core CPU total (100 == one core) used for the "cores" (Linux style) display.
const rawCpuTotal = computed(() =>
  Math.max(
    0,
    containers.reduce((acc, container) => acc + container.stat.cpu, 0),
  ),
);
// Ratio between the per-core total and the whole-CPU utilization total, so historical
// (hovered) utilization values can be rescaled to the per-core form.
const cpuScale = computed(() => (totalStat.value.cpu > 0 ? rawCpuTotal.value / totalStat.value.cpu : 1));

function toContainerCores(container: Container): number {
  if (container.cpuLimit && container.cpuLimit > 0) {
    return container.cpuLimit;
  }
  const hostInfo = hosts.value[container.host];
  return hostInfo?.nCPU ?? 1;
}

watch(
  () => containers,
  () => {
    const initial: Stat[] = [];
    for (let i = 1; i <= 300; i++) {
      const stat = containers.reduce((acc, container) => {
        const item = container.statsHistory.at(-i);
        if (!item) {
          return acc;
        }
        const cores = toContainerCores(container);
        return {
          cpu: acc.cpu + item.cpu / cores,
          memory: acc.memory + item.memory,
          memoryUsage: acc.memoryUsage + item.memoryUsage,
          networkRxTotal: acc.networkRxTotal + item.networkRxTotal,
          networkTxTotal: acc.networkTxTotal + item.networkTxTotal,
          diskReadTotal: acc.diskReadTotal + item.diskReadTotal,
          diskWriteTotal: acc.diskWriteTotal + item.diskWriteTotal,
        };
      }, emptyStat());
      initial.push(stat);
    }
    totalStat.value = initial[0];
    reset({ initial: initial.reverse() });
    // Charts cache their downsampled bars and only patch the last bar per tick;
    // a container switch replaces the whole series, so force a full recalculate.
    nextTick(() => {
      resourceCard.value?.recalculate();
      ioCard.value?.recalculate();
    });
  },
  { immediate: true },
);

const limits = computed(() => {
  const containersByHost = new Map<string, Container[]>();
  containers.forEach((container) => {
    if (!containersByHost.has(container.host)) {
      containersByHost.set(container.host, []);
    }
    containersByHost.get(container.host)!.push(container);
  });

  let totalCpu = 0;
  let totalMemory = 0;

  containersByHost.forEach((hostContainers, hostId) => {
    const hostInfo = hosts.value[hostId];
    const hostTotalMemory = hostInfo?.memTotal || 0;
    const hostTotalCpu = hostInfo?.nCPU || 0;

    const hasUnlimitedCpu = hostContainers.some((c) => !c.cpuLimit || c.cpuLimit <= 0);
    const hasUnlimitedMemory = hostContainers.some((c) => !c.memoryLimit);

    if (hasUnlimitedCpu) {
      totalCpu += hostTotalCpu;
    } else {
      const sumCpu = hostContainers.reduce((sum, c) => sum + (c.cpuLimit || 0), 0);
      totalCpu += Math.min(sumCpu, hostTotalCpu);
    }

    if (hasUnlimitedMemory) {
      totalMemory += hostTotalMemory;
    } else {
      const sumMemory = hostContainers.reduce((sum, c) => sum + (c.memoryLimit || 0), 0);
      totalMemory += Math.min(sumMemory, hostTotalMemory);
    }
  });

  return { cpu: totalCpu, memory: totalMemory };
});

useIntervalFn(() => {
  const previousStat = totalStat.value;
  totalStat.value = containers.reduce((acc, container) => {
    const cores = toContainerCores(container);
    return {
      cpu: acc.cpu + container.stat.cpu / cores,
      memory: acc.memory + container.stat.memory,
      memoryUsage: acc.memoryUsage + container.stat.memoryUsage,
      networkRxTotal: acc.networkRxTotal + container.stat.networkRxTotal,
      networkTxTotal: acc.networkTxTotal + container.stat.networkTxTotal,
      diskReadTotal: acc.diskReadTotal + container.stat.diskReadTotal,
      diskWriteTotal: acc.diskWriteTotal + container.stat.diskWriteTotal,
    };
  }, emptyStat());

  networkRate.value = {
    rx: Math.max(0, totalStat.value.networkRxTotal - previousStat.networkRxTotal),
    tx: Math.max(0, totalStat.value.networkTxTotal - previousStat.networkTxTotal),
  };
  diskRate.value = {
    read: Math.max(0, totalStat.value.diskReadTotal - previousStat.diskReadTotal),
    write: Math.max(0, totalStat.value.diskWriteTotal - previousStat.diskWriteTotal),
  };
}, 1000);

const cpuData = computed(() =>
  history.value.map((stat) => ({
    percent: Math.max(0, stat.cpu),
    value: Math.max(0, stat.cpu),
  })),
);

const memoryData = computed(() =>
  history.value.map((stat) => ({
    percent: stat.memory,
    value: stat.memoryUsage,
  })),
);

// Compact mode drops the sparkline, so the cards no longer need to be wide
// enough to plot one.
const compactStats = computed(() => resourceStatMode.value === "summary");
// A stopped container reports nothing. Zeros would read as "idle"; the cards say
// so instead.
const hasStats = computed(() => containers.some((container) => container.state === "running"));

// CPU history is stored as whole-CPU utilization; the readout may be showing the
// per-core form instead, so summarize in whatever unit is on screen.
const formatCpu = (value: number) => cpuDisplayValue(value, value * cpuScale.value).toFixed(1);
const cpuSummary = computed(() => summarize(history.value.map((stat) => Math.max(0, stat.cpu))));
const memorySummary = computed(() => summarize(history.value.map((stat) => stat.memoryUsage)));

// Network and disk are cumulative counters, so their rate series is the
// difference between neighbouring samples.
const networkRates = computed(() =>
  ratesFromTotals(history.value, (stat) => stat.networkRxTotal + stat.networkTxTotal),
);
const diskRates = computed(() => ratesFromTotals(history.value, (stat) => stat.diskReadTotal + stat.diskWriteTotal));
const networkSummary = computed(() => summarize(networkRates.value));
const diskSummary = computed(() => summarize(diskRates.value));
const toSeries = (rates: number[]) => rates.map((value) => ({ percent: value, value }));
const summaryTooltip = computed(
  () =>
    t("toolbar.stat-columns-resource") +
    "\n" +
    t("tooltip.cpu-usage", {
      cpu: cpuDisplayValue(totalStat.value.cpu, rawCpuTotal.value).toFixed(2),
      cores: roundCPU(limits.value.cpu),
    }) +
    "\n" +
    t("tooltip.memory-usage", {
      used: formatBytes(totalStat.value.memoryUsage),
      total: formatBytes(limits.value.memory),
    }),
);

const networkSeries = computed(() => toSeries(networkRates.value));
const diskSeries = computed(() => toSeries(diskRates.value));

const ioTooltip = computed(
  () =>
    t("toolbar.stat-columns-io-2") +
    "\n" +
    t("tooltip.network-io", { tx: formatBytes(networkRate.value.tx), rx: formatBytes(networkRate.value.rx) }) +
    "\n" +
    t("tooltip.disk-io", { write: formatBytes(diskRate.value.write), read: formatBytes(diskRate.value.read) }),
);

const rate = (bytes: number) => `${formatBytes(bytes, { short: true, decimals: 1 })}/s`;

// CPU is reported either as whole-CPU utilization (0-100) or Linux-style
// per-core (100 == one core); the ceiling the meter is drawn against has to
// follow whichever form is on screen.
const cpuCeiling = computed(() => (cpuDisplayMode.value === "cores" ? Math.max(1, limits.value.cpu) * 100 : 100));
const cpuNow = computed(() => cpuDisplayValue(totalStat.value.cpu, rawCpuTotal.value));

// Nothing running means no measurement — but the ceiling is a property of the
// host, so it is still reported.
const na = computed(() => t("label.not-available"));
const measured = (label: string) => (hasStats.value ? label : na.value);

const resourceRows = computed<StatSummaryRow[]>(() => [
  {
    icon: PhCpu,
    label: t("label.cpu"),
    currentLabel: measured(`${cpuNow.value.toFixed(1)}%`),
    peakLabel: measured(`${formatCpu(cpuSummary.value.max)}%`),
    totalLabel: `${roundCPU(limits.value.cpu)} CPU`,
    value: cpuNow.value,
    peak: cpuDisplayValue(cpuSummary.value.max, cpuSummary.value.max * cpuScale.value),
    total: cpuCeiling.value,
    series: cpuData.value,
    tone: "primary",
  },
  {
    icon: PhMemory,
    label: t("label.mem"),
    currentLabel: measured(formatBytes(totalStat.value.memoryUsage, { short: true, decimals: 1 })),
    peakLabel: measured(formatBytes(memorySummary.value.max, { short: true, decimals: 1 })),
    totalLabel: formatBytes(limits.value.memory, { short: true, decimals: 1 }),
    value: totalStat.value.memoryUsage,
    peak: memorySummary.value.max,
    total: limits.value.memory,
    series: memoryData.value,
    tone: "secondary",
  },
]);

const ioRows = computed<StatSummaryRow[]>(() => [
  {
    icon: PhNetwork,
    label: t("label.net"),
    currentLabel: measured(rate(networkRate.value.rx + networkRate.value.tx)),
    peakLabel: measured(rate(networkSummary.value.max)),
    value: networkRate.value.rx + networkRate.value.tx,
    peak: networkSummary.value.max,
    // Throughput has no ceiling to report, so the meter is drawn against the
    // window's peak and there is no third figure.
    total: networkSummary.value.max,
    series: networkSeries.value,
    tone: "primary",
  },
  {
    icon: PhHardDrives,
    label: t("label.disk"),
    currentLabel: measured(rate(diskRate.value.read + diskRate.value.write)),
    peakLabel: measured(rate(diskSummary.value.max)),
    value: diskRate.value.read + diskRate.value.write,
    peak: diskSummary.value.max,
    total: diskSummary.value.max,
    series: diskSeries.value,
    tone: "secondary",
  },
]);

// Clicking a widget walks it to its next form, so the actions menu is not the
// only way to switch. CPU/memory has two forms; throughput also has the live
// per-direction rate.
const cycleResourceMode = () => (resourceStatMode.value = resourceStatMode.value === "summary" ? "chart" : "summary");
const IO_MODES = ["summary", "current", "chart"] as const;
const cycleIoMode = () => {
  const next = (IO_MODES.indexOf(ioStatMode.value) + 1) % IO_MODES.length;
  ioStatMode.value = IO_MODES[next];
};
</script>

<style scoped>
.stat-slot {
  display: flex;
  min-width: 0;
  align-items: stretch;
  /* The slot is driven to an explicit width while it animates; clip so the
     card inside never spills past it mid-transition. */
  overflow: hidden;
}
</style>
