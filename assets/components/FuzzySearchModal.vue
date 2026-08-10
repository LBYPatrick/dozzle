<template>
  <!-- Single bordered card containing the input, results, and footer in one
       frame to match the design mock. No daisyUI input/dropdown chrome. -->
  <div class="glass-surface glass-surface-thick w-full overflow-hidden rounded-2xl">
    <!-- Input row -->
    <div class="group/field flex items-center gap-3 px-4 py-3.5">
      <!-- The glyph is the mode indicator. A leading "/" turns the palette into
           a command autocomplete, which was a silent change: the field looked
           exactly like container search while behaving nothing like it. A
           chevron is the prompt glyph everywhere else that has one, and it is
           drawn in stroke like the magnifier it replaces — a filled shape beside
           an outlined field would read as a different weight of control, not the
           same one in another mode. -->
      <Transition name="mode-icon" mode="out-in">
        <mdi:chevron-right v-if="isCommandMode" key="command" class="command-glyph size-5 shrink-0" />
        <mdi:magnify
          v-else
          key="search"
          class="text-base-content/60 group-focus-within/field:text-primary-safe size-5 shrink-0 transition-colors"
        />
      </Transition>
      <!-- Combobox semantics. Without them a screen reader was told only that
           there was a text box: the result list below it was an unlabelled
           stack of anchors, and the arrow-key selection moved a highlight
           nothing announced. `aria-activedescendant` makes the selected row the
           thing that gets read as you move. -->
      <input
        role="combobox"
        aria-controls="palette-results"
        :aria-expanded="totalCount > 0"
        :aria-activedescendant="totalCount ? `palette-option-${selectedIndex}` : undefined"
        aria-autocomplete="list"
        class="text-base-content placeholder:text-base-content/40 flex-1 bg-transparent text-base outline-none"
        ref="input"
        @keydown.down.prevent="selectedIndex = Math.min(selectedIndex + 1, totalCount - 1)"
        @keydown.up.prevent="selectedIndex = Math.max(selectedIndex - 1, 0)"
        @keydown.enter.exact="onEnter"
        @keydown.shift.enter.exact.prevent="runLogSearch"
        @keydown.alt.enter.exact.prevent="onPin"
        v-model="query"
        :placeholder="placeholderCopy"
      />
      <!-- Clearing the query is a step back to the full command list, not a way
           out of the palette, so it sits before the dismiss control. -->
      <transition name="clear">
        <button
          v-if="query.length"
          type="button"
          class="text-base-content/40 hover:text-base-content flex shrink-0 items-center transition-colors"
          :title="$t('button.clear-input')"
          :aria-label="$t('button.clear-input')"
          @click="clearQuery"
        >
          <mdi:close-circle class="size-4" />
        </button>
      </transition>
      <form method="dialog" class="flex">
        <button v-if="isMobile" class="text-base-content/50 hover:text-base-content">
          <mdi:close class="size-5" />
        </button>
        <button v-else>
          <kbd class="kbd kbd-xs">esc</kbd>
        </button>
      </form>
    </div>

    <!-- Body: results + log search CTA. Only renders when there is something
         to show — keeps the empty modal compact. -->
    <div
      v-if="totalCount || logSearchVisible"
      id="palette-results"
      role="listbox"
      class="border-base-content/10 border-t"
    >
      <!-- Commands section -->
      <template v-if="commandEntries.length">
        <div class="text-base-content/40 px-4 pt-3 pb-1.5 text-xs font-semibold tracking-wider uppercase">
          {{ $t("command-palette.section-commands") }} · {{ commandEntries.length }}
        </div>
        <ul class="max-h-[50vh] overflow-y-auto overscroll-contain pb-1">
          <li v-for="(command, index) in commandEntries" :ref="(el) => setItemRef(el, index)">
            <div
              :id="`palette-option-${index}`"
              role="option"
              :aria-selected="index === selectedIndex"
              class="row-pressable flex items-center gap-3 px-4 py-2"
              :class="{ 'bg-base-content/10': index === selectedIndex }"
              @click="runCommand(command)"
            >
              <!-- A colour command shows its colour. The inset ring keeps a pale
                   swatch visible against the row on the light theme. -->
              <span
                v-if="command.swatch"
                class="size-4 shrink-0 rounded-full ring-1 ring-black/15 ring-inset"
                :style="{ backgroundColor: command.swatch }"
              />
              <component v-else :is="command.icon" class="text-base-content/60 size-4 shrink-0" />
              <span class="min-w-0 flex-1 truncate text-sm">{{ command.title }}</span>
              <span class="text-base-content/30 shrink-0 font-mono text-xs">{{ command.slash }}</span>
              <ic:sharp-keyboard-return v-if="index === selectedIndex" class="text-base-content/40 size-4" />
            </div>
          </li>
        </ul>
      </template>

      <!-- Containers section -->
      <template v-if="containerEntries.length">
        <div
          class="text-base-content/40 px-4 pt-3 pb-1.5 text-xs font-semibold tracking-wider uppercase"
          :class="{ 'border-base-content/10 mt-1 border-t': commandEntries.length }"
        >
          {{ $t("cloud-search.containers-section") }} · {{ containerEntries.length }}
        </div>
        <ul class="pb-1">
          <li v-for="(result, index) in containerEntries" :ref="(el) => setItemRef(el, commandEntries.length + index)">
            <div
              :id="`palette-option-${commandEntries.length + index}`"
              role="option"
              :aria-selected="commandEntries.length + index === selectedIndex"
              class="row-pressable flex items-center gap-3 px-4 py-2"
              :class="{ 'bg-base-content/10': commandEntries.length + index === selectedIndex }"
              @click="selected(result.item)"
            >
              <div :class="result.item.state === 'running' ? 'text-primary-safe' : 'text-base-content/50'">
                <template v-if="result.item.type === 'container'">
                  <octicon:container-24 class="size-4" />
                </template>
                <template v-else-if="result.item.type === 'service'">
                  <ph:stack-simple class="size-4" />
                </template>
                <template v-else-if="result.item.type === 'stack'">
                  <ph:stack class="size-4" />
                </template>
              </div>
              <div class="min-w-0 flex-1 truncate text-sm">
                <template v-if="config.hosts.length > 1 && result.item.host">
                  <span class="text-base-content/50 font-light">{{ result.item.host }}</span>
                  <span class="text-base-content/30"> / </span>
                </template>
                <span class="text-base-content" data-name v-html="matchedName(result)"></span>
              </div>
              <RelativeTime :date="result.item.created" class="text-base-content/40 text-xs" />
              <!-- A real button with a real target. It was a 16px <span> with a
                   click handler: unreachable by keyboard, and the smallest hit
                   area in the palette. -->
              <button
                v-if="result.item.type === 'container' || commandEntries.length + index === selectedIndex"
                type="button"
                @click.stop="addColumn(result.item)"
                :title="$t('tooltip.pin-column')"
                :aria-label="$t('tooltip.pin-column')"
                class="text-base-content/40 hover:text-secondary-safe hit-44 relative flex size-6 shrink-0 items-center justify-center rounded"
              >
                <ic:sharp-keyboard-return v-if="commandEntries.length + index === selectedIndex" class="size-4" />
                <cil:columns v-else class="size-4" />
              </button>
            </div>
          </li>
        </ul>
      </template>

      <!-- Log search CTA. Always actionable: without Cloud it runs the local
           fleet-wide scan instead of advertising a product. The row used to sit
           dimmed and inert saying "Connect Dozzle Cloud to search logs", which
           read as "this cannot be done" when the server has always been able to
           do it for every container it is streaming. -->
      <div v-if="logSearchVisible" class="border-base-content/10 cursor-pointer border-t" @click="runLogSearch()">
        <div class="bg-primary/[0.07] hover:bg-primary/10 flex items-center gap-3 px-4 py-3">
          <mdi:cloud-search-outline v-if="cloudSearch.available.value" class="text-primary-safe size-5 shrink-0" />
          <mdi:text-search v-else class="text-primary-safe size-5 shrink-0" />
          <div class="flex min-w-0 flex-1 flex-col">
            <!-- text-primary-safe, not text-primary-safe: the raw accent is tuned
                 to sit behind dark text and measures 1.6:1 as a foreground on
                 the light theme. -->
            <span class="text-primary-safe truncate text-sm font-semibold">
              <i18n-t keypath="cloud-search.search-logs-for">
                <template #query>
                  <span class="font-mono">{{ searchQuery }}</span>
                </template>
              </i18n-t>
            </span>
            <span class="text-base-content/50 mt-0.5 flex items-center gap-1 text-xs">
              <template v-if="cloudSearch.available.value">
                <mdi:flash class="text-primary-safe size-3" />
                {{ $t("cloud-search.across-containers") }}
              </template>
              <!-- Says what the local scan actually covers, so the difference
                   from Cloud is a stated limit rather than a surprise. -->
              <template v-else>
                <mdi:history class="size-3" />
                {{ $t("cloud-search.local-scope") }}
              </template>
            </span>
          </div>
          <kbd class="kbd kbd-xs">⇧</kbd>
          <kbd class="kbd kbd-xs">↵</kbd>
        </div>
      </div>
    </div>

    <!-- Footer: kbd hints + cloud status. Always present while the modal is
         open so users know log search is available before they type. -->
    <div
      class="bg-base-300/40 border-base-content/10 text-base-content/50 flex items-center gap-4 border-t px-4 py-2 text-xs"
    >
      <span v-if="totalCount" class="flex items-center gap-1.5">
        <kbd class="kbd kbd-xs">↵</kbd> {{ $t("cloud-search.open-container") }}
      </span>
      <!-- Not gated on Cloud any more: Shift+Enter searches either way, and
           hiding the shortcut was telling people it did not exist. -->
      <span v-if="logSearchVisible" class="flex items-center gap-1">
        <kbd class="kbd kbd-xs">⇧</kbd><kbd class="kbd kbd-xs">↵</kbd>
        <span class="ml-0.5">{{ $t("cloud-search.search-logs-shortcut") }}</span>
      </span>

      <!-- States which engine is about to run, rather than treating one of them
           as a missing prerequisite. "Connect Dozzle Cloud to search logs" was
           simply untrue once the local scan existed. -->
      <span v-if="cloudSearch.available.value" class="ml-auto flex items-center gap-1.5">
        <mdi:cloud-check-outline class="text-primary-safe size-3.5" />
        {{ $t("cloud-search.cloud-connected") }}
      </span>
      <span v-else-if="cloudConfig?.linked" class="ml-auto flex items-center gap-1.5">
        <mdi:magnify class="size-3.5" />
        {{ $t("cloud-search.local-search") }}
        <button type="button" class="link link-hover" @click.stop="openCloudSettings">
          {{ $t("cloud-search.enable-streaming-for-indexed") }}
        </button>
      </span>
      <span v-else class="ml-auto flex items-center gap-1.5">
        <mdi:magnify class="size-3.5" />
        {{ $t("cloud-search.local-search") }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ContainerState } from "@/types/Container";
import { useFuse } from "@vueuse/integrations/useFuse";
import { type FuseResult } from "fuse.js";
import { useCloudConfig } from "@/composable/cloudConfig";
import { useCloudLogSearch } from "@/composable/cloudLogSearch";
import { useCommands, type Command } from "@/composable/commands";
import { useSettingsModal } from "@/composable/settingsModal";

const close = defineEmit();

const { openSettings } = useSettingsModal();

// Close the palette first, then open the settings popup scrolled to the cloud
// section (replaces the old /settings/cloud route link).
function openCloudSettings() {
  close();
  openSettings("visual", "cloud");
}

const router = useRouter();
const route = useRoute();

// Two ways the input can arrive non-empty, and they want opposite caret
// behaviour (see onMounted): a seeded command prefix from Cmd+Shift+P, and the
// current /cloud/search query so refining a search does not mean retyping it.
// Route lookup is null-safe for unit tests that mount without a router.
const { initialQuery: seededQuery } = useFuzzySearch();
const routeQuery = route?.path === "/cloud/search" && typeof route.query?.q === "string" ? route.query.q : "";
const seeded = seededQuery.value;
const query = ref(seeded || routeQuery);
const input = ref<HTMLInputElement>();

function clearQuery() {
  query.value = "";
  input.value?.focus();
}
const listItems = ref<(Element | null)[]>([]);
const selectedIndex = ref(0);

// Function ref into a single flat array so Commands and Containers share one
// selection index for arrow-key navigation and scroll-into-view.
function setItemRef(el: any, index: number) {
  listItems.value[index] = (el?.$el ?? el) as Element | null;
}

const containerStore = useContainerStore();
const pinnedStore = usePinnedLogsStore();
const { visibleContainers } = storeToRefs(containerStore);

const swarmStore = useSwarmStore();
const { stacks, services } = storeToRefs(swarmStore);

const { cloudConfig } = useCloudConfig();
// Mounted only so the "Search logs for X" CTA can read `available`. We
// don't render the hits inside the popup. The composable's debounced
// watch short-circuits on empty query, so opening the modal alone does
// not fire a request.
// Command mode: an unescaped leading "/" turns the palette into a slash-command
// autocomplete. "\/" is an escaped literal slash the user wants to search for,
// so it does not trigger command mode.
const isCommandMode = computed(() => query.value.startsWith("/"));

// The query used for fuzzy search, with a leading escaped slash unescaped so
// "\/foo" searches literally for "/foo" instead of triggering command mode.
const searchQuery = computed(() => (query.value.startsWith("\\/") ? query.value.slice(1) : query.value));

// Never send a slash command to cloud log search; keep it blank in command mode.
const cloudSearch = useCloudLogSearch(computed(() => (isCommandMode.value ? "" : searchQuery.value)));

const logSearchVisible = computed(() => !isCommandMode.value && searchQuery.value.trim().length > 0);

const { t } = useI18n();
const placeholderCopy = computed(() =>
  cloudSearch.available.value ? t("cloud-search.modal-placeholder-cloud") : t("cloud-search.modal-placeholder-plain"),
);

onMounted(async () => {
  const dialog = input.value?.closest("dialog");
  if (dialog) {
    const animations = dialog.getAnimations();
    await Promise.all(animations.map((animation) => animation.finished));
    input.value?.focus();
    // A seeded "/" is a starting point to type after, so the caret stays at the
    // end; a query carried in from the route is a value you are likely to
    // replace wholesale, so it arrives selected.
    if (routeQuery && !seeded) input.value?.select();
  }
});

type Item = {
  id: string;
  created: Date;
  name: string;
  state?: ContainerState;
  host?: string;
  type: "container" | "service" | "stack";
};

const list = computed(() => {
  const items: Item[] = [];

  for (const container of visibleContainers.value) {
    items.push({
      id: container.id,
      created: container.created,
      name: container.name,
      state: container.state,
      host: container.hostLabel,
      type: "container",
    });
  }

  for (const service of services.value) {
    items.push({
      id: service.name,
      created: service.updatedAt,
      name: service.name,
      state: "running",
      type: "service",
    });
  }

  for (const stack of stacks.value) {
    items.push({
      id: stack.name,
      created: stack.updatedAt,
      name: stack.name,
      state: "running",
      type: "stack",
    });
  }

  return items;
});

const { results: fuseResults } = useFuse(searchQuery, list, {
  fuseOptions: {
    keys: ["name", "host"],
    includeScore: true,
    useExtendedSearch: true,
    threshold: 0.3,
    includeMatches: true,
  },
});

// Containers are hidden in command mode so the slash-command list stands alone.
const results = computed(() => (!isCommandMode.value && searchQuery.value ? fuseResults.value : []));

// Commands palette. Fuzzy-matched against title/keywords while typing; the
// context commands (container actions) show up front on an empty query.
const { commands, contextCommands } = useCommands();
const { results: commandFuseResults } = useFuse(searchQuery, commands, {
  fuseOptions: {
    keys: ["title", "keywords"],
    useExtendedSearch: true,
    threshold: 0.3,
  },
});
const commandEntries = computed<Command[]>(() => {
  if (isCommandMode.value) {
    // Autocomplete by the explicit slash command. Substring match keeps it
    // forgiving ("/dark" finds "/theme dark"), prefix matches sort first.
    const q = query.value.toLowerCase();
    return commands.value
      .filter((c) => c.slash.toLowerCase().includes(q))
      .sort((a, b) => Number(b.slash.toLowerCase().startsWith(q)) - Number(a.slash.toLowerCase().startsWith(q)));
  }
  return searchQuery.value ? commandFuseResults.value.map((r) => r.item) : contextCommands.value;
});

const data = computed(() => {
  return [...results.value].sort((a: FuseResult<Item>, b: FuseResult<Item>) => {
    if (a.score === b.score) {
      if (a.item.state === b.item.state) {
        return b.item.created.getTime() - a.item.created.getTime();
      } else if (a.item.state === "running" && b.item.state !== "running") {
        return -1;
      } else {
        return 1;
      }
    } else {
      return (a.score ?? 0) - (b.score ?? 0);
    }
  });
});

// Container hits, mirrors the previously named `data` list for the template.
const containerEntries = computed(() => data.value);
const totalCount = computed(() => commandEntries.value.length + containerEntries.value.length);

// Reset to the top only when the user types. Live SSE container add/remove
// changes totalCount too, and resetting on that would snap the selection back
// to 0 while the palette is open.
watch(query, () => {
  selectedIndex.value = 0;
});

// Keep the selection in bounds when the result count shrinks underneath it.
watch(totalCount, (count) => {
  if (selectedIndex.value > count - 1) {
    selectedIndex.value = Math.max(count - 1, 0);
  }
});

watch(selectedIndex, () => {
  listItems.value?.[selectedIndex.value]?.scrollIntoView({ block: "nearest" });
});

function selected(item: Item) {
  if (item.type === "container") {
    router.push({ name: "/container/[id]", params: { id: item.id } });
  } else if (item.type === "service") {
    router.push({ name: "/service/[name]", params: { name: item.id } });
  } else if (item.type === "stack") {
    router.push({ name: "/stack/[name]", params: { name: item.id } });
  }
  close();
}

async function runCommand(command: Command) {
  close();
  await command.perform();
}

function onEnter() {
  // Commands come first in the flat list, then containers. With nothing
  // selectable (cloud-only query like "OOM"), fall back to log search so the
  // user isn't stuck on a popup that does nothing.
  const commandCount = commandEntries.value.length;
  if (selectedIndex.value < commandCount) {
    runCommand(commandEntries.value[selectedIndex.value]);
  } else if (containerEntries.value.length > 0) {
    selected(containerEntries.value[selectedIndex.value - commandCount].item);
  } else if (logSearchVisible.value) {
    runLogSearch();
  }
}

function onPin() {
  // Alt+Enter pins a container column. Only meaningful when a container row is
  // selected, not a command.
  const commandCount = commandEntries.value.length;
  if (selectedIndex.value >= commandCount) {
    const entry = containerEntries.value[selectedIndex.value - commandCount];
    if (entry?.item.type === "container") addColumn(entry.item);
  }
}

function runLogSearch() {
  if (isCommandMode.value) return;
  const q = searchQuery.value.trim();
  if (!q) return;
  if (cloudSearch.available.value) {
    router.push({ path: "/cloud/search", query: { q } });
  } else {
    // The local fleet-wide view reads `?search=` through useSearchFilter, so
    // the query is applied — and the server's backward scan already running —
    // by the time the page paints. No second search mechanism to maintain.
    router.push({ path: "/logs", query: { search: q } });
  }
  close();
}

function addColumn(container: { id: string }) {
  pinnedStore.pinContainer(container);
  close();
}

function matchedName({ item, matches = [] }: FuseResult<Item>) {
  const matched = matches.find((match) => match.key === "name");
  if (matched) {
    const { indices } = matched;
    const result = [];
    let lastIndex = 0;
    for (const [start, end] of indices) {
      if (lastIndex > start) continue;
      result.push(item.name.slice(lastIndex, start));
      result.push(`<mark>${item.name.slice(start, end + 1)}</mark>`);
      lastIndex = end + 1;
    }
    result.push(item.name.slice(lastIndex));
    return result.join("");
  } else {
    return item.name;
  }
}
</script>

<style scoped>
@reference "@/main.css";
:deep(mark) {
  @apply bg-transparent text-inherit underline underline-offset-2;
}

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

/* Mixing toward base-content rather than picking a second colour: it deepens on
   the light theme and brightens on the dark one from whichever accent is
   configured, so a custom accent stays the accent in both. */
.command-glyph {
  color: color-mix(in oklab, var(--color-primary) 78%, var(--color-base-content));
}

/* The two glyphs trade places rather than cutting, so entering command mode
   reads as one control changing state — the same swap the sidebar's eye
   toggle uses. out-in, so they never overlap in a 20px box. */
.mode-icon-enter-active,
.mode-icon-leave-active {
  transition:
    opacity 120ms ease,
    transform 180ms cubic-bezier(0.32, 0.72, 0, 1);
}

.mode-icon-enter-from,
.mode-icon-leave-to {
  opacity: 0;
  transform: scale(0.72) rotate(-12deg);
}

@media (prefers-reduced-motion: reduce) {
  .mode-icon-enter-active,
  .mode-icon-leave-active {
    transition: opacity 120ms ease;
  }

  .mode-icon-enter-from,
  .mode-icon-leave-to {
    transform: none;
  }
}
</style>
