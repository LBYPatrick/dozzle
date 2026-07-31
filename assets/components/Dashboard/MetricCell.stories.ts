import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MetricCell from "./MetricCell.vue";

const meta = {
  title: "Dashboard/MetricCell",
  component: MetricCell,
  render: (args) => ({
    components: { MetricCell },
    setup: () => ({ args }),
    // Wrapped in the tinted grid the cell is designed to sit in — on its own it
    // is deliberately borderless and would look unfinished.
    template: `
      <div class="grid gap-px overflow-hidden rounded-lg" style="width:240px; background-color: color-mix(in oklab, currentColor 10%, transparent)">
        <MetricCell v-bind="args">
          <div class="bg-primary/25 h-8 w-full"></div>
        </MetricCell>
      </div>`,
  }),
} satisfies Meta<typeof MetricCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cpu: Story = {
  args: { label: "CPU", value: "37.4%", sub: "18 CPU · Max 62.1%" },
};

// The unit rides the figure's baseline, so the pair has to read as one fact.
export const WithScale: Story = {
  args: { label: "Memory", value: "6.1 GB", unit: "/ 32 GB", sub: "19.1%" },
};

export const FigureOnly: Story = {
  args: { label: "Containers", value: "18" },
};
