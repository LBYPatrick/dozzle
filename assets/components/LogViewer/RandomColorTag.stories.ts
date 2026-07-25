import type { Meta, StoryObj } from "@storybook/vue3-vite";
import RandomColorTag from "./RandomColorTag.vue";

const meta = {
  title: "LogViewer/RandomColorTag",
  component: RandomColorTag,
  render: (args) => ({
    components: { RandomColorTag },
    setup: () => ({ args }),
    template: `<RandomColorTag v-bind="args" class="w-40" />`,
  }),
} satisfies Meta<typeof RandomColorTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: "web-1" } };

export const AnotherName: Story = { args: { value: "postgres-primary" } };

export const TruncateRight: Story = {
  args: { value: "a-very-long-container-name-that-overflows", truncateRight: true },
};
