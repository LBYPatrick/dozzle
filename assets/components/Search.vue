<template>
  <!-- Integrated search: an icon in the bar that expands in place into a field.
       Only the width animates (fixed row height), so there is no second row and
       no reflow of the logs. -->
  <!-- A div, not a label: a label forwards clicks to its input, and that
       forwarded click bubbles back here and would re-open search right after the
       close button clears it. -->
  <div
    class="input input-sm relative flex items-center gap-2 overflow-hidden rounded-full transition-[width,background-color,border-color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
    :class="fieldClass"
    :title="showSearch ? undefined : $t('toolbar.search')"
    @click="open"
  >
    <!-- Indeterminate spinning circuit while the stream scans history. -->
    <CircuitRing v-if="searchLoading" indeterminate :stroke-width="1.5" />
    <mdi:magnify class="size-5 shrink-0" :class="isSearching ? 'text-primary' : 'text-base-content/60'" />
    <input
      v-show="showSearch"
      class="grow bg-transparent"
      type="text"
      :placeholder="$t('placeholder.find-regex')"
      ref="input"
      v-model="searchQueryFilter"
      @keyup.esc="resetSearch()"
    />
    <button
      v-show="showSearch"
      type="button"
      class="btn btn-circle btn-xs shrink-0"
      :class="inverseFilter ? 'btn-error' : 'btn-ghost'"
      @click.stop="toggleInverse()"
      :title="inverseFilter ? $t('toolbar.inverse-on') : $t('toolbar.inverse-off')"
    >
      <mdi:filter-off-outline v-if="inverseFilter" />
      <mdi:filter-outline v-else />
    </button>
    <a
      v-show="showSearch"
      class="btn btn-circle btn-ghost btn-xs shrink-0"
      @click.stop="resetSearch()"
      :title="$t('button.cancel')"
    >
      <mdi:close />
    </a>
  </div>
</template>

<script lang="ts" setup>
import { registerSearchInstance } from "@/composable/search";

const input = ref<HTMLInputElement>();
const {
  searchQueryFilter,
  showSearch,
  resetSearch,
  isValidQuery,
  isSearching,
  inverseFilter,
  toggleInverse,
  searchLoading,
} = useSearchFilter();

// Collapsed: a ghost icon button. Expanded: a bordered field. Width is the only
// animated dimension so the bar height never changes.
const fieldClass = computed(() =>
  showSearch.value
    ? [
        // Explicit padding so the leading icon and the trailing buttons are
        // evenly inset (daisyUI's default input padding looks lopsided with the
        // round buttons on the right).
        "w-52 cursor-text border pr-1 pl-3 md:w-60",
        !isValidQuery.value ? "input-warning" : "border-base-content/15 bg-base-100 focus-within:border-primary",
      ]
    : "hover:bg-base-content/10 w-9 cursor-pointer justify-center border-transparent bg-transparent px-0",
);

function open() {
  if (!showSearch.value) showSearch.value = true;
}

// Focus the field whenever it opens (bar click, the ⌘/⌃F shortcut in
// ScrollableView, or a deep-linked ?search= query).
watch(
  showSearch,
  (isOpen) => {
    if (isOpen) nextTick(() => input.value?.focus());
  },
  { immediate: true },
);

registerSearchInstance();
</script>
