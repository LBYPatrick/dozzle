import type { Container } from "@/models/Container";
import type { Host } from "@/stores/hosts";

export type FleetTotals = {
  /** Percent of every host's combined cores, 0-100. */
  cpuUtilization: number;
  /** The same load in "cores" units, where 100 == one full core. */
  cpuPerCore: number;
  /** Percent of every host's combined RAM, 0-100. */
  memoryUtilization: number;
  /** Bytes resident across every running container. */
  memoryUsage: number;
};

const ZERO: FleetTotals = { cpuUtilization: 0, cpuPerCore: 0, memoryUtilization: 0, memoryUsage: 0 };

/**
 * Rolls one sample up against the fleet's capacity.
 *
 * `stat.cpu` is already per-core (100 == one full core), which is why summing it
 * and dividing by the fleet's core count gives utilization directly. Capacity
 * comes from the hosts, never from a container's `cpuLimit`: a limit caps what
 * one container may take, it does not shrink the machine.
 */
export function fleetTotals(
  samples: { cpu: number; memoryUsage: number }[],
  cores: number,
  memTotal: number,
): FleetTotals {
  let cpuPerCore = 0;
  let memoryUsage = 0;
  for (const sample of samples) {
    cpuPerCore += Math.max(0, sample.cpu);
    memoryUsage += Math.max(0, sample.memoryUsage);
  }

  return {
    cpuPerCore,
    cpuUtilization: cores > 0 ? Math.min(cpuPerCore / cores, 100) : 0,
    memoryUsage,
    memoryUtilization: memTotal > 0 ? Math.min((memoryUsage / memTotal) * 100, 100) : 0,
  };
}

/**
 * Live fleet-wide CPU and memory, sampled once a second into the same 300-point
 * rolling window every other chart in the app draws from.
 *
 * Seeded from each container's recorded `statsHistory`, so the sparklines arrive
 * with a past instead of drawing themselves in over the first five minutes.
 */
export function useFleetStats(containers: () => Container[], capacity = 300) {
  const { hosts } = useHosts();

  const hostList = computed(() => Object.values(hosts.value) as Host[]);
  const cores = computed(() => hostList.value.reduce((sum, host) => sum + (host.nCPU ?? 0), 0));
  const memTotal = computed(() => hostList.value.reduce((sum, host) => sum + (host.memTotal ?? 0), 0));

  const totals = ref<FleetTotals>(ZERO);
  const { history, reset } = useSimpleRefHistory(totals, { capacity });

  const cpuHistory = computed(() =>
    history.value.map((stat) => ({ percent: stat.cpuUtilization, value: stat.cpuUtilization })),
  );
  const memoryHistory = computed(() =>
    history.value.map((stat) => ({ percent: stat.memoryUtilization, value: stat.memoryUsage })),
  );

  // Replay the recorded per-container history as fleet samples, oldest first,
  // whenever the set of containers changes. Ticks nothing has a sample for are
  // skipped rather than charted as a dip to zero.
  watch(
    // Joined, not an array: a fresh array is never Object.is-equal, so the
    // watcher would re-seed the whole window on every unrelated recompute.
    () =>
      containers()
        .map((container) => container.id)
        .join(),
    () => {
      const seeded: FleetTotals[] = [];
      for (let i = capacity; i >= 1; i--) {
        const samples = containers()
          .map((container) => container.statsHistory.at(-i))
          .filter((stat) => stat !== undefined);
        if (samples.length === 0) continue;
        seeded.push(fleetTotals(samples, cores.value, memTotal.value));
      }
      reset({ initial: seeded });
    },
    { immediate: true },
  );

  useIntervalFn(() => {
    totals.value = fleetTotals(
      containers().map((container) => container.stat),
      cores.value,
      memTotal.value,
    );
  }, 1000);

  return { totals, cpuHistory, memoryHistory, cores, memTotal };
}
