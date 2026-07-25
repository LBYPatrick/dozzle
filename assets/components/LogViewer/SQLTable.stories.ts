import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SQLTable from "./SQLTable.vue";

// SQLTable expects an Apache Arrow Table. Building a real one is out of scope for
// a story, so these cover the two states that do not read row data: the loading
// skeleton and the empty (no-results) panel.
const emptyTable = { numRows: 0, get: () => ({}) } as any;

const meta = {
  title: "LogViewer/SQLTable",
  component: SQLTable,
  render: (args) => ({
    components: { SQLTable },
    setup: () => ({ args }),
    template: `<div class="w-[720px]"><SQLTable v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SQLTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { args: { loading: true, table: emptyTable } };

export const Empty: Story = { args: { loading: false, table: emptyTable } };
