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

// Toolbar height, next to the buttons it has to line up with. The whole point
// of `dense` is that these three come out the same size.
export const Dense: Story = {
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const model = ref("all");
      return { args, model };
    },
    template: `
      <div class="flex items-center gap-2">
        <button class="btn btn-square btn-ghost btn-sm">A</button>
        <SegmentedControl v-bind="args" v-model="model" />
        <button class="btn btn-sm">Button</button>
      </div>`,
  }),
  args: {
    dense: true,
    options: [
      { label: "All Hosts", value: "all" },
      { label: "localhost", value: "local" },
      { label: "remote", value: "remote" },
    ],
  },
};

// Icon segments draw their own content, so each option's `title` is the only
// name it has — for the tooltip and for the accessibility tree alike.
export const Icons: Story = {
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const model = ref("chart");
      return { args, model };
    },
    template: `
      <SegmentedControl v-bind="args" v-model="model">
        <template #option="{ option }">
          <mdi:chart-bar v-if="option.value === 'chart'" class="size-4" />
          <mdi:poll v-else class="size-4 scale-x-[-1] rotate-90" />
        </template>
      </SegmentedControl>`,
  }),
  args: {
    dense: true,
    options: [
      { label: "History", title: "History", value: "chart" },
      { label: "Level", title: "Level", value: "progress" },
    ],
  },
};
