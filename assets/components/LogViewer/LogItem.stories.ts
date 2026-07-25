import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogItem from "./LogItem.vue";
import { SimpleLogEntry } from "@/models/LogEntry";

// LogItem is the row wrapper (actions gutter, std/host/name tags, timestamp)
// used by every concrete log-item component. It reads the container/host stores
// via the entry's containerID, so with an unseeded store this is a best-effort
// layout preview.
const entry = new SimpleLogEntry(
  "GET /api/health 200 12ms",
  "abc123def456",
  1,
  new Date("2026-07-24T14:30:00Z"),
  "info",
  "stdout",
  "GET /api/health 200 12ms",
);

const meta = {
  title: "LogViewer/LogItem",
  component: LogItem,
  render: (args) => ({
    components: { LogItem },
    setup: () => ({ args }),
    template: `<LogItem v-bind="args"><span>Log message body rendered inside the default slot</span></LogItem>`,
  }),
} satisfies Meta<typeof LogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { logEntry: entry } as any };
