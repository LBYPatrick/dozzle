<template>
  <!-- The log view is a fixed-height internal scroller so the floating top bar
       and search row can overlay it without ever changing the scroll area's
       height or position. Only forced for views that render a header (the log
       views); anything else keeps the default flow. -->
  <section
    class="relative flex min-h-0 flex-col"
    :class="hasHeader ? 'h-[calc(100dvh-var(--mobile-nav-height))] md:h-dvh' : ''"
  >
    <main
      :data-scrolling="scrollable ? true : undefined"
      class="relative min-h-[300px] flex-1 snap-y overflow-auto"
      :style="hasHeader ? { paddingTop: `${barHeight}px` } : undefined"
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
    <header
      v-if="hasHeader && !collapsed"
      class="border-base-content/10 bg-base-200/72 absolute inset-x-0 top-0 z-20 border-b shadow-sm backdrop-blur-xl backdrop-saturate-150"
    >
      <div ref="barRow" class="flex items-stretch py-0.5 md:py-1.5">
        <div class="min-w-0 flex-1"><slot name="header"></slot></div>
        <div class="flex shrink-0 items-center gap-0.5 pr-1.5 md:pr-2.5">
          <span
            v-if="loadingMore"
            class="loading loading-spinner loading-sm text-primary mr-1"
            :title="$t('label.loading')"
          ></span>
          <button
            v-if="showSearchControls"
            type="button"
            class="btn btn-ghost btn-sm btn-square transition-colors"
            :class="{ 'text-primary': isSearching }"
            @click="showSearch ? resetSearch() : (showSearch = true)"
            :title="$t('toolbar.search')"
            :aria-label="$t('toolbar.search')"
          >
            <mdi:magnify class="size-5" />
          </button>
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

      <!-- Determinate scroll progress: a horizontal strip along the bar's foot,
           overlaid (absolute) so it never grows the measured bar height. -->
      <transition name="fade">
        <ScrollProgressBar
          v-show="scrollContext.paused"
          :progress="scrollContext.progress"
          :date="scrollContext.currentDate"
          class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full"
        />
      </transition>

      <!-- Integrated search: a right-aligned glass pill, overlaid below the bar. -->
      <Search v-if="showSearchControls" />
    </header>

    <transition name="widget-pop">
      <TopBarStatWidget
        v-if="collapsed"
        :containers="containers"
        :loading="loadingMore"
        :paused="scrollContext.paused"
        :progress="scrollContext.progress"
        @expand="topBarCollapsed = false"
      />
    </transition>

    <!-- Scroll controls: a floating glass capsule, single chevrons. -->
    <transition name="fade">
      <div
        class="border-base-content/10 bg-base-200/70 fixed right-6 bottom-6 z-10 flex flex-col overflow-hidden rounded-full border shadow-lg backdrop-blur-xl"
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

<script lang="ts" setup>
import { useScrollControlsProvider } from "@/composable/scrollControls";
import { search, topBarCollapsed } from "@/stores/settings";

const { scrollable = false } = defineProps<{ scrollable?: boolean }>();

const slots = useSlots();
const hasHeader = computed(() => !!slots.header);

const { showSearch, isSearching, resetSearch } = useSearchFilter();

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
</style>

<style>
.splitpanes__pane {
  overflow: unset !important;
}
</style>
