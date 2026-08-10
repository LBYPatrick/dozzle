<template>
  <!-- One control, two homes: the sidebar outline and the dashboard table read
       the same setting, so they can never disagree about what "containers"
       means. An icon swap is a quiet thing to hang a scope change on, so the
       toast says which scope you landed in. -->
  <button
    type="button"
    class="btn btn-square btn-ghost btn-sm"
    :class="{ 'is-on text-primary-safe': showAllContainers }"
    :aria-pressed="showAllContainers"
    :title="$t('label.show-all-containers')"
    :aria-label="$t('label.show-all-containers')"
    @click="toggle()"
  >
    <Transition name="scope-icon" mode="out-in">
      <ph:eye v-if="showAllContainers" key="all" class="size-4.5" />
      <ph:eye-slash v-else key="running" class="size-4.5" />
    </Transition>
  </button>
</template>

<script lang="ts" setup>
import { showAllContainers } from "@/stores/settings";

const { t } = useI18n();

const toggle = () => {
  showAllContainers.value = !showAllContainers.value;
  // Says what the app is now doing, not which button was pressed. Echoing the
  // control's own label ("All Containers") told you nothing you had not just
  // clicked, and gave no hint that the setting reaches beyond this one view.
  notifySetting(t(showAllContainers.value ? "toasts.showing-all-containers" : "toasts.showing-running-containers"));
};
</script>

<style scoped>
/* On is a filled control, not a coloured glyph. A tinted icon over a
   transparent surface was the same weight as the neutral glass every button
   takes on hover, so "showing all" and "your pointer is here" looked alike.
   !important matches the ghost hover rule in main.css, which uses it too. */
.is-on {
  background-color: color-mix(in oklab, var(--color-primary) 14%, transparent) !important;
  border-color: color-mix(in oklab, var(--color-primary) 24%, transparent) !important;
}

.is-on:hover:not(:disabled) {
  background-color: color-mix(in oklab, var(--color-primary) 22%, transparent) !important;
}

/* The eye swaps open/closed rather than cutting, so the two states read as one
   control changing rather than two controls trading places. */
.scope-icon-enter-active,
.scope-icon-leave-active {
  transition:
    opacity 120ms ease,
    transform 160ms cubic-bezier(0.32, 0.72, 0, 1);
}

.scope-icon-enter-from,
.scope-icon-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

@media (prefers-reduced-motion: reduce) {
  .scope-icon-enter-active,
  .scope-icon-leave-active {
    transition: none;
  }
}
</style>
