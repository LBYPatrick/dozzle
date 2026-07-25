import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogList from "./LogList.vue";
import {
  ComplexLogEntry,
  GroupedLogEntry,
  SimpleLogEntry,
  type JSONObject,
  type LogMessage,
  type LogEntry,
} from "@/models/LogEntry";

const containerId = "abc123def456";
const base = new Date("2026-07-24T14:30:00Z");
const at = (offsetSeconds: number) => new Date(base.getTime() + offsetSeconds * 1000);

const jsonMessage: JSONObject = { level: "warn", msg: "slow response", path: "/api/orders", duration_ms: 1840 };

const messages: LogEntry<LogMessage>[] = [
  new SimpleLogEntry("Server started on :8080", containerId, 1, at(0), "info", "stdout", "Server started on :8080"),
  new SimpleLogEntry("GET /api/health 200 12ms", containerId, 2, at(1), "info", "stdout", "GET /api/health 200 12ms"),
  new ComplexLogEntry(jsonMessage, containerId, 3, at(2), "warn", "stdout", JSON.stringify(jsonMessage)),
  new GroupedLogEntry(
    ["panic: runtime error", "goroutine 1 [running]:", "main.main()", "\t/app/main.go:20 +0x1d"],
    containerId,
    4,
    at(3),
    "error",
    "stderr",
  ),
];

// LogList renders a stream of heterogeneous entries via each entry's
// getComponent(). Concrete rows read the container/host stores, so with an
// unseeded store this is a best-effort layout preview.
const meta = {
  title: "LogViewer/LogList",
  component: LogList,
  render: (args) => ({
    components: { LogList },
    setup: () => ({ args }),
    template: `<LogList v-bind="args" />`,
  }),
} satisfies Meta<typeof LogList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { messages } as any };
export const Empty: Story = { args: { messages: [] } as any };
