import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogSource from "./LogSource.vue";

// Sized as the log row sizes it: a fixed cell, so timestamps stay flush down
// the column. The old pair of filled tags reserved w-30 + w-40 each.
const meta = {
  title: "LogViewer/LogSource",
  component: LogSource,
  render: (args) => ({
    components: { LogSource },
    setup: () => ({ args }),
    template: `<LogSource v-bind="args" class="w-44" style="--log-line: 1.45em" />`,
  }),
} satisfies Meta<typeof LogSource>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HostAndContainer: Story = {
  args: { host: "docker-desktop", containerName: "api-gateway", colorKey: "abc123" },
};

/** A single-host view shows only the container. */
export const ContainerOnly: Story = {
  args: { containerName: "api-gateway", colorKey: "abc123" },
};

/** Host gives way first: it is the shared prefix, while the container name is
    what tells two rows apart. */
export const LongNames: Story = {
  args: {
    host: "swarm-worker-eu-central-1c-0042",
    containerName: "storefront_checkout-worker.3",
    colorKey: "def456",
  },
};
