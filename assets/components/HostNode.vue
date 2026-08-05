<template>
  <!-- One host branch of the sidebar outline: the host, then its container
       groups, then the containers themselves. -->
  <MenuSection
    variant="host"
    :title="host.name"
    :open="isOpen(hostKey(host.id))"
    @update:open="setOpen(hostKey(host.id), $event)"
    :class="{ 'text-base-content/50': !host.available && !isEmpty }"
    :disabled="isEmpty"
  >
    <template #icon>
      <HostIcon :type="host.type" class="size-4 shrink-0 opacity-70" />
    </template>
    <template #trailing>
      <span v-if="!host.available" class="badge badge-error badge-xs p-1.5">offline</span>
    </template>
    <MenuSection
      v-for="group in groups"
      :key="group.key"
      :title="group.label.startsWith('label.') ? $t(group.label) : group.label"
      :count="group.containers.length"
      :open="isOpen(group.key)"
      @update:open="setOpen(group.key, $event)"
    >
      <template #icon>
        <ph:stack v-if="group.icon === 'stack'" class="size-4 shrink-0 opacity-70" />
        <octicon:container-24 v-else class="size-4 shrink-0 opacity-70" />
      </template>
      <!-- Every group can be merged into one stream, the catch-all included:
           the group is the row that actually holds containers, so that is where
           the action sits rather than on the host above it. -->
      <template #actions>
        <router-link
          :to="{ name: '/merged/[ids]', params: { ids: group.containers.map(({ id }) => id).join(',') } }"
          class="btn btn-square btn-ghost btn-xs text-primary"
          active-class="menu-active"
          :title="$t('tooltip.merge-all')"
          @click.stop
        >
          <ph:arrows-merge />
        </router-link>
      </template>

      <!-- Animated for the same reason the pinned list is: containers start and
           stop while you are looking at the sidebar, and rows appearing or
           leaving a branch should be followable rather than instant. -->
      <TransitionGroup name="pin-row">
        <ContainerMenuItem v-for="item in group.containers" :key="item.id" :container="item" />
      </TransitionGroup>
    </MenuSection>
  </MenuSection>
</template>

<script lang="ts" setup>
import type { Host } from "@/stores/hosts";

const { host } = defineProps<{ host: Host }>();

const containerStore = useContainerStore();
const { visibleContainers } = storeToRefs(containerStore);

const { isOpen, setOpen } = useCollapsedSections();

// Pinning no longer changes what a host branch holds — a pinned container stays
// in place with a marker — so the branch has nothing to debounce any more.
const groups = computed(() => groupContainersForHost(visibleContainers.value, host.id));

// `visibleContainers` is the store's running-vs-all view, so this follows the
// eye toggle: a host whose containers are all stopped has nothing to show while
// the filter is "running only", and expanding it would open onto an empty list.
// Dimming and disabling says so before the click rather than after it.
const isEmpty = computed(() => groups.value.length === 0);
</script>
