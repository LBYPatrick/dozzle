<template>
  <PageWithLinks fill>
    <section class="flex min-h-0 flex-1 flex-col">
      <!-- Header -->
      <div class="mb-4 flex shrink-0 items-center gap-3">
        <h2 class="text-lg font-semibold">{{ $t("cloud-search.results-page-title") }}</h2>
        <span v-if="committedQuery" class="text-base-content/70 font-mono text-sm">"{{ committedQuery }}"</span>
        <span v-if="cloudSearch.available.value" class="status-pill status-pill-primary ml-auto">
          <mdi:flash class="size-3" /> {{ $t("cloud-search.hero-pill-indexed") }}
        </span>
      </div>

      <!-- Status line -->
      <div class="text-base-content/70 mb-3 flex h-5 shrink-0 items-center gap-2 text-xs">
        <template v-if="cloudSearch.loading.value">
          <span class="loading loading-spinner loading-xs"></span>
          <span>{{ $t("cloud-search.searching") }}</span>
        </template>
        <template v-else-if="cloudSearch.error.value">
          <mdi:alert-circle-outline class="text-error size-3.5" />
          <span>{{ $t("cloud-search.search-failed") }}</span>
        </template>
        <template v-else-if="committedQuery && hits.length === 0">
          <span>{{ $t("cloud-search.no-results") }}</span>
        </template>
        <template v-else-if="!committedQuery">
          <span>{{ $t("cloud-search.search-empty-prompt") }}</span>
        </template>
        <template v-else>
          <span class="font-mono">{{ $t("cloud-search.hits-count", { n: hits.length }) }}</span>
          <span class="text-base-content/50">{{ $t("cloud-search.window-suffix") }}</span>
        </template>
      </div>

      <!-- Results table — scrolls internally so the page itself never scrolls. -->
      <div
        v-if="hits.length"
        ref="scrollEl"
        class="rounded-box border-base-content/10 min-h-0 flex-1 overflow-auto border"
      >
        <table class="table-md md:table-lg table-pin-rows table w-full table-fixed">
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                class="bg-base-200 text-base-content/60 border-base-content/10 border-b text-xs font-medium tracking-wider uppercase"
                :class="col.thClass"
                :aria-sort="ariaSort(col.key)"
              >
                <button
                  type="button"
                  class="group hover:text-base-content inline-flex items-center gap-1 transition-colors"
                  @click="toggleSort(col.key)"
                >
                  {{ $t(col.label) }}
                  <mdi:chevron-up v-if="sortKey === col.key && sortDir === 'asc'" class="text-primary size-3.5" />
                  <mdi:chevron-down v-else-if="sortKey === col.key" class="text-primary size-3.5" />
                  <mdi:unfold-more-horizontal
                    v-else
                    class="size-3.5 opacity-0 transition-opacity group-hover:opacity-40"
                  />
                </button>
              </th>
              <!-- trailing chevron column (not sortable) -->
              <th class="bg-base-200 border-base-content/10 w-10 border-b"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(hit, i) in sortedHits"
              :key="`${hit.containerId}-${hit.ts}-${hit.logId ?? 0}-${i}`"
              class="group hover:bg-primary/5 cursor-pointer transition-colors"
              @click="openDetails(hit)"
            >
              <td class="text-base-content/70 font-mono text-xs whitespace-nowrap tabular-nums">
                {{ formatTs(hit.ts) }}
              </td>
              <td>
                <span
                  class="inline-flex items-center rounded px-2 py-0.5 font-mono text-[0.7rem] font-semibold tracking-wide uppercase"
                  :class="levelChipClass(hit.level)"
                  >{{ hit.level || "info" }}</span
                >
              </td>
              <td class="font-mono text-xs">
                <div class="flex items-center gap-2">
                  <span class="truncate" :class="isLive(hit) ? 'text-base-content/80' : 'text-base-content/50'">
                    {{ hit.containerName }}
                  </span>
                  <span
                    v-if="!isLive(hit)"
                    :title="$t('cloud-search.container-removed')"
                    class="text-base-content/50 bg-base-content/10 shrink-0 rounded px-1.5 py-0.5 text-[0.65rem]"
                  >
                    {{ $t("cloud-search.container-removed-pill") }}
                  </span>
                </div>
              </td>
              <td>
                <div class="truncate font-mono text-xs" v-html="highlight(hit.message, committedQuery)"></div>
              </td>
              <td class="w-10 text-right">
                <mdi:chevron-right
                  class="text-base-content/25 group-hover:text-base-content/60 inline size-4 transition-colors"
                  :aria-label="$t('action.show-details')"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="cloudSearch.hasMore.value || cloudSearch.loadingMore.value"
          class="text-base-content/60 flex h-10 items-center justify-center text-xs"
        >
          <span v-if="cloudSearch.loadingMore.value" class="loading loading-spinner loading-xs"></span>
        </div>
      </div>

      <!-- Empty / cloud-not-available states, centered in the remaining space -->
      <div v-else class="flex min-h-0 flex-1 items-center justify-center">
        <div
          v-if="!cloudSearch.available.value && committedQuery"
          class="bg-base-200 border-base-content/10 rounded-box border p-8 text-center"
        >
          <mdi:cloud-off-outline class="text-base-content/40 mx-auto mb-3 size-10" />
          <p class="text-base-content/80 text-sm">
            {{
              cloudConfig?.linked ? $t("cloud-search.enable-streaming-to-search") : $t("cloud-search.connect-to-enable")
            }}
          </p>
          <RouterLink to="/settings/cloud" class="btn btn-primary btn-sm mt-4">
            {{ $t("cloud-search.cta-settings") }}
          </RouterLink>
        </div>
      </div>
    </section>
  </PageWithLinks>
</template>

<script lang="ts" setup>
import { useCloudConfig } from "@/composable/cloudConfig";
import { useCloudLogSearch, type CloudLogHit } from "@/composable/cloudLogSearch";
import CloudLogDetails from "@/components/LogViewer/CloudLogDetails.vue";

const route = useRoute();

function readQ(q: unknown): string {
  return typeof q === "string" ? q : "";
}

const committedQuery = ref(readQ(route.query.q));

const { cloudConfig } = useCloudConfig();
const cloudSearch = useCloudLogSearch(committedQuery);
const hits = computed<CloudLogHit[]>(() => cloudSearch.results.value);

// Look up containers in the live store so we can mark hits whose containers
// have been removed. Rows stay clickable either way — the drawer renders from
// the hit itself.
const containerStore = useContainerStore();
const liveIds = computed(() => new Set(Object.keys(containerStore.allContainersById)));
function isLive(hit: CloudLogHit): boolean {
  return liveIds.value.has(hit.containerId);
}

// Sortable columns — each header cycles through three states on click:
// ascending -> descending -> default (no column sort, server order = newest
// first). A different column always starts fresh at ascending.
type SortKey = "time" | "level" | "container" | "message";
const columns: { key: SortKey; label: string; thClass: string }[] = [
  { key: "time", label: "cloud-search.col-time", thClass: "w-44" },
  { key: "level", label: "cloud-search.col-level", thClass: "w-24" },
  { key: "container", label: "cloud-search.col-container", thClass: "w-52" },
  { key: "message", label: "cloud-search.col-message", thClass: "" },
];

// null key = default order (whatever the server returned, newest first).
const sortKey = ref<SortKey | null>(null);
const sortDir = ref<"asc" | "desc">("asc");

function toggleSort(key: SortKey) {
  if (sortKey.value !== key) {
    sortKey.value = key;
    sortDir.value = "asc";
  } else if (sortDir.value === "asc") {
    sortDir.value = "desc";
  } else {
    sortKey.value = null; // third click resets to the default order
  }
}

function ariaSort(key: SortKey): "ascending" | "descending" | "none" {
  if (sortKey.value !== key) return "none";
  return sortDir.value === "asc" ? "ascending" : "descending";
}

function compareBy(a: CloudLogHit, b: CloudLogHit, key: SortKey): number {
  switch (key) {
    // ts is nanoseconds (> Number.MAX_SAFE_INTEGER); compare, don't subtract.
    case "time":
      return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
    case "level":
      return (a.level || "").localeCompare(b.level || "");
    case "container":
      return a.containerName.localeCompare(b.containerName);
    case "message":
      return a.message.localeCompare(b.message);
  }
}

const sortedHits = computed(() => {
  const key = sortKey.value;
  if (key === null) return hits.value; // default: server order (newest first)
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...hits.value].sort((a, b) => dir * compareBy(a, b, key));
});

// Infinite scroll now watches the table's own scroll container, since the page
// no longer scrolls.
const scrollEl = ref<HTMLElement>();
useInfiniteScroll(scrollEl, () => cloudSearch.loadMore(), {
  distance: 200,
  canLoadMore: () => cloudSearch.hasMore.value && !cloudSearch.loadingMore.value,
});

watch(
  () => route.query.q,
  (q) => {
    committedQuery.value = readQ(q);
  },
);

const showDrawer = useDrawer();
function openDetails(hit: CloudLogHit) {
  showDrawer(CloudLogDetails, { hit, query: committedQuery.value }, "lg");
}

function formatTs(ns: number): string {
  const d = new Date(ns / 1e6);
  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString([], { hour12: false }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  return `${date} ${time}`;
}

// Tonal level chips (colored tint + colored text, no outline). Colors mirror
// the app's level palette (LogLevel.vue / the drawer's Tag) so a row chip and
// the detail panel agree: green info, orange warn, red error, purple debug.
function levelChipClass(level: string): string {
  switch ((level || "").toLowerCase()) {
    case "error":
    case "fatal":
      return "bg-error/15 text-error";
    case "warn":
    case "warning":
      return "bg-warning/15 text-warning";
    case "info":
      return "bg-success/15 text-success";
    case "debug":
    case "trace":
      return "bg-purple/15 text-purple";
    default:
      return "bg-base-content/10 text-base-content/60";
  }
}

// Safe with v-html: escapeHtml runs first, then <mark> tags are added against
// a regex anchored on the (already-escaped) needle. Don't drop the escape
// thinking it's redundant — the message comes from indexed log content.
function highlight(message: string, q: string): string {
  if (!q) return escapeHtml(message);
  const pattern = q.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(`(${pattern})`, "gi");
  return escapeHtml(message).replace(re, '<mark class="bg-warning text-warning-content rounded px-0.5">$1</mark>');
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
</script>
