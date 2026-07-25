import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatCard from "./StatCard.vue";
import PhCpu from "~icons/ph/cpu";

const meta = {
  title: "LogViewer/StatCard",
  component: StatCard,
  render: (args) => ({
    components: { StatCard },
    setup: () => ({ args }),
    template: `
      <StatCard v-bind="args" class="w-64">
        <template #value="{ hoveredValue }">
          <span class="tabular-nums">
            <span class="font-semibold">{{ (hoveredValue ?? 42.5).toFixed(1) }}%</span>
            <span class="text-base-content/60"> / 8 CPU</span>
          </span>
        </template>
        <template #chart="{ onHoverValue }">
          <div
            class="bg-primary/40 hover:bg-primary/70 h-5 w-full rounded"
            @mousemove="onHoverValue(61.2)"
          ></div>
        </template>
      </StatCard>
    `,
  }),
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: PhCpu,
    cardClass: "bg-primary/10",
    iconClass: "text-primary",
    title: "CPU usage: 42.5% of 8 cores",
  },
};
