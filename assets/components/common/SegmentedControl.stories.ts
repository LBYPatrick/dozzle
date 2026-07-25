import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import SegmentedControl from "./SegmentedControl.vue";

const meta = {
  title: "Common/SegmentedControl",
  component: SegmentedControl,
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const model = ref((args.options?.[0]?.value as string) ?? "");
      return { args, model };
    },
    template: `<SegmentedControl v-bind="args" v-model="model" />`,
  }),
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoOptions: Story = {
  args: {
    options: [
      { label: "Visual", value: "visual" },
      { label: "JSON", value: "json" },
    ],
  },
};

export const ThreeOptions: Story = {
  args: {
    options: [
      { label: "Small", value: "small" },
      { label: "Medium", value: "medium" },
      { label: "Large", value: "large" },
    ],
  },
};
