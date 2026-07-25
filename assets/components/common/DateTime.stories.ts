import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DateTime from "./DateTime.vue";

const meta = {
  title: "Common/DateTime",
  component: DateTime,
} satisfies Meta<typeof DateTime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { date: new Date("2026-07-24T14:30:45Z") },
};
