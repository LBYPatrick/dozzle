import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SearchStatus from "./SearchStatus.vue";

const scannedTo = new Date("2026-07-24T10:15:00Z").toISOString();

const meta = {
  title: "LogViewer/SearchStatus",
  component: SearchStatus,
  render: (args) => ({
    components: { SearchStatus },
    setup: () => ({ args }),
    template: `<div class="w-72"><SearchStatus v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SearchStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

// Renders the in-progress hint after a short delay (slow searches only).
export const Searching: Story = {
  args: { status: { active: true, done: false, matches: 3, scannedTo } },
};

export const Empty: Story = {
  args: { status: { active: false, done: true, matches: 0 } },
};

export const Capped: Story = {
  args: { status: { active: false, done: true, matches: 100, reason: "capped", scannedTo } },
};

export const Exhausted: Story = {
  args: { status: { active: false, done: true, matches: 42, reason: "exhausted" } },
};
