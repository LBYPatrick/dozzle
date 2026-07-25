import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogLevel from "./LogLevel.vue";

const meta = {
  title: "LogViewer/LogLevel",
  component: LogLevel,
  argTypes: {
    level: {
      control: "select",
      options: ["info", "warn", "error", "debug", "trace", "fatal", "unknown"],
    },
    position: { control: "inline-radio", options: [undefined, "start", "middle", "end"] },
    showUnknown: { control: "boolean" },
  },
  render: (args) => ({
    components: { LogLevel },
    setup: () => ({ args }),
    template: `<LogLevel v-bind="args" />`,
  }),
} satisfies Meta<typeof LogLevel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { level: "info" } };
export const Warn: Story = { args: { level: "warn" } };
export const Error: Story = { args: { level: "error" } };
export const Debug: Story = { args: { level: "debug" } };
export const UnknownShown: Story = { args: { level: "unknown", showUnknown: true } };
export const GroupStart: Story = { args: { level: "error", position: "start" } };
export const GroupMiddle: Story = { args: { level: "error", position: "middle" } };
export const GroupEnd: Story = { args: { level: "error", position: "end" } };
