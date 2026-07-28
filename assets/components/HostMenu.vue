<template>
  <div class="mb-1 flex items-center gap-1">
    <span class="text-base-content/45 flex-1 truncate text-[0.72rem] font-semibold tracking-[0.06em] uppercase">
      {{ $t("label.hosts") }}
    </span>
    <div class="dropdown dropdown-end dropdown-hover flex-none">
      <label
        tabindex="0"
        class="btn btn-square btn-ghost btn-sm"
        :title="$t('action.more-actions')"
        :aria-label="$t('action.more-actions')"
      >
        <ph:dots-three-vertical-bold class="size-5" />
      </label>
      <ul
        tabindex="0"
        class="menu dropdown-content rounded-box bg-base-200 border-base-content/20 z-50 w-52 border p-1 shadow-sm"
      >
        <li>
          <a class="text-sm capitalize" @click="toggleShowAllContainers()">
            <mdi:check class="w-4" v-if="showAllContainers" />
            <div v-else class="w-4"></div>
            {{ $t("label.show-all-containers") }}
          </a>
        </li>
        <li v-if="hasCollapsible">
          <a class="text-sm capitalize" @click="collapseAll()">
            <material-symbols-light:expand-all class="w-4" v-if="allCollapsed" />
            <material-symbols-light:collapse-all class="w-4" v-else />
            {{ allCollapsed ? $t("label.expand-all") : $t("label.collapse-all") }}
          </a>
        </li>
      </ul>
    </div>
  </div>

  <!-- One outline, top to bottom: host group -> host -> container group ->
       container. There is no separate hosts screen to drill into and back out
       of any more; everything a host holds is reachable by expanding it. -->
  <ul class="menu sidebar-menu">
    <MenuSection
      v-if="pinnedItems.length > 0"
      :title="$t('label.pinned')"
      :count="pinnedItems.length"
      :open="isOpen(PINNED_KEY)"
      @update:open="setOpen(PINNED_KEY, $event)"
    >
      <template #icon>
        <ph:map-pin-simple class="size-4 shrink-0 opacity-70" />
      </template>
      <ContainerMenuItem v-for="item in pinnedItems" :key="item.id" :container="item" />
    </MenuSection>

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
import { showAllContainers } from "@/stores/settings";

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

const { isOpen, setOpen, allCollapsed: allOf, toggleAll } = useCollapsedSections();

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

// Every collapsible key currently on screen, so "collapse all" and its label
// know what they are operating on.
const allKeys = computed(() => {
  const keys: string[] = [];
  if (pinnedItems.value.length > 0) keys.push(PINNED_KEY);
  for (const [groupName] of groupedHostEntries.value) {
    if (groupName) keys.push(hostGroupKey(groupName));
  }
  for (const host of Object.values(hosts.value)) {
    keys.push(hostKey(host.id));
    for (const { key } of groupContainersForHost(visibleContainers.value, host.id, debouncedPinnedContainers.value)) {
      keys.push(key);
    }
  }
  return keys;
});

const hasCollapsible = computed(() => allKeys.value.length > 0);
const allCollapsed = computed(() => allOf(allKeys.value));
const collapseAll = () => toggleAll(allKeys.value);

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

const toggleShowAllContainers = () => (showAllContainers.value = !showAllContainers.value);
</script>
