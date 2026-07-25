import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MobileMenu from "./MobileMenu.vue";

const meta = {
  title: "Common/MobileMenu",
  component: MobileMenu,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { MobileMenu },
    setup: () => ({ args }),
    // MobileMenu is a fixed top nav; give the story some height to render into.
    template: `<div style="height: 320px"><MobileMenu v-bind="args" @search="() => {}" /></div>`,
  }),
} satisfies Meta<typeof MobileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
