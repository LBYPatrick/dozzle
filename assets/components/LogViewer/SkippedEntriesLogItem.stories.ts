import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SkippedEntriesLogItem from "./SkippedEntriesLogItem.vue";
import { SimpleLogEntry, SkippedLogsEntry } from "@/models/LogEntry";

const firstSkipped = new SimpleLogEntry(
  "GET /health 200",
  "abc123def456",
  10,
  new Date("2026-07-24T14:00:00Z"),
  "info",
  "stdout",
  "GET /health 200",
);

const lastSkipped = new SimpleLogEntry(
  "GET /health 200",
  "abc123def456",
  158,
  new Date("2026-07-24T14:05:00Z"),
  "info",
  "stdout",
  "GET /health 200",
);

const logEntry = new SkippedLogsEntry(new Date("2026-07-24T14:05:00Z"), 148, firstSkipped, lastSkipped, async () => {});

const meta = {
  title: "LogViewer/SkippedEntriesLogItem",
  component: SkippedEntriesLogItem,
  render: (args) => ({
    components: { SkippedEntriesLogItem },
    setup: () => ({ args }),
    template: `<div class="flex w-96"><SkippedEntriesLogItem v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SkippedEntriesLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { logEntry } };
