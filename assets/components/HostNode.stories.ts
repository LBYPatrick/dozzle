import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostNode from "./HostNode.vue";
import type { Host } from "@/stores/hosts";

// HostNode reads the container store for the host's containers. Under
// Storybook that store is empty, so what these stories exercise is the host
// row itself: icon, name, count-free header, availability and the merge action.
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
  title: "Components/HostNode",
  component: HostNode,
  render: (args) => ({
    components: { HostNode },
    setup: () => ({ args }),
    template: `<ul class="menu sidebar-menu" style="width:18rem"><HostNode v-bind="args" /></ul>`,
  }),
} satisfies Meta<typeof HostNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Local: Story = { args: { host: base } };

export const Agent: Story = {
  args: { host: { ...base, id: "agent-1", name: "prod-node-1", type: "agent", agentVersion: "v8.0.0" } },
};

export const Remote: Story = {
  args: { host: { ...base, id: "remote-1", name: "eu-west-1", type: "remote" } },
};

export const Offline: Story = {
  args: { host: { ...base, id: "down-1", name: "staging-node", type: "agent", available: false } },
};
