import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { Host } from "@/stores/hosts";
import HostTile from "./HostTile.vue";

const base: Host = {
  id: "localhost",
  name: "localhost",
  nCPU: 8,
  memTotal: 16_000_000_000,
  type: "local",
  endpoint: "",
  available: true,
  dockerVersion: "24.0.7",
  agentVersion: "",
};

const meta = {
  title: "Dashboard/HostTile",
  component: HostTile,
  render: (args) => ({
    components: { HostTile },
    setup: () => ({ args }),
    template: `<ul style="width:320px"><HostTile v-bind="args" /></ul>`,
  }),
} satisfies Meta<typeof HostTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Online: Story = {
  args: { host: base },
};

// Unreachable: the meters are dropped rather than drawn at zero, which would
// report the machine as idle when it is only unseen.
export const Offline: Story = {
  args: { host: { ...base, id: "prod-1", name: "prod-node-1", type: "agent", available: false } },
};

// A long name has to give way to the count and the chevron, not push them off.
export const LongName: Story = {
  args: { host: { ...base, id: "long", name: "swarm-worker-eu-central-1c-0042", type: "swarm" } },
};
