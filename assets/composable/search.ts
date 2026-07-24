const searchQueryFilter = ref<string>("");
const debouncedSearchFilter = refDebounced(searchQueryFilter);
const showSearch = ref(false);
const inverseFilter = ref(false);
// True while the log stream is actively scanning history for matches. Progress
// is unknown, so the UI shows this as an indeterminate (spinning) indicator.
// Published by the active log stream (see EventSource.vue).
const searchLoading = ref(false);

const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get("search") !== null && searchParams.get("search") !== "") {
  searchQueryFilter.value = searchParams.get("search") || "";
  showSearch.value = true;
}
function resetSearch() {
  searchQueryFilter.value = "";
  showSearch.value = false;
  inverseFilter.value = false;
}

function toggleInverse() {
  inverseFilter.value = !inverseFilter.value;
}

const isSearching = computed(() => showSearch.value && debouncedSearchFilter.value !== "");

const isValidQuery = computed(() => {
  try {
    new RegExp(searchQueryFilter.value);
    return true;
  } catch (e) {
    return false;
  }
});

export function useSearchFilter() {
  return {
    searchQueryFilter,
    isValidQuery,
    debouncedSearchFilter,
    showSearch,
    resetSearch,
    isSearching,
    inverseFilter,
    toggleInverse,
    searchLoading,
  };
}

// The search bar is now rendered per log view, so several instances can be
// mounted at once (side-by-side columns). Reference-count them and only reset
// the shared filter once the last one unmounts (i.e. the user leaves logs
// entirely), instead of every time one column tears down.
let mountedInstances = 0;
export function registerSearchInstance() {
  onMounted(() => {
    mountedInstances++;
  });
  onUnmounted(() => {
    mountedInstances--;
    if (mountedInstances <= 0) {
      mountedInstances = 0;
      resetSearch();
    }
  });
}
