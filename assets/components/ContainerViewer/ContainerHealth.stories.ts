import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerHealth from "./ContainerHealth.vue";

const meta = {
  title: "ContainerViewer/ContainerHealth",
  component: ContainerHealth,
  render: (args) => ({
    components: { ContainerHealth },
    setup: () => ({ args }),
    template: `<ContainerHealth v-bind="args" />`,
  }),
} satisfies Meta<typeof ContainerHealth>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = { args: { health: "healthy" } };
export const Unhealthy: Story = { args: { health: "unhealthy" } };
export const Starting: Story = { args: { health: "starting" } };
