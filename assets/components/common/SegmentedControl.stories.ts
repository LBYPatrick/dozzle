import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import SegmentedControl from "./SegmentedControl.vue";

// SegmentedControl is a generic component; typing the render args against
// `typeof SegmentedControl` trips vue-tsc's generic inference, so type loosely.
const meta = {
  title: "Common/SegmentedControl",
  component: SegmentedControl as unknown as Meta["component"],
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const model = ref((args as { options?: { value: unknown }[] }).options?.[0]?.value);
      return { args, model };
    },
    template: `<SegmentedControl v-bind="args" v-model="model" />`,
  }),
} satisfies Meta;

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
