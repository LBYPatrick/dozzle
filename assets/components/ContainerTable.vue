<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-row">
      <div v-if="Object.keys(hosts).length > 1" class="flex-1">
        <div role="tablist" class="tabs-boxed tabs block" v-if="Object.keys(hosts).length < 4">
          <input
            type="radio"
            name="host"
            role="tab"
            class="tab rounded-sm!"
            aria-label="Show All"
            v-model="selectedHost"
            :value="null"
          />
          <input
            type="radio"
            name="host"
            role="tab"
            class="tab rounded-sm!"
            :aria-label="host.name"
            v-for="host in hosts"
            :value="host.id"
            :key="host.id"
            v-model="selectedHost"
          />
        </div>

        <DropdownMenu
          class="btn-sm"
          v-model="selectedHost"
          :options="[
            { label: 'Show All', value: null },
            ...Object.values(hosts).map((host) => ({ label: host.name, value: host.id })),
          ]"
          v-else
        />
      </div>
      <div class="flex flex-1 items-center justify-end gap-2">
        <div v-show="containers.length > pageSizes[0]">
          {{ $t("label.per-page") }}

          <DropdownMenu
            class="dropdown-left btn-xs md:btn-sm"
            v-model="perPage"
            :options="pageSizes.map((i) => ({ label: i.toLocaleString(), value: i }))"
          />
        </div>
        <div class="join max-md:hidden">
          <button
            class="btn join-item btn-xs md:btn-sm"
            :class="statMode === 'chart' ? 'btn-active' : 'btn-ghost'"
            @click="statMode = 'chart'"
          >
            <mdi:chart-bar />
          </button>
          <button
            class="btn join-item btn-xs md:btn-sm"
            :class="statMode === 'progress' ? 'btn-active' : 'btn-ghost'"
            @click="statMode = 'progress'"
          >
            <mdi:poll class="scale-x-[-1] rotate-90" />
          </button>
        </div>
      </div>
    </div>
    <DataTable :columns v-model:sort="sort">
      <tr
        v-for="container in paginated"
        :key="container.id"
        v-memo="[container.id, statMode, isMobile]"
        class="hover:bg-base-100/80!"
      >
        <td v-if="isVisible('name')" class="max-w-80 truncate max-md:max-w-32">
          <router-link :to="{ name: '/container/[id]', params: { id: container.id } }" :title="container.name">
            {{ container.name }}
          </router-link>
        </td>
        <td v-if="isVisible('host')">{{ container.hostLabel }}</td>
        <td v-if="isVisible('state')">{{ container.state }}</td>
        <td v-if="isVisible('created')">
          <RelativeTime :date="container.created" />
        </td>
        <td v-if="isVisible('cpu')">
          <ContainerStatCell :container="container" type="cpu" :host="hosts[container.host]" :mode="statMode" />
        </td>
        <td v-if="isVisible('mem')">
          <ContainerStatCell :container="container" type="mem" :host="hosts[container.host]" :mode="statMode" />
        </td>
      </tr>
    </DataTable>
    <div class="p-4 text-center">
      <nav class="join" v-if="isPaginated && totalPages <= 15">
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
        v-else-if="isPaginated"
        class="btn-sm"
        v-model="currentPage"
        :options="Array.from({ length: totalPages }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Container } from "@/models/Container";
import { toRefs } from "@vueuse/core";
import type { DataTableColumn } from "@/components/common/DataTable.vue";

const { hosts } = useHosts();
const selectedHost = ref(null);

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

const { containers } = defineProps<{
  containers: Container[];
}>();
type keys = keyof typeof fields;

const statMode = useStorage<"chart" | "progress">("DOZZLE_TABLE_STAT_MODE", "chart");
const perPage = useStorage("DOZZLE_TABLE_PAGE_SIZE", 15);
const pageSizes = [15, 30, 50, 100];

const storage = useStorage<{ column: keys; direction: 1 | -1 }>("DOZZLE_TABLE_CONTAINERS_SORT", {
  column: "created" as keys,
  direction: -1 as 1 | -1,
});
const { column: sortField, direction } = toRefs(storage.value);

// Adapter between the persisted shape and DataTable's model. This table always
// sorts by something, so a null key from the shared control falls back to the
// current column rather than clearing the order.
const sort = computed({
  get: () => ({ key: sortField.value as string, direction: direction.value }),
  set: ({ key, direction: dir }) => {
    if (key) sortField.value = key as keys;
    direction.value = dir;
  },
});

const { t } = useI18n();
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
  () => [filteredContainers.value.length, sortField.value, direction.value, counter.value],
  () => filteredContainers.value.sort((a, b) => fields[sortField.value].sortFunc(a, b)),
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

function isVisible(field: keys) {
  return fields[field].mobileVisible || !isMobile.value;
}
</script>
