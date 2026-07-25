import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogActions from "./LogActions.vue";
import { SimpleLogEntry } from "@/models/LogEntry";
import { Container } from "@/models/Container";

const container = new Container(
  "abc123def456",
  new Date("2026-07-24T14:00:00Z"),
  new Date("2026-07-24T14:00:05Z"),
  new Date(0),
  "nginx:latest",
  "web-server",
  "nginx -g daemon off;",
  "localhost",
  {},
  "running",
  0,
  0,
  [],
);

const logEntry = new SimpleLogEntry(
  "GET /api/health 200 12ms",
  container.id,
  1,
  new Date("2026-07-24T14:30:00Z"),
  "info",
  "stdout",
  "GET /api/health 200 12ms",
);

// The action dropdown only reveals on row hover in context; here it renders the
// container-scoped menu (copy, permalink, create alert) in isolation.
const meta = {
  title: "LogViewer/LogActions",
  component: LogActions,
  render: (args) => ({
    components: { LogActions },
    setup: () => ({ args }),
    template: `<div class="relative py-8 pl-8"><LogActions v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof LogActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { logEntry, container } as any };
