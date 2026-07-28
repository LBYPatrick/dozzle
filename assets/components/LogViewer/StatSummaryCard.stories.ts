import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatSummaryCard from "./StatSummaryCard.vue";
import PhCpu from "~icons/ph/cpu";
import PhMemory from "~icons/ph/memory";
import PhNetwork from "~icons/ph/network";
import PhHardDrives from "~icons/ph/hard-drives";

const GB = 1024 ** 3;
const MB = 1024 ** 2;

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
        value: 31.7,
        peak: 82.4,
        total: 100,
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "912.4MB",
        peakLabel: "1.6GB",
        totalLabel: "8.0GB",
        value: 912.4 * MB,
        peak: 1.6 * GB,
        total: 8 * GB,
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
        value: 1.1 * MB,
        peak: 4.2 * MB,
        total: 4.2 * MB,
        tone: "primary",
      },
      {
        icon: PhHardDrives,
        label: "DISK",
        currentLabel: "0.4MB/s",
        peakLabel: "12.0MB/s",
        value: 0.4 * MB,
        peak: 12 * MB,
        total: 12 * MB,
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
        value: 96.8,
        peak: 97.1,
        total: 100,
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "7.6GB",
        peakLabel: "7.8GB",
        totalLabel: "8.0GB",
        value: 7.6 * GB,
        peak: 7.8 * GB,
        total: 8 * GB,
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
        value: 0,
        peak: 0,
        total: 0,
        tone: "primary",
      },
      {
        icon: PhMemory,
        label: "MEM",
        currentLabel: "0B",
        peakLabel: "0B",
        totalLabel: "0B",
        value: 0,
        peak: 0,
        total: 0,
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
  args: { ...(Resources.args as object), unavailable: true } as Story["args"],
};

/** Expanded and unavailable: the trend still draws, flat at zero. */
export const UnavailableExpanded: Story = {
  args: { ...(Resources.args as object), variant: "chart", unavailable: true } as Story["args"],
};
