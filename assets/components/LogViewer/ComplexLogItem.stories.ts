import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ComplexLogItem from "./ComplexLogItem.vue";
import { ComplexLogEntry, type JSONObject } from "@/models/LogEntry";

const date = new Date("2026-07-24T14:30:00Z");

function complex(id: number, level: "info" | "warn" | "error", message: JSONObject) {
  return new ComplexLogEntry(message, "abc123def456", id, date, level, "stdout", JSON.stringify(message));
}

const infoEntry = complex(1, "info", {
  level: "info",
  msg: "request completed",
  method: "GET",
  path: "/api/health",
  status: 200,
  duration_ms: 12,
});

const warnEntry = complex(2, "warn", {
  level: "warn",
  msg: "slow query",
  query: "SELECT * FROM logs",
  duration_ms: 1840,
});

const errorEntry = complex(3, "error", {
  level: "error",
  msg: "database connection failed",
  error: "dial tcp 127.0.0.1:5432: connect: connection refused",
  retries: 3,
});

const meta = {
  title: "LogViewer/ComplexLogItem",
  component: ComplexLogItem,
  render: (args) => ({
    components: { ComplexLogItem },
    setup: () => ({ args }),
    template: `<ComplexLogItem v-bind="args" />`,
  }),
} satisfies Meta<typeof ComplexLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { logEntry: infoEntry } as any };
export const Warn: Story = { args: { logEntry: warnEntry } as any };
export const Error: Story = { args: { logEntry: errorEntry } as any };
