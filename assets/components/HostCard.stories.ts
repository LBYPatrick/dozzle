import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostCard from "./HostCard.vue";
import type { Host } from "@/stores/hosts";

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
  title: "Components/HostCard",
  component: HostCard,
  render: (args) => ({
    components: { HostCard },
    setup: () => ({ args }),
    template: `<div style="width:480px"><HostCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Local: Story = {
  args: { host: base },
};

export const Agent: Story = {
  args: {
    host: {
      ...base,
      id: "agent-1",
      name: "prod-node-1",
      type: "agent",
      endpoint: "agent-1:7007",
      agentVersion: "v8.0.0",
    },
  },
};

export const Offline: Story = {
  args: {
    host: { ...base, id: "agent-2", name: "prod-node-2", type: "agent", available: false, agentVersion: "v8.0.0" },
  },
};
