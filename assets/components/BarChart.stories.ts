import type { Meta, StoryObj } from "@storybook/vue3-vite";
import BarChart from "./BarChart.vue";

// BarDataPoint is { percent: number; value: number }. Build structurally so we
// don't have to import a type out of the SFC.
function makeBars(n: number, base = 40, amp = 30): { percent: number; value: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const v = Math.max(0, base + amp * Math.sin(i / 5));
    return { percent: v, value: v };
  });
}

const meta = {
  title: "Components/BarChart",
  component: BarChart,
  render: (args) => ({
    components: { BarChart },
    setup: () => ({ args }),
    // Give the chart a concrete box; it sizes its bars from the container width.
    template: `<div style="width:320px;height:48px"><BarChart v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { chartData: makeBars(120), barClass: "bg-primary" },
};

export const Sparse: Story = {
  args: { chartData: makeBars(24, 20, 55), barClass: "bg-secondary" },
};

export const Empty: Story = {
  args: { chartData: [] },
};
