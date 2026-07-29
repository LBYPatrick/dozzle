import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatSummaryCard from "./StatSummaryCard.vue";
import PhCpu from "~icons/ph/cpu";
import PhMemory from "~icons/ph/memory";
import PhNetwork from "~icons/ph/network";
import PhHardDrives from "~icons/ph/hard-drives";

const meta = {
  title: "LogViewer/StatSummaryCard",
  component: StatSummaryCard,
  render: (args) => ({
    components: { StatSummaryCard },
    setup: () => ({ args }),
    template: `<div class="flex h-16 w-96 items-stretch"><StatSummaryCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof StatSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** CPU and memory: running well below the peak, with headroom to spare. */
export const Resources: Story = {
  args: {
    rows: [
      {
        icon: PhCpu,
        label: "CPU",
        currentLabel: "31.7%",
        peakLabel: "82.4%",
        totalLabel: "8 CPU",
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "912.4MB",
        peakLabel: "1.6GB",
        totalLabel: "8.0GB",
        tone: "secondary",
      },
    ],
  },
};

/** Network and disk: no ceiling to report, so the meter runs against the peak. */
export const Throughput: Story = {
  args: {
    rows: [
      {
        icon: PhNetwork,
        label: "NET",
        currentLabel: "1.1MB/s",
        peakLabel: "4.2MB/s",
        tone: "primary",
      },
      {
        icon: PhHardDrives,
        label: "DISK",
        currentLabel: "0.4MB/s",
        peakLabel: "12.0MB/s",
        tone: "secondary",
      },
    ],
  },
};

/** Pressed against the limit: the meter fills and the peak tick disappears. */
export const NearCapacity: Story = {
  args: {
    rows: [
      {
        icon: PhCpu,
        label: "CPU",
        currentLabel: "96.8%",
        peakLabel: "97.1%",
        totalLabel: "4 CPU",
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "7.6GB",
        peakLabel: "7.8GB",
        totalLabel: "8.0GB",
        tone: "secondary",
      },
    ],
  },
};

/** Nothing running yet: empty meters rather than a divide-by-zero full bar. */
export const Idle: Story = {
  args: {
    rows: [
      {
        icon: PhCpu,
        label: "CPU",
        currentLabel: "0.0%",
        peakLabel: "0.0%",
        totalLabel: "0 CPU",
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "0B",
        peakLabel: "0B",
        totalLabel: "0B",
        tone: "secondary",
      },
    ],
  },
};

/** Expanded: the metrics sit side by side so each trend gets the full height. */
export const Expanded: Story = {
  args: { ...(Resources.args as object), variant: "chart" } as Story["args"],
};

/** Nothing running: N/A instead of a column of zeros. */
export const Unavailable: Story = {
  args: {
    // What production passes for a stopped container: the measurements read
    // N/A, the ceilings still report — they are a property of the host.
    rows: Resources.args.rows.map((row) => ({ ...row, currentLabel: "N/A", peakLabel: "N/A" })),
    unavailable: true,
  },
};

/** Expanded and unavailable: the trend still draws, flat at zero. */
export const UnavailableExpanded: Story = {
  args: { ...Unavailable.args, variant: "chart" },
};
