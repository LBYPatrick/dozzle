import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HistoricalContainerLog from "./HistoricalContainerLog.vue";

// Route-level viewer: resolves its Container from the store by id and streams
// historical logs from the given date. Renders empty without store data / SSE.
const meta = {
  title: "ContainerViewer/HistoricalContainerLog",
  component: HistoricalContainerLog,
  render: (args) => ({
    components: { HistoricalContainerLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><HistoricalContainerLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HistoricalContainerLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { id: "abc123def456", date: new Date("2026-07-24T10:00:00Z"), showTitle: true, scrollable: true },
};
