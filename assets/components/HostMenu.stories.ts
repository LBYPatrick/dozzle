import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostMenu from "./HostMenu.vue";

// Sidebar host/container navigation. Reads the hosts + container stores
// (empty container store under Storybook, so it renders the host list only).
// No props.
const meta = {
  title: "Components/HostMenu",
  component: HostMenu,
  render: (args) => ({
    components: { HostMenu },
    setup: () => ({ args }),
    template: `<div style="width:320px"><HostMenu v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HostMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
