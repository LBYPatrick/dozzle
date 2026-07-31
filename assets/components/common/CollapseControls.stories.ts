import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CollapseControls from "./CollapseControls.vue";

const meta = {
  title: "Common/CollapseControls",
  component: CollapseControls,
  render: (args) => ({
    components: { CollapseControls },
    setup: () => ({ args }),
    template: `<CollapseControls v-bind="args" />`,
  }),
} satisfies Meta<typeof CollapseControls>;

export default meta;
type Story = StoryObj<typeof meta>;

// Nothing is collapsed yet, so only "collapse all" is live. Clicking it flips
// which of the two is available — the pair is its own state readout.
export const Mixed: Story = {
  args: { keys: ["host:one", "host:two", "host:three"] },
};

// Nothing collapsible on screen: both ends are already true, so both dim.
export const NothingToCollapse: Story = {
  args: { keys: [] },
};
