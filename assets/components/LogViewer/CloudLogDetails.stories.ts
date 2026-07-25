import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CloudLogDetails from "./CloudLogDetails.vue";
import type { CloudLogHit } from "@/composable/cloudLogSearch";

const hit: CloudLogHit = {
  ts: new Date("2026-07-24T14:30:00Z").getTime() * 1e6, // unix nanoseconds
  hostId: "localhost",
  containerId: "abc123def456789",
  containerName: "web-server",
  message: JSON.stringify({ level: "error", msg: "request failed", status: 500, path: "/api/orders" }, null, 0),
  stream: "stdout",
  level: "error",
  logId: 123456789,
};

const plainHit: CloudLogHit = {
  ...hit,
  containerId: "def456abc123000",
  containerName: "worker",
  message: "worker finished processing batch 42 in 1.2s",
  level: "info",
  logId: undefined,
};

// Cloud-search drawer body. Resolves host/live-container from the stores, so with
// an unseeded store it renders in the "container removed" (not live) state.
const meta = {
  title: "LogViewer/CloudLogDetails",
  component: CloudLogDetails,
  render: (args) => ({
    components: { CloudLogDetails },
    setup: () => ({ args }),
    template: `<div class="min-w-[40rem]"><CloudLogDetails v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof CloudLogDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JsonMessage: Story = { args: { hit } as any };
export const PlainMessage: Story = { args: { hit: plainHit } as any };
