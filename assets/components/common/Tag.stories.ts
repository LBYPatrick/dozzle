import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Tag from "./Tag.vue";

const meta = {
  title: "Common/Tag",
  component: Tag,
  argTypes: {
    size: { control: "inline-radio", options: [undefined, "small"] },
  },
  render: (args) => ({
    components: { Tag },
    setup: () => ({ args }),
    template: `<Tag v-bind="args">v1.2.3</Tag>`,
  }),
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "small" } };
