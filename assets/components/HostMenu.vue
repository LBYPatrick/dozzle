<template>
  <!-- The row that used to say "Hosts" next to an overflow menu. The word only
       repeated what the tree below it already showed, and burying two switches
       one click deep made them feel optional; both now live on the row itself. -->
  <div class="mb-1 flex items-center justify-end">
    <ShowAllContainersToggle />
    <CollapseControls :keys="allKeys" />
  </div>

  <!-- One outline, top to bottom: host group -> host -> container group ->
       container. There is no separate hosts screen to drill into and back out
       of any more; everything a host holds is reachable by expanding it. -->
  <ul class="menu sidebar-menu">
    <!-- The section exists only while something is pinned, so pinning the first
         container brings the header with it. -->
    <Transition name="pin-section">
      <MenuSection
        v-if="pinnedItems.length > 0"
        :title="$t('label.pinned')"
        :count="pinnedItems.length"
        :open="isOpen(PINNED_KEY)"
        @update:open="setOpen(PINNED_KEY, $event)"
      >
        <!-- The same pushpin the container title toggles, in the same red, so the
             two ends of the gesture are visibly one feature. `map-pin-simple` was
             a location pin — a different object entirely. -->
        <template #icon>
          <ph:push-pin-fill class="text-pin size-4 shrink-0" />
        </template>
        <TransitionGroup name="pin-row">
          <ContainerMenuItem v-for="item in pinnedItems" :key="item.id" :container="item" in-pinned-section />
        </TransitionGroup>
      </MenuSection>
    </Transition>

    <template v-for="[groupName, groupHosts] in groupedHostEntries" :key="groupName || UNGROUPED_KEY">
      <MenuSection
        v-if="groupName"
        variant="host"
        :title="groupName"
        :count="groupHosts.length"
        :open="isOpen(hostGroupKey(groupName))"
        @update:open="setOpen(hostGroupKey(groupName), $event)"
      >
        <template #icon>
          <ph:buildings class="size-4 shrink-0 opacity-70" />
        </template>
        <template #actions>
          <router-link
            :to="{ name: '/host-group/[name]', params: { name: groupName } }"
            class="btn btn-square btn-ghost btn-xs text-primary"
            active-class="menu-active"
            :title="$t('tooltip.merge-all')"
            @click.stop
          >
            <ph:arrows-merge />
          </router-link>
        </template>
        <HostNode v-for="host in groupHosts" :key="host.id" :host="host" />
      </MenuSection>
      <HostNode v-else v-for="host in groupHosts" :key="host.id" :host="host" />
    </template>
  </ul>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";

const containerStore = useContainerStore();
const { visibleContainers } = storeToRefs(containerStore);

const { hosts } = useHosts();

// The pinned section's collapse key. Every other key is built by the prefixed
// helpers in useCollapsedSections, so nothing here can collide with a host,
// stack, or namespace of the same name.
const PINNED_KEY = "pinned";
// v-for key for the bucket of hosts that belong to no host group.
const UNGROUPED_KEY = "__ungrouped__";

const groupedHostEntries = computed(() => {
  const groups: Record<string, (typeof hosts.value)[string][]> = {};
  const ungrouped: (typeof hosts.value)[string][] = [];

  for (const host of Object.values(hosts.value)) {
    if (host.group) {
      groups[host.group] ||= [];
      groups[host.group].push(host);
    } else {
      ungrouped.push(host);
    }
  }

  const entries = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)) as [string, typeof ungrouped][];
  if (ungrouped.length > 0) {
    entries.push(["", ungrouped]);
  }
  return entries;
});

const { isOpen, setOpen } = useCollapsedSections();

// Pinned containers are pinned regardless of which host they live on, so they
// sit above the host tree rather than inside one host's branch.
const debouncedPinnedContainers = debouncedRef(pinnedContainers, 200);
const sorter = (a: Container, b: Container) => {
  if (a.state === "running" && b.state !== "running") return -1;
  if (a.state !== "running" && b.state === "running") return 1;
  return a.name.localeCompare(b.name);
};

const pinnedItems = computed(() =>
  visibleContainers.value.filter((c) => debouncedPinnedContainers.value?.has(c.name)).sort(sorter),
);

// Every collapsible key currently on screen, so the collapse/expand pair knows
// what it is operating on and when it has reached either extreme.
const allKeys = computed(() => {
  const keys: string[] = [];
  if (pinnedItems.value.length > 0) keys.push(PINNED_KEY);
  for (const [groupName] of groupedHostEntries.value) {
    if (groupName) keys.push(hostGroupKey(groupName));
  }
  for (const host of Object.values(hosts.value)) {
    const groups = groupContainersForHost(visibleContainers.value, host.id);
    // A host with nothing to show is disabled and cannot open, so counting it
    // here would leave "expand all" permanently live with nothing left to do.
    if (groups.length === 0) continue;
    keys.push(hostKey(host.id));
    for (const { key } of groups) {
      keys.push(key);
    }
  }
  return keys;
});

// Navigating to a container expands the host holding it, so a deep link or a
// search result never lands on a collapsed branch.
const route = useRoute("/container/[id]");
watch(
  [() => route.name, () => route.params.id],
  ([name, id]) => {
    if (name !== "/container/[id]") return;
    const container = containerStore.findContainerById(id as string);
    if (!container) return;
    setOpen(hostKey(container.host), true);
    const host = hosts.value[container.host];
    if (host?.group) setOpen(hostGroupKey(host.group), true);
  },
  { immediate: true },
);
</script>
