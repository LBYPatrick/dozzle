import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ZigZag from "./ZigZag.vue";

const meta = {
  title: "LogViewer/ZigZag",
  component: ZigZag,
  render: () => ({
    components: { ZigZag },
    template: `<div class="w-72"><ZigZag /></div>`,
  }),
} satisfies Meta<typeof ZigZag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
