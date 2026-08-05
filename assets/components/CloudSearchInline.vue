<template>
  <!-- Not an input, but it stands in for one, so it wears the same field
       language: the shared `.input` surface, a leading glyph that picks up the
       accent on hover/focus, and a clear control once there is a live query to
       clear. Filled rather than outlined (`.field-filled`) — it sits directly
       above the navigation list, and a hairline box there just adds another rule
       for the eye to sort out from the rows. -->
  <div
    class="input field-filled field-search group/field flex h-9 w-full items-center gap-2 px-3 text-left"
    data-testid="search"
    role="button"
    tabindex="0"
    @click="openSearch()"
    @keydown.enter.prevent="openSearch()"
    @keydown.space.prevent="openSearch()"
  >
    <!-- 70%, not 60%: against the field's own fill, 60% measures 3.5:1 on the
         light theme, under AA for text this size. 70% clears it in both themes
         (4.6:1 light, 5.7:1 dark) and the glyph still reads as secondary. -->
    <mdi:magnify
      class="group-hover/field:text-primary group-focus/field:text-primary size-4 shrink-0 transition-colors"
      :class="cloudReady ? 'text-primary' : 'text-base-content/70'"
    />
    <!-- Show the active query when we're on the cloud search page so the
         topbar reflects what the user is looking at. -->
    <span v-if="activeQuery" class="text-base-content min-w-0 flex-1 truncate font-mono text-sm">{{
      activeQuery
    }}</span>
    <span v-else class="text-base-content/70 min-w-0 flex-1 truncate text-sm">
      <template v-if="cloudReady">{{ $t("cloud-search.hero-title-cloud") }}</template>
      <template v-else>{{ $t("cloud-search.hero-title-plain") }}</template>
    </span>
    <transition name="clear">
      <button
        v-if="activeQuery"
        type="button"
        class="text-base-content/40 hover:text-base-content flex shrink-0 items-center transition-colors"
        :title="$t('button.clear-input')"
        :aria-label="$t('button.clear-input')"
        @click.stop="clearQuery"
      >
        <mdi:close-circle class="size-4" />
      </button>
    </transition>
    <span class="flex shrink-0 items-center gap-1">
      <kbd class="kbd kbd-xs">⌘</kbd>
      <kbd class="kbd kbd-xs">K</kbd>
    </span>
  </div>
</template>

<script lang="ts" setup>
import { useFuzzySearch } from "@/composable/fuzzySearch";
import { useCloudConfig } from "@/composable/cloudConfig";

const { openSearch } = useFuzzySearch();
const { cloudConfig } = useCloudConfig();
const cloudReady = computed(() => !!cloudConfig.value?.linked && !!cloudConfig.value?.streamLogs);

const route = useRoute();
const router = useRouter();
const activeQuery = computed(() =>
  route?.path === "/cloud/search" && typeof route.query?.q === "string" ? route.query.q : "",
);

// The query lives in the URL, so clearing the field means dropping it from the
// route rather than resetting local state.
function clearQuery() {
  router.replace({ path: "/cloud/search", query: {} });
}
</script>

<style scoped>
.clear-enter-active,
.clear-leave-active {
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.clear-enter-from,
.clear-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
</style>
