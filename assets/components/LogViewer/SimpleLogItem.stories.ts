import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SimpleLogItem from "./SimpleLogItem.vue";
import { SimpleLogEntry } from "@/models/LogEntry";
import { Container } from "@/models/Container";

// LogItem (rendered by SimpleLogItem) resolves the container from the store by
// id, so seed a matching one. Its host ("localhost") comes from the config the
// Storybook preview seeds.
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

const infoEntry = new SimpleLogEntry(
  "Server started, listening on port 8080",
  container.id,
  1,
  new Date("2026-07-24T14:30:45Z"),
  "info",
  "stdout",
  "Server started, listening on port 8080",
);

const errorEntry = new SimpleLogEntry(
  "connection refused: could not reach database at db:5432",
  container.id,
  2,
  new Date("2026-07-24T14:31:02Z"),
  "error",
  "stderr",
  "connection refused: could not reach database at db:5432",
);

const meta = {
  title: "LogViewer/SimpleLogItem",
  component: SimpleLogItem,
  render: (args) => ({
    components: { SimpleLogItem },
    setup() {
      const store = useContainerStore();
      store.containers = [container];
      return { args };
    },
    template: `<div class="group w-full font-mono text-sm leading-relaxed"><SimpleLogItem v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SimpleLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { logEntry: infoEntry } };

export const Error: Story = { args: { logEntry: errorEntry } };
