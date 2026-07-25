import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DropdownMenu from "./DropdownMenu.vue";

// DropdownMenu is a generic component; typing the render args against `typeof
// DropdownMenu` trips vue-tsc's generic inference, so type the meta loosely.
const meta = {
  title: "Common/DropdownMenu",
  component: DropdownMenu as unknown as Meta["component"],
  render: (args) => ({
    components: { DropdownMenu },
    setup() {
      const model = ref((args as { options?: { value: unknown }[] }).options?.[0]?.value);
      return { args, model };
    },
    template: `<DropdownMenu v-bind="args" v-model="model" />`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: [
      { label: "Newest first", value: "newest" },
      { label: "Oldest first", value: "oldest" },
      { label: "By name", value: "name" },
    ],
  },
};

export const WithDefaultLabel: Story = {
  args: {
    defaultLabel: "Choose sort",
    options: [
      { label: "Newest first", value: "newest" },
      { label: "Oldest first", value: "oldest" },
    ],
  },
};
