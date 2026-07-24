// Module-level registry that lets the global command palette drive the scroll
// view of whichever log page is currently mounted. ScrollableView registers its
// handlers while mounted; the palette reads them to run the "scroll to top /
// bottom" commands without threading refs through provide/inject across the
// modal boundary.
//
// A stack (not a single slot) is used so that when several scroll views are on
// screen at once — side-by-side pinned columns — the commands keep working and
// drive the most recently mounted one, and unmounting one view never clears the
// others.
type ScrollHandlers = {
  scrollToTop: () => void;
  scrollToBottom: () => void;
};

const stack = ref<ScrollHandlers[]>([]);

// Called from ScrollableView's setup. Registers on mount and removes its own
// entry on unmount so torn-down views leave no stale handler behind.
export function useScrollControlsProvider(scroll: ScrollHandlers) {
  onMounted(() => stack.value.push(scroll));
  onUnmounted(() => {
    const index = stack.value.indexOf(scroll);
    if (index !== -1) stack.value.splice(index, 1);
  });
}

// True while any scrollable log view is on screen, so the palette can hide the
// scroll commands on pages where they would do nothing.
export const canScroll = computed(() => stack.value.length > 0);

export function scrollLogsToTop() {
  stack.value.at(-1)?.scrollToTop();
}

export function scrollLogsToBottom() {
  stack.value.at(-1)?.scrollToBottom();
}
