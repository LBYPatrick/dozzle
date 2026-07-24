<template>
  <!-- Integrated search: a right-aligned glass pill overlaid just below the top
       bar (absolute, so toggling it never changes the bar height or the scroll
       area). Opened from the bar's search button or ⌘/⌃F. -->
  <transition name="search-pop">
    <div v-show="showSearch" class="absolute top-full right-2 z-10 mt-1 w-64 max-w-[calc(100%-1rem)]">
      <label
        class="input input-sm border-base-content/10 bg-base-200/80 flex w-full items-center gap-2 rounded-full border shadow-lg backdrop-blur-xl backdrop-saturate-150"
        :class="!isValidQuery ? 'input-warning' : 'focus-within:border-primary'"
      >
        <mdi:magnify class="text-base-content/50 size-4 shrink-0" />
        <input
          class="grow bg-transparent"
          type="text"
          :placeholder="$t('placeholder.find-regex')"
          ref="input"
          v-model="searchQueryFilter"
          @keyup.esc="resetSearch()"
        />
        <button
          type="button"
          class="btn btn-circle btn-xs"
          :class="inverseFilter ? 'btn-error' : 'btn-ghost'"
          @click="toggleInverse()"
          :title="inverseFilter ? $t('toolbar.inverse-on') : $t('toolbar.inverse-off')"
        >
          <mdi:filter-off-outline v-if="inverseFilter" />
          <mdi:filter-outline v-else />
        </button>
        <a class="btn btn-circle btn-ghost btn-xs" @click="resetSearch()" :title="$t('button.cancel')">
          <mdi:close />
        </a>
      </label>
    </div>
  </transition>
</template>

<script lang="ts" setup>
const input = ref<HTMLInputElement>();
const { searchQueryFilter, showSearch, resetSearch, isValidQuery, inverseFilter, toggleInverse } = useSearchFilter();

// Focus the field whenever it opens, no matter the trigger (bar button, the
// shortcut below, or a deep-linked ?search= query).
watch(
  showSearch,
  (open) => {
    if (open) nextTick(() => input.value?.focus());
  },
  { immediate: true },
);

// ⌘/⌃F opens the row (gated by the search setting). Plain F is left alone so it
// still types into log fields.
onKeyStroke("f", (e) => {
  if (!search.value) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
    showSearch.value = true;
    e.preventDefault();
  }
});

onUnmounted(() => resetSearch());
</script>

<style scoped>
.search-pop-enter-active {
  transition:
    opacity 160ms ease,
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.search-pop-leave-active {
  transition:
    opacity 130ms ease,
    transform 130ms ease;
}
.search-pop-enter-from,
.search-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.4rem) scale(0.98);
}
</style>
