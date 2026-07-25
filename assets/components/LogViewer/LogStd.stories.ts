import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogStd from "./LogStd.vue";

const meta = {
  title: "LogViewer/LogStd",
  component: LogStd,
  argTypes: {
    std: { control: "inline-radio", options: ["stdout", "stderr"] },
  },
} satisfies Meta<typeof LogStd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stdout: Story = { args: { std: "stdout" } };

export const Stderr: Story = { args: { std: "stderr" } };
