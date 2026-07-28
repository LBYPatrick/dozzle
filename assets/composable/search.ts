import { loggingContextKey } from "@/composable/logContext";

export type SearchStatus = {
  active: boolean;
  done: boolean;
  matches: number;
  scannedTo?: string;
  reason?: "capped" | "exhausted";
};

// Each distinct value closes the log stream and opens a new one with the filter
// applied, which clears and rebuilds the whole visible window. VueUse's 200ms
// default fires roughly per keystroke for an average typist, so a half-typed
// term costs several full reconnects. 400ms waits for a pause in typing
// instead; the field stays responsive because it is bound to the undebounced
// ref.
const SEARCH_DEBOUNCE_MS = 400;

function createSearchState() {
  const searchQueryFilter = ref<string>("");
  const debouncedSearchFilter = refDebounced(searchQueryFilter, SEARCH_DEBOUNCE_MS);
  const showSearch = ref(false);
  const inverseFilter = ref(false);
  // True while the log stream is actively scanning history for matches.
  // Progress is unknown, so the UI shows this as an indeterminate indicator.
  const searchLoading = ref(false);
  // Published by this view's stream for its own bar (match count, how far back
  // it has scanned).
  const searchStatus = ref<SearchStatus>({ active: false, done: false, matches: 0 });

  const isSearching = computed(() => showSearch.value && debouncedSearchFilter.value !== "");

  const isValidQuery = computed(() => {
    try {
      new RegExp(searchQueryFilter.value);
      return true;
    } catch {
      return false;
    }
  });

  function resetSearch() {
    searchQueryFilter.value = "";
    showSearch.value = false;
    inverseFilter.value = false;
  }

  function toggleInverse() {
    inverseFilter.value = !inverseFilter.value;
  }

  // The field belonging to this view, so the find shortcut can put the caret
  // back even when search is already open and focus has moved to the logs.
  let focusHandler: (() => void) | undefined;

  function registerSearchInstance(focus: () => void) {
    onMounted(() => (focusHandler = focus));
    onUnmounted(() => {
      if (focusHandler === focus) focusHandler = undefined;
      resetSearch();
    });
  }

  function focusSearch() {
    focusHandler?.();
  }

  return {
    searchQueryFilter,
    debouncedSearchFilter,
    showSearch,
    inverseFilter,
    searchLoading,
    searchStatus,
    isSearching,
    isValidQuery,
    resetSearch,
    toggleInverse,
    registerSearchInstance,
    focusSearch,
  };
}

export type SearchState = ReturnType<typeof createSearchState>;

/**
 * Search state, one set per log view.
 *
 * Side-by-side columns are separate streams over separate containers, so they
 * get separate searches — filtering one used to filter both, because this state
 * was a module-level singleton. The logging context is already provided per
 * view, so it is the natural key; using it avoids threading a second provide
 * through every log page.
 */
const stateByContext = new WeakMap<object, SearchState>();

// Views with no logging context (there is currently no such caller, but the
// composable must not throw if one appears) share one fallback set.
let fallbackState: SearchState | undefined;

export function useSearchFilter(): SearchState {
  const context = inject(loggingContextKey, null);
  if (!context) return (fallbackState ??= createSearchState());

  let state = stateByContext.get(context);
  if (!state) {
    state = createSearchState();
    stateByContext.set(context, state);
    applyInitialQuery(state);
  }
  return state;
}

// A `?search=` in the URL seeds the first view that asks; later panes open
// empty, which is what you want when you pin a second container to compare.
const searchParams = new URLSearchParams(window.location.search);
const initialQuery = searchParams.get("search") ?? "";
let initialQueryApplied = false;

function applyInitialQuery(state: SearchState) {
  if (initialQueryApplied || initialQuery === "") return;
  initialQueryApplied = true;
  state.searchQueryFilter.value = initialQuery;
  state.showSearch.value = true;
}
