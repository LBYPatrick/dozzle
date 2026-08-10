<template>
  <!-- fill: the dashboard owns the viewport and never scrolls the document.
       The page used to grow with the container table, which scrolled the whole
       layout — sidebar and resize splitter included — out from under the
       pointer. The table scrolls inside itself instead.

       The two collapse chevrons are gone with it. They were a manual accordion
       over two sections, persisted to localStorage, that existed to manage a
       height problem this layout no longer has: the summary is fixed, the hosts
       are capped, and the table takes whatever is left. An interface that asks
       you to fold it up is an interface that didn't decide. -->
  <PageWithLinks fill>
    <div class="flex min-h-0 flex-1 flex-col gap-5">
      <FleetSummary class="shrink-0" :containers="allContainers" />

      <!-- One host needs no list: the summary above already describes that
           machine, and a single tile repeating it is furniture. -->
      <section v-if="hostList.length > 1" class="flex shrink-0 flex-col">
        <h2 class="section-heading">
          {{ $t("label.hosts") }} <span class="section-count">{{ hostList.length }}</span>
        </h2>
        <!-- Capped, then scrolled. A large fleet must not push the containers
             off-screen — the table is what the page is for. -->
        <ul
          ref="hostScroller"
          class="edge-fade mt-2 grid max-h-44 gap-2 overflow-y-auto overscroll-contain pr-0.5 sm:grid-cols-2 xl:grid-cols-3"
          :style="{ '--fade-top': `${fade.top}px`, '--fade-bottom': `${fade.bottom}px` }"
        >
          <HostTile v-for="host in hostList" :key="host.id" :host="host" />
        </ul>
      </section>

      <!-- min-w-0: without it the flex item refuses to shrink below the table's
           natural width and the last column falls off the edge. -->
      <ContainerTable
        fill
        class="min-h-0 min-w-0 flex-1"
        :title="$t('label.containers')"
        :containers="visibleContainers"
      />
    </div>
  </PageWithLinks>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";
import type { Host } from "@/stores/hosts";

const { t } = useI18n();
const { hosts } = useHosts();

const containerStore = useContainerStore();
// `visibleContainers` is the store's own running-vs-all view — the one the eye
// toggle drives, wherever it was flipped. `containers` is every state, which is
// what the summary needs to show a breakdown at all.
const { containers, visibleContainers, ready } = storeToRefs(containerStore) as unknown as {
  containers: Ref<Container[]>;
  visibleContainers: Ref<Container[]>;
  ready: Ref<boolean>;
};

const hostList = computed(() => Object.values(hosts.value) as Host[]);
const allContainers = computed(() => containers.value);
const runningContainers = computed(() => allContainers.value.filter((c) => c.state === "running"));

// How much of the scroll-edge mask to draw at each end: nothing when the list
// is against that edge, growing to EDGE_FADE as it pulls away. Continuous, so
// the mask arrives with the scroll rather than being switched on by it.
const EDGE_FADE = 14;
const hostScroller = useTemplateRef<HTMLElement>("hostScroller");
const fade = ref({ top: 0, bottom: 0 });

function measureEdges() {
  const el = hostScroller.value;
  if (!el) return;
  const remaining = el.scrollHeight - el.clientHeight - el.scrollTop;
  fade.value = {
    top: Math.min(EDGE_FADE, Math.max(0, el.scrollTop)),
    bottom: Math.min(EDGE_FADE, Math.max(0, remaining)),
  };
}

useEventListener(hostScroller, "scroll", measureEdges, { passive: true });
// The list also changes height when hosts arrive or the pane is resized, and
// either can put it back against an edge without a scroll event ever firing.
useResizeObserver(hostScroller, measureEdges);
watch(hostList, () => nextTick(measureEdges), { immediate: true });

watchEffect(() => {
  if (ready.value) {
    setTitle(t("title.dashboard", { count: runningContainers.value.length }));
  }
});
</script>

<style scoped>
@reference "@/main.css";

/* `.section-heading` and `.section-count` are in main.css. They used to be
   declared here *and* verbatim in ContainerTable, for two headings that sit
   side by side on this very screen — and the two copies had already drifted to
   different opacities (/45 against /50). */

/* Both stops collapse onto their edge when the corresponding var is 0, so a
   list against an edge (or too short to scroll) gets no mask there at all
   rather than a permanent band of haze. */
.edge-fade {
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--fade-top, 0px),
    #000 calc(100% - var(--fade-bottom, 0px)),
    transparent 100%
  );
}
</style>
