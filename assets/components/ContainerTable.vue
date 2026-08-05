<template>
  <div class="flex flex-col" :class="fill ? 'min-h-0 gap-2' : 'gap-4'">
    <!-- The table's own header bar: title on the left, every control on the
         right, one row high. Kept here rather than in the page so the heading
         and the controls share a baseline instead of the controls floating in a
         band of their own above the table. -->
    <div class="flex h-8 shrink-0 flex-row items-center gap-2">
      <h2 v-if="title" class="section-heading">
        {{ title }} <span class="count">{{ sortedContainers.length }}</span>
      </h2>
      <div v-if="hostOptions.length > 2" class="min-w-0">
        <!-- Same choice, two shapes: segments while they still fit on the bar,
             a menu once they don't. Both read the one options list. -->
        <SegmentedControl v-if="hostOptions.length < 5" dense v-model="selectedHost" :options="hostOptions" />
        <DropdownMenu v-else class="btn-sm" v-model="selectedHost" :options="hostOptions" />
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <div v-show="containers.length > pageSizes[0]" class="text-base-content/60 text-xs">
          {{ $t("label.per-page") }}

          <DropdownMenu
            class="dropdown-left btn-xs md:btn-sm"
            v-model="perPage"
            :options="pageSizes.map((i) => ({ label: i.toLocaleString(), value: i }))"
          />
        </div>
        <ShowAllContainersToggle />
        <!-- A pair of buttons where one was "active" made the choice read as
             hover: the selected fill was the same grey every button takes under
             the pointer. As segments the choice is a raised capsule on a
             recessed track, which is only ever one thing. -->
        <SegmentedControl dense class="max-md:hidden" v-model="statMode" :options="statModeOptions">
          <template #option="{ option }">
            <mdi:chart-bar v-if="option.value === 'chart'" class="size-4" />
            <mdi:poll v-else class="size-4 scale-x-[-1] rotate-90" />
          </template>
        </SegmentedControl>
      </div>
    </div>
    <DataTable :columns v-model:sort="sort" :class="{ 'min-h-0 flex-1': fill }">
      <tr
        v-for="container in paginated"
        :key="container.id"
        v-memo="[container.id, container.state, statMode, isMobile]"
      >
        <td v-if="isVisible('name')" class="max-w-80 truncate max-md:max-w-32">
          <router-link
            :to="{ name: '/container/[id]', params: { id: container.id } }"
            :title="container.name"
            class="font-medium"
          >
            {{ container.name }}
          </router-link>
        </td>
        <td v-if="isVisible('host')" class="text-base-content/70">{{ container.hostLabel }}</td>
        <td v-if="isVisible('state')">
          <span class="state-chip" :class="stateTone(container.state)">
            <span class="state-dot"></span>{{ container.state }}
          </span>
        </td>
        <td v-if="isVisible('created')" class="text-base-content/70">
          <RelativeTime :date="container.created" />
        </td>
        <td v-if="isVisible('cpu')">
          <ContainerStatCell :container="container" type="cpu" :host="hosts[container.host]" :mode="statMode" />
        </td>
        <td v-if="isVisible('mem')">
          <ContainerStatCell :container="container" type="mem" :host="hosts[container.host]" :mode="statMode" />
        </td>
      </tr>

      <!-- Empty is a state, not an absence. Without this the table is a large
           blank panel that reads as still loading. -->
      <template #footer>
        <div v-if="paginated.length === 0" class="text-base-content/45 flex flex-col items-center gap-2 py-14">
          <ph:tray class="size-7 opacity-60" />
          <p class="text-sm">{{ $t("label.container", 0) }}</p>
        </div>
      </template>
    </DataTable>
    <div class="shrink-0 text-center" :class="fill ? 'pb-1' : 'p-4'" v-if="isPaginated">
      <nav class="join" v-if="totalPages <= 15">
        <input
          class="btn btn-square join-item"
          type="radio"
          v-model="currentPage"
          :aria-label="`${i}`"
          :value="i"
          v-for="i in totalPages"
        />
      </nav>
      <DropdownMenu
        v-else
        class="btn-sm"
        v-model="currentPage"
        :options="Array.from({ length: totalPages }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Container } from "@/models/Container";
import type { DataTableColumn } from "@/components/common/DataTable.vue";
import { CONTAINER_TABLE_PAGE_SIZES, type Settings } from "@/stores/settings";

const { hosts } = useHosts();
const selectedHost = ref<string | null>(null);

const fields: Record<
  string,
  {
    label: string;
    mobileLabel?: string;
    sortFunc: (a: Container, b: Container) => number;
    mobileVisible: boolean;
    customClass?: string;
  }
> = {
  name: {
    label: "label.container-name",
    mobileLabel: "label.name",
    sortFunc: (a: Container, b: Container) => a.name.localeCompare(b.name) * direction.value,
    mobileVisible: true,
  },
  host: {
    label: "label.host",
    sortFunc: (a: Container, b: Container) => a.hostLabel.localeCompare(b.hostLabel) * direction.value,
    mobileVisible: false,
    customClass: "w-1",
  },
  state: {
    label: "label.status",
    sortFunc: (a: Container, b: Container) => a.state.localeCompare(b.state) * direction.value,
    mobileVisible: false,
    customClass: "w-1",
  },
  created: {
    label: "label.created",
    sortFunc: (a: Container, b: Container) => (a.created.getTime() - b.created.getTime()) * direction.value,
    mobileVisible: false,
    customClass: "w-1",
  },
  cpu: {
    label: "label.avg-cpu",
    mobileLabel: "label.cpu",
    sortFunc: (a: Container, b: Container) => (a.movingAverage.cpu - b.movingAverage.cpu) * direction.value,
    mobileVisible: true,
    customClass: "min-w-48 max-md:min-w-0",
  },
  mem: {
    label: "label.avg-mem",
    mobileLabel: "label.mem",
    sortFunc: (a: Container, b: Container) =>
      (a.movingAverage.memoryUsage - b.movingAverage.memoryUsage) * direction.value,
    mobileVisible: true,
    customClass: "min-w-48 max-md:min-w-0",
  },
};

const {
  containers,
  fill = false,
  title,
} = defineProps<{
  containers: Container[];
  /** Table scrolls inside its own box instead of growing the page. The caller
      is then responsible for giving this component a bounded height. */
  fill?: boolean;
  /** Renders a heading (and live row count) on the table's own control bar. */
  title?: string;
}>();
type keys = keyof typeof fields;

// These live in the settings profile rather than three loose localStorage keys
// of this component's own, so exporting your settings actually takes the table
// with it.
const statMode = containerTableStatMode;
const perPage = containerTablePageSize;
const pageSizes = CONTAINER_TABLE_PAGE_SIZES;

// The comparators multiply by this, so the stored boolean is mapped once here
// rather than at each of the six call sites.
const direction = computed<1 | -1>(() => (containerTableSortAsc.value ? 1 : -1));

// Adapter between the stored shape and DataTable's model. This table always
// sorts by something, so a null key from the shared control falls back to the
// current column rather than clearing the order.
const sort = computed({
  get: () => ({ key: containerTableSortColumn.value as string, direction: direction.value }),
  set: ({ key, direction: dir }) => {
    if (key) containerTableSortColumn.value = key as Settings["containerTableSortColumn"];
    containerTableSortAsc.value = dir === 1;
  },
});

const { t } = useI18n();

const hostOptions = computed(() => [
  { label: t("label.all-hosts"), value: null as string | null },
  ...Object.values(hosts.value).map((host) => ({ label: host.name, value: host.id as string | null })),
]);

// Icon-only segments, so each carries its name as a tooltip and accessible
// label rather than relying on text that isn't drawn.
const statModeOptions = computed(() => [
  { label: t("label.stat-history"), title: t("label.stat-history"), value: "chart" as const },
  { label: t("label.stat-level"), title: t("label.stat-level"), value: "progress" as const },
]);

const columns = computed<DataTableColumn[]>(() =>
  Object.entries(fields).map(([key, field]) => ({
    key,
    label: t(isMobile.value && field.mobileLabel ? field.mobileLabel : field.label),
    class: field.customClass,
    hidden: !isVisible(key),
  })),
);

const counter = useInterval(10000);
const filteredContainers = computed(() =>
  containers.filter((c) => selectedHost.value === null || c.host === selectedHost.value),
);
const sortedContainers = computedWithControl(
  () => [filteredContainers.value.length, containerTableSortColumn.value, direction.value, counter.value],
  () => filteredContainers.value.sort((a, b) => fields[containerTableSortColumn.value].sortFunc(a, b)),
);

const totalPages = computed(() => Math.ceil(sortedContainers.value.length / perPage.value));
const isPaginated = computed(() => totalPages.value > 1);
const currentPage = ref(1);
watch(perPage, () => (currentPage.value = 1));
const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;

  return sortedContainers.value.slice(start, end);
});

// A running container is the normal case, so it gets the only saturated chip;
// everything stopped stays neutral rather than shouting in red about a
// container that was meant to exit.
function stateTone(state: string) {
  switch (state) {
    case "running":
      return "tone-running";
    case "paused":
    case "restarting":
      return "tone-transient";
    default:
      return "tone-stopped";
  }
}

function isVisible(field: keys) {
  // One host: the column repeats the same word on every row and costs the
  // stat columns the width they need.
  if (field === "host" && Object.keys(hosts.value).length <= 1) return false;
  return fields[field].mobileVisible || !isMobile.value;
}
</script>

<style scoped>
@reference "@/main.css";

/* Matches the hosts column's heading exactly, so the two columns start on the
   same line. */
.section-heading {
  @apply text-base-content/50 flex shrink-0 items-center gap-2 text-xs font-semibold tracking-wider uppercase;
}

.count {
  @apply bg-base-content/8 text-base-content/60 rounded-full px-1.5 py-0.5 text-[0.7rem] tabular-nums;
}

.state-chip {
  @apply inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize;
}

.state-dot {
  @apply size-1.5 shrink-0 rounded-full bg-current;
}

.tone-running {
  @apply bg-success/12;
  color: var(--color-success-text);
}

.tone-transient {
  @apply bg-warning/12;
  color: var(--color-warning-text);
}

.tone-stopped {
  @apply text-base-content/60 bg-base-content/8;
}
</style>
