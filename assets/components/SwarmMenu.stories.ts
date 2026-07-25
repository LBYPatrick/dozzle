import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SwarmMenu from "./SwarmMenu.vue";

const meta = {
  title: "Components/SwarmMenu",
  component: SwarmMenu,
  render: (args) => ({
    components: { SwarmMenu },
    setup: () => ({ args }),
    template: `<div class="w-64"><SwarmMenu v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SwarmMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Reads stacks/services from the swarm store, which is empty in isolation, so
// this renders the header with the collapse-all menu and no stacks.
export const Default: Story = { args: {} };
