import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StateRibbon from "./StateRibbon.vue";

const meta = {
  title: "Dashboard/StateRibbon",
  component: StateRibbon,
  render: (args) => ({
    components: { StateRibbon },
    setup: () => ({ args }),
    template: `<div style="width:240px"><StateRibbon v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof StateRibbon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  args: {
    segments: [
      { key: "running", label: "running", count: 42, class: "bg-success" },
      { key: "paused", label: "paused", count: 2, class: "bg-warning" },
      { key: "restarting", label: "restarting", count: 1, class: "bg-info" },
      { key: "stopped", label: "stopped", count: 9, class: "bg-base-content/25" },
    ],
  },
};

export const AllRunning: Story = {
  args: { segments: [{ key: "running", label: "running", count: 42, class: "bg-success" }] },
};

// Nothing to draw: the track stays, so the cell it sits in keeps its height.
export const Empty: Story = {
  args: { segments: [{ key: "running", label: "running", count: 0, class: "bg-success" }] },
};
