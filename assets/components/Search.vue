<template>
  <!-- Integrated search: a second row of the top bar (part of the glass bar,
       not a detached floating widget). Right-aligned with a compact field.
       Opening it never reflows the logs because the bar floats over them. -->
  <transition name="search-row">
    <div v-show="showSearch" class="border-base-content/10 flex items-center justify-end border-t px-2 py-1.5 md:px-4">
      <label
        class="input input-sm bg-base-100/70 border-base-content/10 flex w-full max-w-xs items-center gap-2 rounded-full border backdrop-blur-sm"
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
import { registerSearchInstance } from "@/composable/search";

const input = ref<HTMLInputElement>();
const { searchQueryFilter, showSearch, resetSearch, isValidQuery, inverseFilter, toggleInverse } = useSearchFilter();

// Focus the field whenever it opens, no matter the trigger (bar button, the
// ⌘/⌃F shortcut in ScrollableView, or a deep-linked ?search= query).
watch(
  showSearch,
  (open) => {
    if (open) nextTick(() => input.value?.focus());
  },
  { immediate: true },
);

registerSearchInstance();
</script>

<style scoped>
.search-row-enter-active,
.search-row-leave-active {
  transition:
    max-height 220ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 160ms ease;
  overflow: hidden;
  max-height: 4rem;
}
.search-row-enter-from,
.search-row-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
