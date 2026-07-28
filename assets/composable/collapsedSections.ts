/**
 * Collapsed state for every sidebar outline node.
 *
 * All four sidebar menus (hosts, swarm, kubernetes, custom groups) share one
 * persisted set. Keys are prefixed by kind — `host:`, `hostgroup:`, `group:`,
 * `stack:`, `ns:` — so a host and a stack of the same name can't collapse each
 * other, and so the whole sidebar's state round-trips through the one profile
 * field that already syncs to the server.
 */
export const hostKey = (hostId: string) => `host:${hostId}`;
export const hostGroupKey = (name: string) => `hostgroup:${name}`;
export const containerGroupKey = (hostId: string, name: string) => `group:${hostId}::${name}`;
export const stackKey = (name: string) => `stack:${name}`;
export const namespaceKey = (name: string) => `ns:${name}`;

export function useCollapsedSections() {
  const collapsed = useProfileStorage("collapsedGroups", new Set<string>());

  const isOpen = (key: string) => !collapsed.value.has(key);

  const setOpen = (key: string, open: boolean) => {
    if (open) {
      collapsed.value.delete(key);
    } else {
      collapsed.value.add(key);
    }
  };

  const setAll = (keys: string[], open: boolean) => keys.forEach((key) => setOpen(key, open));

  const allCollapsed = (keys: string[]) => keys.length > 0 && keys.every((key) => collapsed.value.has(key));

  /**
   * Toggles a whole menu between fully collapsed and fully expanded, and drops
   * focus so the just-collapsed row doesn't keep its hover actions revealed.
   */
  const toggleAll = (keys: string[]) => {
    setAll(keys, allCollapsed(keys));
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return { collapsed, isOpen, setOpen, setAll, allCollapsed, toggleAll };
}
