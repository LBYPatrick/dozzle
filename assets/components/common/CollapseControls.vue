<template>
  <!-- The two ends of a sidebar outline, as a pair of buttons rather than one
       button that silently swaps meaning. Each is disabled at its own extreme,
       so the row also reads as a state: both live = mixed, one dimmed = you are
       already fully collapsed (or fully expanded). -->
  <div class="flex flex-none items-center">
    <button
      type="button"
      class="btn btn-square btn-ghost btn-sm arrows-btn arrows-in"
      :disabled="collapsedAll"
      :title="$t('label.collapse-all')"
      :aria-label="$t('label.collapse-all')"
      @click="apply(false)"
    >
      <ph:arrows-in-line-vertical class="size-4.5" />
    </button>
    <button
      type="button"
      class="btn btn-square btn-ghost btn-sm arrows-btn arrows-out"
      :disabled="expandedAll"
      :title="$t('label.expand-all')"
      :aria-label="$t('label.expand-all')"
      @click="apply(true)"
    >
      <ph:arrows-out-line-vertical class="size-4.5" />
    </button>
  </div>
</template>

<script lang="ts" setup>
const { keys } = defineProps<{
  /** Every collapsible section key currently on screen, in this menu. */
  keys: string[];
}>();

const { allCollapsed, allExpanded, collapseAll, expandAll } = useCollapsedSections();
const { t } = useI18n();

const collapsedAll = computed(() => keys.length === 0 || allCollapsed(keys));
const expandedAll = computed(() => keys.length === 0 || allExpanded(keys));

// The button that was clicked goes disabled, so the click has no lasting
// on-screen acknowledgement of its own — the toast is it.
function apply(open: boolean) {
  if (open) expandAll(keys);
  else collapseAll(keys);
  // Past tense: the toast confirms what happened, where the button's own label
  // ("Expand all") is an instruction and reads as if nothing has yet.
  notifySetting(t(open ? "toasts.expanded-all" : "toasts.collapsed-all"));
}
</script>

<style scoped>
@reference "@/main.css";

/* The arrows preview the gesture: on hover they pull together (collapse) or
   apart (expand) a hair before the click lands. */
.arrows-btn :deep(svg) {
  transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1);
}

.arrows-in:hover:not(:disabled) :deep(svg) {
  transform: scaleY(0.8);
}

.arrows-out:hover:not(:disabled) :deep(svg) {
  transform: scaleY(1.2);
}

/* Dimmed, not hidden. A control that vanishes at its extreme makes the row
   change width as you use it. */
.arrows-btn:disabled {
  @apply opacity-30;
}

@media (prefers-reduced-motion: reduce) {
  .arrows-btn :deep(svg) {
    transition: none;
  }
}
</style>
