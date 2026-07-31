import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ShowAllContainersToggle from "./ShowAllContainersToggle.vue";

const meta = {
  title: "Common/ShowAllContainersToggle",
  component: ShowAllContainersToggle,
  render: () => ({
    components: { ShowAllContainersToggle },
    template: `<ShowAllContainersToggle />`,
  }),
} satisfies Meta<typeof ShowAllContainersToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Reads the shared setting, so clicking flips the eye, toasts, and would move
// the sidebar and dashboard together in the real app.
export const Default: Story = {};
