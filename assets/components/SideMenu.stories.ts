import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SideMenu from "./SideMenu.vue";

const meta = {
  title: "Components/SideMenu",
  component: SideMenu,
  render: (args) => ({
    components: { SideMenu },
    setup: () => ({ args }),
    template: `<div class="w-64"><SideMenu v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SideMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { hideTitle: false } };

export const HideTitle: Story = { args: { hideTitle: true } };
