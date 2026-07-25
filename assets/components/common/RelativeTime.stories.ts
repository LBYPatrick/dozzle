import type { Meta, StoryObj } from "@storybook/vue3-vite";
import RelativeTime from "./RelativeTime.vue";

const meta = {
  title: "Common/RelativeTime",
  component: RelativeTime,
  render: (args) => ({
    components: { RelativeTime },
    setup: () => ({ args }),
    template: `<RelativeTime v-bind="args" />`,
  }),
} satisfies Meta<typeof RelativeTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MinutesAgo: Story = { args: { date: new Date(Date.now() - 5 * 60_000) } };
export const HoursAgo: Story = { args: { date: new Date(Date.now() - 3 * 3_600_000) } };
export const DaysAgo: Story = { args: { date: new Date(Date.now() - 2 * 86_400_000) } };
