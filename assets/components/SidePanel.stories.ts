import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SidePanel from "./SidePanel.vue";

const meta = {
  title: "Components/SidePanel",
  component: SidePanel,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { SidePanel },
    setup: () => ({ args }),
    // SidePanel is a fixed, full-height sidebar; give it a sized column so the
    // inherited width has something to resolve against.
    template: `<div class="relative h-screen w-64"><SidePanel v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
