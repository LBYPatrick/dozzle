<template>
  <section
    class="relative flex min-h-0 min-w-0 flex-col"
    :class="hasHeader ? 'h-[calc(100dvh-var(--mobile-nav-height))] md:h-dvh' : ''"
  >
    <!-- Keep this section the single root element. A comment above it would
         make the root a fragment, and then this component's element resolves to
         a text node instead of the section — which is how the find shortcut
         lost track of which pane the pointer was in.

         The log view is a fixed-height internal scroller so the floating top
         bar and search row can overlay it without ever changing the scroll
         area's height or position. Only forced for views that render a header
         (the log views); anything else keeps the default flow. -->
    <main
      :data-scrolling="scrollable ? true : undefined"
      class="relative min-h-[300px] min-w-0 flex-1 [scrollbar-gutter:stable] overflow-auto transition-[padding-top] duration-200 ease-out"
      :style="hasHeader ? { paddingTop: `${topInset}px`, '--log-top-inset': `${topInset}px` } : undefined"
    >
      <div ref="scrollTopObserver" class="h-px"></div>
      <div ref="scrollableContent">
        <slot></slot>
      </div>
      <div ref="scrollObserver" class="h-px"></div>
    </main>

    <!-- Floating glass top bar. Absolute + a measured content inset keeps the
         scroll area a constant size, so opening search or collapsing never
         reflows the logs. Glass (backdrop blur) is allowed here: it is a
         container background layered over its own content. -->
    <header v-if="hasHeader && !collapsed" class="absolute inset-x-0 top-0 z-20">
      <div ref="barRow" class="border-base-content/10 relative border-b shadow-sm">
        <!-- The bar's glass sits on its own layer rather than on the bar
             itself. backdrop-filter turns an element into a backdrop root, and
             a backdrop root leaves anything floating *inside* it — the actions
             menu — with nothing behind it left to blur. -->
        <div
          class="bg-base-200/72 pointer-events-none absolute inset-0 -z-10 backdrop-blur-xl backdrop-saturate-150"
        ></div>
        <!-- Row 1: identity (tag + name) and stats (network / cpu / memory).
             @container so the stats' container-query visibility (they hide when
             the bar is too narrow to fit them) has a context to measure. -->
        <!-- min-height, not content height: the stat widgets are taller in
             their chart form than in their compact one, and without this the
             container name and the whole log view below it jump every time the
             form changes. -->
        <div class="@container flex min-h-[3.9rem] min-w-0 items-center gap-2 px-3 py-1.5 md:px-4">
          <slot name="header"></slot>
        </div>

        <!-- Row 2: log status on the left, controls on the trailing edge. A
             slightly recessed background sets it apart from the identity row. -->
        <div
          class="border-base-content/8 bg-base-content/[0.03] flex min-w-0 items-center gap-2 border-t px-3 py-1 md:px-4"
        >
          <div class="text-base-content/60 flex min-w-0 flex-1 items-center gap-2 text-xs">
            <transition name="status-fade">
              <span
                v-if="loadingMore || searchLoading"
                class="loading loading-spinner loading-xs text-primary shrink-0"
                :title="$t('label.loading')"
              ></span>
            </transition>
            <!-- Search status ("N matches · searched back to …"), on demand. -->
            <SearchStatus :status="searchStatus" class="min-w-0" />
            <transition name="progress-status">
              <div v-if="scrollContext.paused" class="flex min-w-0 items-center gap-2">
                <!-- Only once it has actually been measured. The date alone is
                     still worth showing while the span is unknown; a percentage
                     invented to fill the gap is not. -->
                <span v-if="progressPercent !== undefined" class="text-primary shrink-0 font-semibold tabular-nums"
                  >{{ progressPercent }}%</span
                >
                <RelativeTime :date="scrollContext.currentDate" class="truncate whitespace-nowrap" />
              </div>
            </transition>
          </div>

          <div class="flex shrink-0 items-center gap-0.5">
            <!-- Search: an icon that expands into a field in place. -->
            <Search v-if="showSearchControls" />
            <slot name="actions"></slot>
            <button
              v-if="canCollapse"
              type="button"
              class="btn btn-ghost btn-sm btn-square transition-transform hover:-translate-y-px"
              @click="topBarCollapsed = true"
              :title="$t('button.collapse-top-bar')"
              :aria-label="$t('button.collapse-top-bar')"
            >
              <mdi:chevron-up class="size-5" />
            </button>
          </div>
        </div>

        <!-- The log progress bar spans both rows at the bar's bottom edge. No
             z-index, so the bar's own dropdowns (in this backdrop-blur stacking
             context) stay above it. -->
        <transition name="progress-bar">
          <!-- Empty, not full, while the span is unmeasured: a full bar claims
               you are at the live tail, which is the opposite of true whenever
               this bar is visible at all. -->
          <ScrollProgressBar
            v-show="scrollContext.paused"
            :progress="scrollContext.progress ?? 0"
            class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1/2"
          />
        </transition>
      </div>
    </header>

    <transition name="widget-pop">
      <TopBarStatWidget
        v-if="collapsed"
        :containers="containers"
        :loading="loadingMore || searchLoading"
        :paused="scrollContext.paused"
        :progress="scrollContext.progress ?? 0"
        @expand="topBarCollapsed = false"
      />
    </transition>

    <!-- Scroll controls: a floating glass capsule, single chevrons. -->
    <transition name="fade">
      <div
        class="border-base-content/10 bg-base-200/70 fixed right-6 bottom-6 z-10 flex flex-col overflow-hidden rounded-[var(--control-radius)] border shadow-lg backdrop-blur-xl"
        v-if="!historical"
        v-show="!atTop || scrollContext.paused"
      >
        <!-- Go to top: loads all the way back to the first line. -->
        <button
          class="hover:bg-base-content/10 text-primary flex size-11 items-center justify-center transition-colors disabled:opacity-40"
          :disabled="atTop && !goingToTop"
          @click="scrollToTop()"
          :aria-label="$t('button.scroll-to-top')"
          :title="$t('button.scroll-to-top')"
        >
          <span v-if="goingToTop" class="loading loading-spinner loading-sm"></span>
          <mdi:chevron-up v-else class="size-5" />
        </button>
        <div class="bg-base-content/10 mx-2 h-px"></div>
        <!-- Go to bottom: back to the live tail. -->
        <button
          class="hover:bg-base-content/10 text-primary flex size-11 items-center justify-center transition-colors disabled:opacity-40"
          :class="{ 'animate-bounce-fast': hasMore }"
          :disabled="!scrollContext.paused"
          @click="scrollToBottom()"
          :aria-label="$t('button.scroll-to-bottom')"
          :title="$t('button.scroll-to-bottom')"
        >
          <mdi:chevron-down class="size-5" />
        </button>
      </div>
    </transition>
  </section>
</template>

<script lang="ts">
// Every log view on screen, in mount order, so the find shortcut can pick one.
// Module scope on purpose: the panes have to see each other.
const searchPanes: { el: { value: HTMLElement | Element | null } }[] = [];
</script>

<script lang="ts" setup>
import { useScrollControlsProvider } from "@/composable/scrollControls";
import { search, topBarCollapsed } from "@/stores/settings";

const { scrollable = false } = defineProps<{ scrollable?: boolean }>();

const slots = useSlots();
const hasHeader = computed(() => !!slots.header);

const { showSearch, searchLoading, searchStatus, focusSearch } = useSearchFilter();

const hasMore = ref(false);
const atTop = ref(true);
const goingToTop = ref(false);
const jumpedToTop = ref(false);
const scrollObserver = ref<HTMLElement>();
const scrollTopObserver = ref<HTMLElement>();
const scrollableContent = ref<HTMLElement>();
const barRow = ref<HTMLElement>();

// Height of the primary bar row. The log content is inset by this much so the
// first lines clear the floating bar. Kept in a ref (not reset on collapse) so
// the inset — and therefore the scroll area — stays constant across toggles.
const barHeight = ref(48);
useResizeObserver(barRow, ([entry]) => {
  const h = (entry.target as HTMLElement).offsetHeight;
  if (h > 0) barHeight.value = h;
});

const scrollContext = provideScrollContext();

const { loadingMore, historical, jumpToOldest, reconnect, containers } = useLoggingContext();

// Search is only meaningful on live tails; the top bar collapses only on the
// single primary view (not historical, not side-by-side columns) and only while
// there is something to show in the floating stat widget.
const showSearchControls = computed(() => search.value && !historical.value);
const hasRunningStats = computed(() => containers.value.some((c) => c.state === "running"));
const canCollapse = computed(() => !scrollable && !historical.value && hasRunningStats.value);
const collapsed = computed(() => canCollapse.value && topBarCollapsed.value);
// Space reserved at the top of the scroll area for the floating bar; 0 when the
// bar is collapsed. Exposed to descendants (e.g. the sticky SearchStatus) as
// --log-top-inset so they sit below the bar instead of under it.
const topInset = computed(() => (collapsed.value ? 0 : barHeight.value));

// Already clamped to 0..1 by scrollProgress, and undefined while unmeasured.
const progressPercent = computed(() =>
  scrollContext.progress === undefined ? undefined : Math.round(scrollContext.progress * 100),
);

// ⌘/⌃F opens the integrated search row. Lives here (not in Search.vue) because
// the row is unmounted while the bar is collapsed — opening search must first
// expand the bar back so the row can appear.
//
// Every mounted view registers this handler, so with side-by-side columns they
// would all fire and all open. Exactly one view answers: the one under the
// pointer, or the first mounted (the main pane) when the pointer is elsewhere.
// useCurrentElement, not a template ref: this component's root *is* the section,
// and resolving it from the instance cannot get out of step with the template.
const root = useCurrentElement<HTMLElement>();
const self = { el: root };
searchPanes.push(self);
onScopeDispose(() => {
  const index = searchPanes.indexOf(self);
  if (index !== -1) searchPanes.splice(index, 1);
});

onKeyStroke("f", (e) => {
  if (!showSearchControls.value) return;
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return;
  // Ask the browser which pane the pointer is actually in, rather than tracking
  // enter/leave ourselves — it already knows, and it stays right when panes are
  // added, removed, or resized under a stationary cursor.
  const target =
    searchPanes.find((pane) => pane.el.value instanceof Element && pane.el.value.matches(":hover")) ?? searchPanes[0];
  if (target !== self) return;

  showSearch.value = true;
  if (collapsed.value) topBarCollapsed.value = false;
  // Also when it was already open: the field may have lost the caret to the
  // log view, and find should always put it back.
  nextTick(() => focusSearch());
  e.preventDefault();
});

// Switching to a different container (or container set) re-expands the bar, so a
// collapsed bar doesn't carry over and hide the new container's stats.
watch(
  () => containers.value.map((c) => c.id).join(","),
  () => {
    topBarCollapsed.value = false;
  },
);

if (!historical.value) {
  useIntersectionObserver(scrollObserver, ([entry]) => (scrollContext.paused = entry.intersectionRatio == 0), {
    threshold: [0, 1],
    rootMargin: "40px 0px",
  });

  useIntersectionObserver(scrollTopObserver, ([entry]) => (atTop.value = entry.intersectionRatio != 0), {
    threshold: [0, 1],
    rootMargin: "40px 0px",
  });

  useMutationObserver(
    scrollableContent,
    (records) => {
      if (!scrollContext.paused) {
        scrollToBottom();
      } else {
        const record = records[records.length - 1];
        const children = (record.target as HTMLElement).children;
        if (children[children.length - 1] == record.addedNodes[record.addedNodes.length - 1]) {
          hasMore.value = true;
        }
      }
    },
    { childList: true, subtree: true },
  );
}

async function scrollToBottom(behavior: "auto" | "smooth" = "auto") {
  // If we jumped to the oldest window, reconnect to the live tail rather than
  // scrolling within the head window.
  if (jumpedToTop.value && reconnect?.value) {
    jumpedToTop.value = false;
    scrollContext.paused = false;
    reconnect.value();
    await nextTick();
  }
  scrollObserver.value?.scrollIntoView({ behavior });
  hasMore.value = false;
}

async function scrollToTop() {
  // Jump straight to the first lines by loading only the oldest window, instead
  // of lazily loading everything in between.
  const jump = jumpToOldest?.value;
  if (jump) {
    goingToTop.value = true;
    try {
      await jump();
      jumpedToTop.value = true;
    } finally {
      goingToTop.value = false;
    }
    await nextTick();
  }
  scrollTopObserver.value?.scrollIntoView({ behavior: "auto" });
}

// Expose the scroll targets to the global command palette while this view is
// mounted, so "/scroll top" and "/scroll bottom" drive the current log page.
useScrollControlsProvider({
  scrollToTop: () => scrollToTop(),
  scrollToBottom: () => scrollToBottom("smooth"),
});
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

.widget-pop-enter-active {
  transition:
    transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 160ms ease;
}
.widget-pop-leave-active {
  transition:
    transform 140ms ease,
    opacity 140ms ease;
}
.widget-pop-enter-from,
.widget-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.96);
}

/* Loading spinner in row 2: ease its width/opacity so it doesn't pop the
   adjacent status text sideways. */
.status-fade-enter-active,
.status-fade-leave-active {
  transition:
    opacity 200ms ease,
    max-width 220ms cubic-bezier(0.32, 0.72, 0, 1),
    margin 220ms cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
  max-width: 1.25rem;
}
.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
  max-width: 0;
  margin-right: -0.5rem;
}

/* Row-2 progress readout (percentage + date) slides in from the left as it
   appears when you scroll up, and out again when you rejoin the tail. */
.progress-status-enter-active,
.progress-status-leave-active {
  transition:
    opacity 200ms ease,
    transform 240ms cubic-bezier(0.32, 0.72, 0, 1);
}
.progress-status-enter-from,
.progress-status-leave-to {
  opacity: 0;
  transform: translateX(-0.5rem);
}

/* The progress bar fades in and out (it keeps its Tailwind translate for
   positioning, so only opacity is animated here to avoid transform conflicts). */
.progress-bar-enter-active,
.progress-bar-leave-active {
  transition: opacity 240ms ease;
}
.progress-bar-enter-from,
.progress-bar-leave-to {
  opacity: 0;
}
</style>

<style>
.splitpanes__pane {
  overflow: unset !important;
}
</style>
