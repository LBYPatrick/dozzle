import type { Meta, StoryObj } from "@storybook/vue3-vite";
import GroupedLogItem from "./GroupedLogItem.vue";
import { GroupedLogEntry } from "@/models/LogEntry";

const date = new Date("2026-07-24T14:30:00Z");

const stackTrace = new GroupedLogEntry(
  [
    "Traceback (most recent call last):",
    '  File "app.py", line 42, in <module>',
    "    main()",
    '  File "app.py", line 30, in main',
    "    raise ValueError('boom')",
    "ValueError: boom",
  ],
  "abc123def456",
  1,
  date,
  "error",
  "stderr",
);

const infoGroup = new GroupedLogEntry(
  ["Starting service", "Loaded 3 modules", "Ready to accept connections"],
  "abc123def456",
  2,
  date,
  "info",
  "stdout",
);

const meta = {
  title: "LogViewer/GroupedLogItem",
  component: GroupedLogItem,
  render: (args) => ({
    components: { GroupedLogItem },
    setup: () => ({ args }),
    template: `<GroupedLogItem v-bind="args" />`,
  }),
} satisfies Meta<typeof GroupedLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StackTrace: Story = { args: { logEntry: stackTrace } as any };
export const Info: Story = { args: { logEntry: infoGroup } as any };
