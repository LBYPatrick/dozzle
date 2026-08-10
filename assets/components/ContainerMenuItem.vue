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
        <!-- Always the state dot, never a spinner.
             A new container used to swap this for `svg-spinners:ring-resize` —
             a third spinner shape, and the wrong signal twice over. Nothing is
             loading: the container exists, and `isNew` is cleared by the row's
             own highlight animation after ~3s regardless of what the container
             is doing. Meanwhile swapping the dot out meant the one row you were
             most likely to be looking at was the only row not telling you its
             state. "New" is what the highlight wash is for; the dot says what
             the container is. -->
        <div
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
          class="hover:text-secondary-safe hidden group-hover:inline-block"
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

/* Collapsed, not cancelled.
   `animation: none` would be wrong here: the row clears `isNew` from
   `@animationend`, and that event never fires for an animation that does not
   run — so the "new container" spinner beside the name would spin forever for
   anyone who asked for reduced motion. A 1ms run has no perceptible fade and
   still completes. */
@media (prefers-reduced-motion: reduce) {
  li.highlight-new {
    animation-duration: 1ms;
  }
}
</style>
