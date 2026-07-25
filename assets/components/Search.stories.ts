import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Search from "./Search.vue";

const meta = {
  title: "Components/Search",
  component: Search,
  render: (args) => ({
    components: { Search },
    setup: () => ({ args }),
    template: `<Search v-bind="args" />`,
  }),
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
