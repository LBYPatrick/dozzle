import type { Container } from "@/models/Container";
import type { Host } from "@/stores/hosts";

export type HostTotals = {
  /** Running containers on this host. */
  running: Container[];
  /** Percent of the host's cores, 0-100. */
  cpuPercent: number;
  /** The same load in "cores" units, where 100 == one full core. */
  cpuPerCore: number;
  /** Percent of the host's RAM, 0-100. */
  memoryPercent: number;
  /** Bytes resident across the running containers. */
  memoryUsage: number;
};

/**
 * One host's load, summed from the per-container moving averages the store
 * already maintains.
 *
 * Reads `movingAverage`, not `stat`: these figures are read at a glance, and a
 * raw sample jitters every second for no added truth. Because the source is
 * already smoothed, this is a plain computed — no timer, no second EMA.
 */
export function useHostTotals(host: () => Host) {
  const containerStore = useContainerStore();
  const { containers } = storeToRefs(containerStore) as unknown as { containers: Ref<Container[]> };

  return computed<HostTotals>(() => {
    const { id, nCPU, memTotal } = host();
    const running = containers.value.filter((c) => c.host === id && c.state === "running");

    let cpuPerCore = 0;
    let memoryUsage = 0;
    for (const container of running) {
      cpuPerCore += Math.max(0, container.movingAverage.cpu);
      memoryUsage += Math.max(0, container.movingAverage.memoryUsage);
    }

    return {
      running,
      cpuPerCore,
      cpuPercent: nCPU > 0 ? Math.min(cpuPerCore / nCPU, 100) : 0,
      memoryUsage,
      memoryPercent: memTotal > 0 ? Math.min((memoryUsage / memTotal) * 100, 100) : 0,
    };
  });
}
