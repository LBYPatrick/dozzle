import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CircuitRing from "./CircuitRing.vue";

const meta = {
  title: "Common/CircuitRing",
  component: CircuitRing,
  render: (args) => ({
    components: { CircuitRing },
    setup: () => ({ args }),
    // CircuitRing draws on the edge of its `relative` parent, so give it a sized box.
    template: `
      <div class="bg-base-200 relative flex h-12 w-40 items-center justify-center rounded-full">
        <span class="text-xs">host</span>
        <CircuitRing v-bind="args" />
      </div>`,
  }),
} satisfies Meta<typeof CircuitRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = { args: { progress: 0.65, track: true, strokeWidth: 1.5 } };
export const Full: Story = { args: { progress: 1, strokeWidth: 2 } };
export const Indeterminate: Story = { args: { indeterminate: true, track: true, strokeWidth: 2 } };
