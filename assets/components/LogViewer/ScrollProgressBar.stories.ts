import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ScrollProgressBar from "./ScrollProgressBar.vue";

const meta = {
  title: "LogViewer/ScrollProgressBar",
  component: ScrollProgressBar,
  argTypes: {
    progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
  },
  render: (args) => ({
    components: { ScrollProgressBar },
    setup: () => ({ args }),
    template: `<div class="w-80"><ScrollProgressBar v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ScrollProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { progress: 0 } };

export const Half: Story = { args: { progress: 0.5 } };

export const Full: Story = { args: { progress: 1 } };
