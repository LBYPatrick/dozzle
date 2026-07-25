import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogDetails from "./LogDetails.vue";
import { ComplexLogEntry, type JSONObject } from "@/models/LogEntry";

const message: JSONObject = {
  level: "error",
  msg: "database connection failed",
  error: "dial tcp 127.0.0.1:5432: connect: connection refused",
  retries: 3,
  request: { id: "req-42", path: "/api/orders", method: "POST" },
};

const entry = new ComplexLogEntry(
  message,
  "abc123def456",
  1,
  new Date("2026-07-24T14:30:00Z"),
  "error",
  "stderr",
  JSON.stringify(message),
);

// LogDetails is the drawer body: level/timestamp header, meta grid, raw JSON and
// a sortable per-field visibility table. It resolves the container from the
// store by containerID, so with an unseeded store this is a best-effort preview.
const meta = {
  title: "LogViewer/LogDetails",
  component: LogDetails,
  render: (args) => ({
    components: { LogDetails },
    setup: () => ({ args }),
    template: `<div class="min-w-[40rem]"><LogDetails v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof LogDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { entry } as any };
