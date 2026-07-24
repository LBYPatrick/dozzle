import type { Container } from "@/models/Container";
import { cpuDisplayValue } from "@/composable/cpuDisplay";

// Lightweight, current-value stat aggregation for the collapsed top-bar widget.
// Unlike MultiContainerStat this keeps no history and builds no charts — it just
// sums the smoothed CPU/memory across the given containers, so the widget stays
// cheap to render while the bar is collapsed.
export function useLiveStatTotals(containers: () => Container[]) {
  const { hosts } = useHosts();

  // Cores the container is scheduled against: its own limit when set, else the
  // host core count (fallback 1). Used to turn the per-core CPU value (100 == one
  // core) into whole-CPU utilization.
  const coresFor = (container: Container) => {
    if (container.cpuLimit && container.cpuLimit > 0) return container.cpuLimit;
    return hosts.value[container.host]?.nCPU ?? 1;
  };

  const running = computed(() => containers().filter((c) => c.state === "running"));

  // Whole-CPU utilization (0-100 summed across containers).
  const cpuUtilization = computed(() =>
    running.value.reduce((total, c) => total + c.movingAverage.cpu / coresFor(c), 0),
  );
  // Per-core total (100 == one core) for the "cores" display style.
  const cpuPerCore = computed(() => running.value.reduce((total, c) => total + c.movingAverage.cpu, 0));

  // Respects the cpuDisplayMode setting, matching the expanded stat card.
  const cpu = computed(() => Math.max(0, cpuDisplayValue(cpuUtilization.value, cpuPerCore.value)));

  const memoryUsage = computed(() => running.value.reduce((total, c) => total + c.movingAverage.memoryUsage, 0));

  const hasStats = computed(() => running.value.length > 0);

  return { cpu, memoryUsage, hasStats };
}
