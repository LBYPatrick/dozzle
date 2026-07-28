<template>
  <!-- One collapsible node of a sidebar outline. `host` is the prominent level
       (a host, or a group of hosts); `group` is the quiet header for a set of
       containers or services inside it. Both share the same disclosure, count,
       and action layout so the four sidebar menus stay identical.

       #trailing is always visible (status, badges); #actions fades in on hover
       so secondary controls don't turn the list into a row of toolbars. -->
  <li>
    <details :open="open" @toggle="onToggle">
      <summary :class="variant === 'host' ? 'summary-host' : 'summary-group'" :title="title">
        <mdi:chevron-right class="disclosure size-4" />
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
} = defineProps<{
  title: string;
  count?: number;
  open?: boolean;
  variant?: "host" | "group";
}>();

const emit = defineEmits<{ "update:open": [value: boolean] }>();

function onToggle(event: Event) {
  emit("update:open", (event.target as HTMLDetailsElement).open);
  // A <details> keeps focus on its summary after toggling, which would leave
  // the hover-revealed actions pinned open on the row you just collapsed.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
</script>
