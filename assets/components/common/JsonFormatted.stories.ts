import type { Meta, StoryObj } from "@storybook/vue3-vite";
import JsonFormatted from "./JsonFormatted.vue";

const meta = {
  title: "Common/JsonFormatted",
  component: JsonFormatted,
  render: (args) => ({
    components: { JsonFormatted },
    setup: () => ({ args }),
    template: `<JsonFormatted v-bind="args" />`,
  }),
} satisfies Meta<typeof JsonFormatted>;

export default meta;
type Story = StoryObj<typeof meta>;

const value = {
  level: "info",
  message: "container started",
  count: 42,
  healthy: true,
  labels: null,
  tags: ["web", "prod"],
};

export const Block: Story = { args: { value, block: true } };
export const Inline: Story = { args: { value, block: false } };
export const Highlighted: Story = { args: { value, block: true, highlight: "container" } };
export const FromJsonString: Story = { args: { value: JSON.stringify(value), block: true } };
