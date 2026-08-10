<template>
  <!-- Integrated search: an icon in the bar that expands in place into a field.
       Only the width animates (fixed row height), so there is no second row and
       no reflow of the logs. -->
  <!-- A div, not a label: a label forwards clicks to its input, and that
       forwarded click bubbles back here and would re-open search right after the
       close button clears it. -->
  <!-- The width/colour transition lives on the shared `.input` rule in main.css
       (which is unlayered, so a `transition-*` utility here would be ignored). -->
  <!-- `overflow-hidden` lives in fieldClass, on the expanded state only. -->
  <div
    class="input input-sm field-search relative flex items-center gap-2 rounded-[var(--control-radius)]"
    :class="fieldClass"
    :title="showSearch ? undefined : $t('toolbar.search')"
    @click="open"
  >
    <!-- Indeterminate spinning circuit while the stream scans history. Its corner
         radius matches the field so the ring hugs it. -->
    <CircuitRing v-if="searchLoading" indeterminate :stroke-width="1.5" :radius="controlRadiusPx" />
    <mdi:magnify class="size-5 shrink-0" :class="isSearching ? 'text-primary-safe' : 'text-base-content/60'" />
    <input
      v-show="showSearch"
      class="grow bg-transparent"
      type="text"
      :placeholder="$t('placeholder.find-regex')"
      ref="input"
      v-model="searchQueryFilter"
      @keyup.esc="resetSearch()"
    />
    <!-- `btn-xs` (24px) inside a 32px field, which leaves 4px of inset above and
         below. They were briefly `btn-sm` (32px) chasing a 44px target: that
         fills the field wall to wall, so the controls read as jammed into it
         rather than sitting in it.
         No `.hit-44` here either — it would be clipped by the expanded field's
         `overflow-hidden`, so it was buying nothing. A 44px target is
         geometrically impossible inside a 32px inline field without making the
         whole toolbar taller, and these two are secondary controls that both
         have another route (Esc clears, and the field can simply be re-typed).
         The *collapsed* search control, which is the primary target and has the
         room, does take a full 44px. -->
    <button
      v-show="showSearch"
      type="button"
      class="btn btn-circle btn-xs shrink-0"
      :class="inverseFilter ? 'btn-error' : 'btn-ghost'"
      :aria-pressed="inverseFilter"
      @click.stop="toggleInverse()"
      :title="inverseFilter ? $t('toolbar.inverse-on') : $t('toolbar.inverse-off')"
      :aria-label="inverseFilter ? $t('toolbar.inverse-on') : $t('toolbar.inverse-off')"
    >
      <mdi:filter-off-outline v-if="inverseFilter" />
      <mdi:filter-outline v-else />
    </button>
    <!-- A button, not an <a>. Without an href an anchor is not focusable, so
         this control could not be reached by keyboard at all. -->
    <button
      v-show="showSearch"
      type="button"
      class="btn btn-circle btn-ghost btn-xs shrink-0"
      @click.stop="resetSearch()"
      :title="$t('button.cancel')"
      :aria-label="$t('button.cancel')"
    >
      <mdi:close />
    </button>
  </div>
</template>

<script lang="ts" setup>
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
  registerSearchInstance,
} = useSearchFilter();

// Collapsed: a ghost icon button. Expanded: a bordered field. Width is the only
// animated dimension so the bar height never changes.
// Collapsed: a ghost icon button sized exactly like the buttons beside it on
// the bar. It was briefly `size-11` to reach a 44px target, which made it
// visibly taller than every neighbouring `btn-sm` and broke the row — a control
// bar's whole job is that its controls line up. The target comes from `.hit-44`
// on the element instead, which overflows the hit area without changing the box.
//
// The resting / hover / focus surfaces are the shared `.input` and
// `.field-search` rules in main.css — this used to restate them here with
// `border-base-content/15 bg-base-100 focus-within:border-primary`, which
// contradicted `.field-search`'s deliberate decision that a search box stays
// neutral on focus, and reintroduced the accent border that rule removed.
const fieldClass = computed(() =>
  showSearch.value
    ? [
        // Explicit padding so the leading icon and the trailing buttons are
        // evenly inset (daisyUI's default input padding looks lopsided with the
        // round buttons on the right).
        //
        // `overflow-hidden` is load-bearing and belongs *here*, not on the root:
        // the field's contents (the text input and the two round buttons) are
        // `v-show`n, so the instant search opens they lay out at full size while
        // the box is still animating from 32px. Unclipped, they spill past the
        // bar for the length of that animation, which overflows the row and
        // flashes a scroll gutter. Keeping it off the collapsed state matters
        // just as much — there it would clip the overflowing 44px hit area.
        "w-52 cursor-text overflow-hidden pr-1 pl-3 md:w-60",
        !isValidQuery.value ? "input-warning" : "",
      ]
    : "hover:bg-base-content/10 hit-44 w-8 cursor-pointer justify-center border-transparent bg-transparent px-0",
);

// --control-radius is 0.5rem; the SVG ring needs it in px.
const controlRadiusPx = 8;

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

registerSearchInstance(() => {
  // Select as well as focus: pressing find with a term already in the box
  // should let the user type a new one straight over it.
  input.value?.focus();
  input.value?.select();
});
</script>
