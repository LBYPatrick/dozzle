import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LoadMoreLogItem from "./LoadMoreLogItem.vue";
import { LoadMoreLogEntry } from "@/models/LogEntry";

const entry = new LoadMoreLogEntry(new Date("2026-07-24T14:30:00Z"), async () => {
  /* no-op loader for the story */
});

const meta = {
  title: "LogViewer/LoadMoreLogItem",
  component: LoadMoreLogItem,
  render: (args) => ({
    components: { LoadMoreLogItem },
    setup: () => ({ args }),
    template: `<LoadMoreLogItem v-bind="args" />`,
  }),
} satisfies Meta<typeof LoadMoreLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { logEntry: entry } as any };
