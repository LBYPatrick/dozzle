import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogViewer from "./LogViewer.vue";
import { LogEntry, SimpleLogEntry, type LogMessage } from "@/models/LogEntry";
import { Container } from "@/models/Container";

// Each entry renders through LogItem, which looks its container up in the store.
const container = new Container(
  "abc123def456",
  new Date(),
  new Date(),
  new Date(0),
  "nginx:latest",
  "web-1",
  "nginx -g 'daemon off;'",
  "localhost",
  {},
  "running",
  0,
  0,
  [],
);

const messages: LogEntry<LogMessage>[] = [
  new SimpleLogEntry(
    "Booting worker with pid 42",
    container.id,
    1,
    new Date("2026-07-24T14:30:40Z"),
    "info",
    "stdout",
    "Booting worker with pid 42",
  ),
  new SimpleLogEntry(
    "Listening at http://0.0.0.0:8000",
    container.id,
    2,
    new Date("2026-07-24T14:30:41Z"),
    "info",
    "stdout",
    "Listening at http://0.0.0.0:8000",
  ),
  new SimpleLogEntry(
    "connection reset by peer",
    container.id,
    3,
    new Date("2026-07-24T14:30:42Z"),
    "warn",
    "stderr",
    "connection reset by peer",
  ),
];

const meta = {
  title: "LogViewer/LogViewer",
  component: LogViewer,
  render: (args) => ({
    components: { LogViewer },
    setup() {
      const store = useContainerStore();
      store.containers = [container];
      return { args };
    },
    template: `<div class="w-[720px] font-mono text-sm"><LogViewer v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { messages, visibleKeys: new Map<string[], boolean>() },
};
