// Shared open state for the global Cmd+K fuzzy-search modal.
// Lives outside the layout so any surface (home page hero, mobile menu,
// sidebar trigger) can open the same modal without prop-drilling.
const open = ref(false);

// Seeds the palette's input for the next open. Cmd+Shift+P passes "/" so the
// palette lands in command mode, the way it does in an editor, instead of
// opening on container search and making you type the prefix yourself.
const initialQuery = ref("");

export function useFuzzySearch() {
  return {
    open,
    initialQuery,
    openSearch: (query = "") => {
      initialQuery.value = query;
      open.value = true;
    },
    closeSearch: () => {
      open.value = false;
      // The modal is v-if'd, so this only has to be clean for the next open.
      initialQuery.value = "";
    },
  };
}
