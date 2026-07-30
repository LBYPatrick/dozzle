import type { Container } from "@/models/Container";
import { groupContainers, showAllContainers } from "@/stores/settings";
import { containerGroupKey } from "@/composable/collapsedSections";

/**
 * A collapsible group of containers inside one host's sidebar branch.
 *
 * `key` is what the collapsed-state store remembers, namespaced by host: the
 * same compose project name can legitimately exist on two hosts, and collapsing
 * one must not collapse the other. `label` is what is rendered — an i18n key
 * when it starts with `label.`, otherwise a literal namespace name.
 */
export type ContainerGroup = {
  key: string;
  label: string;
  icon: "stack" | "containers";
  containers: Container[];
};

const byRunningThenName = (a: Container, b: Container) => {
  if (a.state === "running" && b.state !== "running") return -1;
  if (a.state !== "running" && b.state === "running") return 1;
  return a.name.localeCompare(b.name);
};

/**
 * Splits one host's containers into the groups its sidebar branch renders.
 *
 * Pinned containers are included. They also appear in the Pinned section above,
 * so a pinned container is listed twice on purpose: the section is the shortcut,
 * and the row in its host keeps the container where you already know to look for
 * it. The in-place row carries a pin marker so the duplication reads as a state
 * rather than a bug. (This used to exclude them, which meant pinning made a
 * container disappear from the hierarchy it belongs to.)
 */
export function groupContainersForHost(containers: Container[], hostId: string): ContainerGroup[] {
  const namespaced: Record<string, Container[]> = {};
  const singular: Container[] = [];

  for (const container of containers) {
    if (container.host !== hostId) continue;

    if (container.namespace) {
      namespaced[container.namespace] ||= [];
      namespaced[container.namespace].push(container);
    } else {
      singular.push(container);
    }
  }

  const groups: ContainerGroup[] = [];
  for (const [namespace, members] of Object.entries(namespaced).sort(([a], [b]) => a.localeCompare(b))) {
    const shouldGroup =
      groupContainers.value === "always" || (groupContainers.value === "at-least-2" && members.length > 1);

    if (shouldGroup) {
      groups.push({
        key: containerGroupKey(hostId, namespace),
        label: namespace,
        icon: "stack",
        containers: [...members].sort(byRunningThenName),
      });
    } else {
      singular.push(...members);
    }
  }

  if (singular.length > 0) {
    groups.push({
      key: containerGroupKey(hostId, "__containers__"),
      label: showAllContainers.value ? "label.all-containers" : "label.running-containers",
      icon: "containers",
      containers: singular.sort(byRunningThenName),
    });
  }

  return groups;
}
