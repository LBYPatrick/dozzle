<template>
  <!-- The whole fleet in one line of figures, and the first thing on the page,
       because "is everything OK?" is the question you arrive with. The old
       dashboard never answered it — it opened straight into per-host cards and
       left you to add them up.

       One surface, hairline-divided. The 1px grid gap over a tinted parent is
       what draws the dividers: it needs no per-cell border logic and it stays
       correct when the columns reflow. -->
  <section
    class="summary grid gap-px overflow-hidden rounded-lg"
    :class="showHosts ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'"
  >
    <MetricCell
      :label="$t('label.containers')"
      :value="`${running.length}`"
      :unit="`/ ${containers.length}`"
      :sub="$t('label.running-containers')"
    >
      <StateRibbon :segments="stateSegments" />
    </MetricCell>

    <MetricCell :label="$t('label.cpu')" :value="`${cpuValue.toFixed(1)}%`" :sub="cpuSub">
      <BarChart class="h-8 w-full" shape="area" tone-class="text-primary" :chart-data="cpuHistory" />
    </MetricCell>

    <MetricCell
      :label="$t('label.mem')"
      :value="formatBytes(totals.memoryUsage, { decimals: 1, short: true })"
      :unit="`/ ${formatBytes(memTotal, { decimals: 1, short: true })}`"
      :sub="`${totals.memoryUtilization.toFixed(1)}%`"
    >
      <BarChart class="h-8 w-full" shape="area" tone-class="text-secondary" :chart-data="memoryHistory" />
    </MetricCell>

    <!-- Only earns a cell when there is more than one host. With a single host
         "1 / 1 online" is a fact nobody needed; the three figures beside it
         already describe that machine. -->
    <MetricCell
      v-if="showHosts"
      :label="$t('label.hosts')"
      :value="`${hostList.length}`"
      :sub="$t('label.hosts-online', { count: onlineHosts })"
    >
      <StateRibbon :segments="hostSegments" />
    </MetricCell>
  </section>
</template>

<script setup lang="ts">
import type { Container } from "@/models/Container";
import type { Host } from "@/stores/hosts";
import type { StateSegment } from "@/components/Dashboard/StateRibbon.vue";

const { containers } = defineProps<{
  /** Every container in every state. The running subset is derived here so the
      tally and the totals can never disagree about what they counted. */
  containers: Container[];
}>();

const { t } = useI18n();
const { hosts } = useHosts();

const hostList = computed(() => Object.values(hosts.value) as Host[]);
const onlineHosts = computed(() => hostList.value.filter((host) => host.available).length);
const showHosts = computed(() => hostList.value.length > 1);

const running = computed(() => containers.filter((container) => container.state === "running"));

const { totals, cpuHistory, memoryHistory, cores, memTotal } = useFleetStats(() => running.value);

const cpuValue = computed(() => cpuDisplayValue(totals.value.cpuUtilization, totals.value.cpuPerCore));
const cpuPeak = computed(() => Math.max(0, ...cpuHistory.value.map((point) => point.value)));

// Capacity and peak on one line rather than one of them riding the figure's
// baseline, where "4.2%" next to "24 CPU" reads as a pair of numbers that
// belong to each other. They don't.
const cpuSub = computed(() => `${cores.value} CPU · ${t("label.max")} ${cpuPeak.value.toFixed(1)}%`);

// Anything neither running nor plainly stopped gets its own slice, so a restart
// loop or a paused container stays visible instead of being averaged away.
const stateSegments = computed<StateSegment[]>(() => {
  const count = (...states: string[]) => containers.filter((c) => states.includes(c.state)).length;
  return [
    { key: "running", label: t("label.running-containers"), count: running.value.length, class: "bg-success" },
    { key: "paused", label: "paused", count: count("paused"), class: "bg-warning" },
    { key: "restarting", label: "restarting", count: count("restarting"), class: "bg-info" },
    {
      key: "stopped",
      label: "stopped",
      count: count("exited", "dead", "created", "removing"),
      class: "bg-base-content/25",
    },
  ];
});

const hostSegments = computed<StateSegment[]>(() => [
  {
    key: "online",
    label: t("label.hosts-online", { count: onlineHosts.value }),
    count: onlineHosts.value,
    class: "bg-success",
  },
  {
    key: "offline",
    label: t("label.host-unavailable"),
    count: hostList.value.length - onlineHosts.value,
    class: "bg-error",
  },
]);
</script>

<style scoped>
/* The parent tint is what shows through the 1px gaps, so it is the divider
   colour — not a background anyone sees. */
.summary {
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
}

@media (prefers-contrast: more) {
  .summary {
    background-color: color-mix(in oklab, var(--color-base-content) 35%, transparent);
  }
}
</style>
