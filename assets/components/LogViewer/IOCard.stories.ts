import type { Meta, StoryObj } from "@storybook/vue3-vite";
import IOCard from "./IOCard.vue";

// A plausible rate series so the chart mode has something to describe: a mostly
// quiet stream with a couple of bursts.
const series = Array.from({ length: 120 }, (_, i) => {
  const burst = i % 37 < 3 ? 6 : 1;
  const value = Math.round((300_000 + Math.sin(i / 6) * 180_000) * burst);
  return { percent: value, value };
});

const diskSeries = series.map(({ value }) => ({ percent: value * 3, value: value * 3 }));

const shared = {
  networkRx: 1_250_000,
  networkTx: 320_000,
  diskRead: 4_500_000,
  diskWrite: 890_000,
  networkSeries: series,
  diskSeries,
};

const meta = {
  title: "LogViewer/IOCard",
  component: IOCard,
  render: (args) => ({
    components: { IOCard },
    setup: () => ({ args }),
    template: `<IOCard v-bind="args" />`,
  }),
} satisfies Meta<typeof IOCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The live per-second rate, split by direction. */
export const Current: Story = { args: { ...shared, mode: "current" } };

/** Trend sparklines. The compact max/average form lives in StatSummaryCard. */
export const Chart: Story = { args: { ...shared, mode: "chart" } };

export const Idle: Story = {
  args: { ...shared, mode: "current", networkRx: 0, networkTx: 0, diskRead: 0, diskWrite: 0 },
};
