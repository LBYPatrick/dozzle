import type { Meta, StoryObj } from "@storybook/vue3-vite";
import IndeterminateBar from "./IndeterminateBar.vue";

const meta = {
  title: "Common/IndeterminateBar",
  component: IndeterminateBar,
  argTypes: {
    color: { control: "inline-radio", options: ["primary", "error", "secondary"] },
  },
  render: (args) => ({
    components: { IndeterminateBar },
    setup: () => ({ args }),
    template: `
      <div class="w-64 overflow-hidden">
        <IndeterminateBar v-bind="args" />
      </div>`,
  }),
} satisfies Meta<typeof IndeterminateBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { color: "primary" } };
export const Error: Story = { args: { color: "error" } };
export const Secondary: Story = { args: { color: "secondary" } };
