// Module-level registry that lets the global command palette drive the scroll
// view of whichever log page is currently mounted. ScrollableView registers its
// handlers while mounted (mirrors the pattern in inlineSearch.ts), and the
// palette reads them to run the "scroll to top / bottom" commands without
// threading refs through provide/inject across the modal boundary.
type ScrollHandlers = {
  scrollToTop: () => void;
  scrollToBottom: () => void;
};

const handlers = ref<ScrollHandlers>();

// Called from ScrollableView's setup. Registers on mount and clears on unmount
// so a torn-down page never leaves a stale handler the palette could call.
export function useScrollControlsProvider(scroll: ScrollHandlers) {
  onMounted(() => (handlers.value = scroll));
  onUnmounted(() => {
    if (handlers.value === scroll) handlers.value = undefined;
  });
}

// True only while a scrollable log view is on screen, so the palette can hide
// the scroll commands on pages where they would do nothing.
export const canScroll = computed(() => handlers.value !== undefined);

export function scrollLogsToTop() {
  handlers.value?.scrollToTop();
}

export function scrollLogsToBottom() {
  handlers.value?.scrollToBottom();
}
