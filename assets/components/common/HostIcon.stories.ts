import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostIcon from "./HostIcon.vue";

const meta = {
  title: "Common/HostIcon",
  component: HostIcon,
  argTypes: {
    type: { control: "inline-radio", options: ["local", "remote", "agent", "swarm", "k8s"] },
  },
  render: (args) => ({
    components: { HostIcon },
    setup: () => ({ args }),
    template: `<HostIcon v-bind="args" class="size-6" />`,
  }),
} satisfies Meta<typeof HostIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Local: Story = { args: { type: "local" } };
export const Remote: Story = { args: { type: "remote" } };
export const Agent: Story = { args: { type: "agent" } };
export const Swarm: Story = { args: { type: "swarm" } };
export const Kubernetes: Story = { args: { type: "k8s" } };
