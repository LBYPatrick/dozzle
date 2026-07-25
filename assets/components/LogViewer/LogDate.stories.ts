import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogDate from "./LogDate.vue";

const meta = {
  title: "LogViewer/LogDate",
  component: LogDate,
  render: (args) => ({
    components: { LogDate },
    setup: () => ({ args }),
    template: `<LogDate v-bind="args" />`,
  }),
} satisfies Meta<typeof LogDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { date: new Date("2026-07-24T14:30:45Z") } };
