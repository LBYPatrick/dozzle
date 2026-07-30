<template>
  <!-- One container in a sidebar outline. Extracted so the pinned section and
       every host's own groups render an identical row. -->
  <li :class="[container.state, { 'highlight-new': container.isNew }]" @animationend="container.isNew = false">
    <Popup>
      <router-link
        :to="{ name: '/container/[id]', params: { id: container.id } }"
        active-class="menu-active"
        @click.alt.stop.prevent="pinnedStore.pinContainer(container)"
        :title="container.name"
        class="group auto-cols-[max-content_minmax(0,1fr)_max-content_max-content] py-1"
      >
        <svg-spinners:ring-resize v-if="container.isNew" class="text-secondary w-2" />
        <div
          v-else
          class="status data-[state=exited]:status-error data-[state=running]:status-success data-[state=paused]:status-warning"
          :data-state="container.state"
        ></div>
        <div class="truncate">{{ container.name }}</div>
        <!-- A pinned container is listed twice on purpose — here, in the branch it
             belongs to, and again in the Pinned section as a shortcut. This marks
             the in-place row so the duplication reads as a state rather than a
             glitch. Hidden inside the Pinned section itself, where every row is
             pinned and the marker would be noise. -->
        <ph:push-pin-fill
          v-if="isPinnedToSidebar && !inPinnedSection"
          class="text-pin size-3 shrink-0"
          :title="$t('label.pinned')"
        />
        <ContainerHealth :health="container.health" />
        <span
          class="hover:text-secondary hidden group-hover:inline-block"
          @click.stop.prevent="pinnedStore.pinContainer(container)"
          v-show="!pinnedStore.isPinned(container)"
          :title="$t('tooltip.pin-column')"
        >
          <cil:columns />
        </span>
      </router-link>
      <template #content>
        <ContainerPopup :container="container" />
      </template>
    </Popup>
  </li>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";

const { container, inPinnedSection = false } = defineProps<{
  container: Container;
  /** Set by the Pinned section, where the pin marker would be on every row. */
  inPinnedSection?: boolean;
}>();

// Two unrelated senses of "pinned" meet on this row: pinnedStore is the
// side-by-side log column (the cil:columns control), pinnedContainers is the
// sidebar pin. Named apart here so the template cannot confuse them.
const pinnedStore = usePinnedLogsStore();
const isPinnedToSidebar = computed(() => pinnedContainers.value.has(container.name));
</script>

<style scoped>
@reference "@/main.css";

li.exited {
  @apply opacity-75;
}

li.deleted {
  @apply hidden;
}

li.highlight-new {
  animation: highlight-fade 3s ease-out;
}

@keyframes highlight-fade {
  from {
    background-color: oklch(from var(--color-secondary) l c h / 0.25);
  }
  to {
    background-color: transparent;
  }
}
</style>
