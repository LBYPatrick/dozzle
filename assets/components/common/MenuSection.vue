<template>
  <!-- One collapsible node of a sidebar outline. `host` is the prominent level
       (a host, or a group of hosts); `group` is the quiet header for a set of
       containers or services inside it. Both share the same disclosure, count,
       and action layout so the four sidebar menus stay identical.

       #trailing is always visible (status, badges); #actions fades in on hover
       so secondary controls don't turn the list into a row of toolbars. -->
  <li>
    <!-- Forced shut when disabled, so a node that was left open cannot be
         stranded holding nothing after the filter changes under it. -->
    <details :open="open && !disabled" @toggle="onToggle">
      <summary
        :class="[variant === 'host' ? 'summary-host' : 'summary-group', { 'is-disabled': disabled }]"
        :title="title"
        :aria-disabled="disabled || undefined"
        @click="onSummaryClick"
      >
        <!-- invisible, not hidden: the chevron keeps its space so the icons and
             labels of enabled and disabled rows still line up. -->
        <mdi:chevron-right class="disclosure size-4" :class="{ invisible: disabled }" />
        <slot name="icon" />
        <span class="min-w-0 flex-1 truncate">{{ title }}</span>
        <span v-if="count !== undefined" class="count">{{ count }}</span>
        <slot name="trailing" />
        <span class="row-actions"><slot name="actions" /></span>
      </summary>
      <ul>
        <slot />
      </ul>
    </details>
  </li>
</template>

<script lang="ts" setup>
const {
  title,
  open = true,
  variant = "group",
  disabled = false,
} = defineProps<{
  title: string;
  count?: number;
  open?: boolean;
  variant?: "host" | "group";
  /** Nothing inside to show. The node dims and stops responding, rather than
      opening onto an empty list. */
  disabled?: boolean;
}>();

const emit = defineEmits<{ "update:open": [value: boolean] }>();

// <details> has no disabled state of its own — a click on the summary toggles it
// natively — so the click has to be refused rather than styled away.
function onSummaryClick(event: MouseEvent) {
  if (disabled) event.preventDefault();
}

function onToggle(event: Event) {
  emit("update:open", (event.target as HTMLDetailsElement).open);
  // A <details> keeps focus on its summary after toggling, which would leave
  // the hover-revealed actions pinned open on the row you just collapsed.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
</script>

<style scoped>
@reference "@/main.css";

/* Quieter than the offline host's 50%: this is not a problem to look at, it is
   a branch with nothing behind it. The cursor and the flat hover say the same
   thing the dimming does — there is nothing here to open. */
.is-disabled {
  @apply text-base-content/35;
  cursor: default;
}

.is-disabled:hover {
  background-color: transparent;
}

/* The hover-revealed actions would still appear on a row that cannot act. */
.is-disabled :deep(.row-actions) {
  display: none;
}
</style>
