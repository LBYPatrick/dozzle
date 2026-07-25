import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { BarDataPoint } from "@/components/BarChart.vue";
import IconMemory from "~icons/mdi/memory";
import IconCpu from "~icons/mdi/cpu-64-bit";
import MetricCard from "./MetricCard.vue";

// A gently-varying series so the mini bar chart, average, and peak all read as
// realistic values.
function series(base: number, spread: number): BarDataPoint[] {
  return Array.from({ length: 60 }, (_, i) => {
    const value = Math.max(0, base + Math.sin(i / 4) * spread + (i % 7) * (spread / 10));
    return { value, percent: value };
  });
}

const meta = {
  title: "Components/MetricCard",
  component: MetricCard,
  render: (args) => ({
    components: { MetricCard },
    setup: () => ({ args }),
    template: `<div class="w-64"><MetricCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Memory: Story = {
  args: {
    label: "Memory",
    icon: IconMemory,
    value: "512 MB",
    chartData: series(45, 12),
    containerClass: "bg-base-200",
    textClass: "text-secondary",
    barClass: "bg-secondary",
  },
};

export const Cpu: Story = {
  args: {
    label: "CPU",
    icon: IconCpu,
    value: 37.5,
    chartData: series(30, 20),
    containerClass: "bg-base-200",
    textClass: "text-primary",
    barClass: "bg-primary",
    formatValue: (v: number) => `${v.toFixed(1)}%`,
  },
};
