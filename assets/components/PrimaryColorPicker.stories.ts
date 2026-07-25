import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PrimaryColorPicker from "./PrimaryColorPicker.vue";

const meta = {
  title: "Components/PrimaryColorPicker",
  component: PrimaryColorPicker,
  render: (args) => ({
    components: { PrimaryColorPicker },
    setup: () => ({ args }),
    template: `<PrimaryColorPicker v-bind="args" />`,
  }),
} satisfies Meta<typeof PrimaryColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
