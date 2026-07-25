import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogAnalytics from "./LogAnalytics.vue";
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

// LogAnalytics is an async-setup component: it fetches the container's logs and
// loads DuckDB-WASM to run SQL. With no backend the download fails and it shows
// its error state; this Default is a best-effort compiling preview.
const meta = {
  title: "LogViewer/LogAnalytics",
  component: LogAnalytics,
  render: (args) => ({
    components: { LogAnalytics },
    setup: () => ({ args }),
    template: `<div class="min-w-[40rem]"><LogAnalytics v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof LogAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { container } as any };
