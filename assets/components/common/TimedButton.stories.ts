import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TimedButton from "./TimedButton.vue";

const meta = {
  title: "Common/TimedButton",
  component: TimedButton,
  render: (args) => ({
    components: { TimedButton },
    setup: () => ({ args }),
    template: `
      <TimedButton v-bind="args" @finished="() => {}" @cancelled="() => {}">
        Undo
      </TimedButton>`,
  }),
} satisfies Meta<typeof TimedButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { duration: 4000 } };
export const Slow: Story = { args: { duration: 10000 } };
