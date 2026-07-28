import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DataTable, { type DataTableColumn, type DataTableSort } from "./DataTable.vue";

const columns: DataTableColumn[] = [
  { key: "name", label: "Container name" },
  { key: "host", label: "Host", class: "w-1" },
  { key: "state", label: "Status", class: "w-1" },
  { key: "cpu", label: "Avg. CPU (%)", class: "min-w-48" },
];

const rows = [
  { name: "web-frontend", host: "localhost", state: "running", cpu: "12.4" },
  { name: "api-server", host: "prod-node-1", state: "running", cpu: "38.1" },
  { name: "redis-cache", host: "prod-node-1", state: "paused", cpu: "0.3" },
  { name: "old-worker", host: "staging", state: "exited", cpu: "0.0" },
];

const meta = {
  title: "Common/DataTable",
  component: DataTable,
  render: (args) => ({
    components: { DataTable },
    setup() {
      const sort = ref<DataTableSort>((args as { sort?: DataTableSort }).sort ?? { key: "name", direction: 1 });
      return { args, sort, rows };
    },
    template: `
      <div style="width:46rem">
        <DataTable v-bind="args" v-model:sort="sort">
          <tr v-for="row in rows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.host }}</td>
            <td>{{ row.state }}</td>
            <td>{{ row.cpu }}%</td>
          </tr>
        </DataTable>
      </div>`,
  }),
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { columns, sort: { key: "name", direction: 1 } } };

export const SortedDescending: Story = {
  args: { columns, sort: { key: "cpu", direction: -1 } },
};

/** No column sorted: the caller's natural order, reachable via tristate. */
export const Unsorted: Story = {
  args: { columns, tristate: true, sort: { key: null, direction: 1 } },
};

/** A non-sortable trailing column, as the cloud search results use. */
export const WithStaticColumn: Story = {
  args: {
    fixed: true,
    columns: [...columns, { key: "details", label: "", class: "w-10", sortable: false }],
    sort: { key: "name", direction: 1 },
  },
};

export const WithFooter: Story = {
  render: (args) => ({
    components: { DataTable },
    setup() {
      const sort = ref<DataTableSort>({ key: "name", direction: 1 });
      return { args, sort, rows };
    },
    template: `
      <div style="width:46rem">
        <DataTable v-bind="args" v-model:sort="sort">
          <tr v-for="row in rows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.host }}</td>
            <td>{{ row.state }}</td>
            <td>{{ row.cpu }}%</td>
          </tr>
          <template #footer>
            <div class="text-base-content/60 flex h-10 items-center justify-center text-xs">Loading more…</div>
          </template>
        </DataTable>
      </div>`,
  }),
  args: { columns, sort: { key: "name", direction: 1 } },
};
