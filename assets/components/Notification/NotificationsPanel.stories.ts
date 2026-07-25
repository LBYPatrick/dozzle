import type { Meta, StoryObj } from "@storybook/vue3-vite";
import NotificationsPanel from "./NotificationsPanel.vue";

const meta = {
  title: "Notification/NotificationsPanel",
  component: NotificationsPanel,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { NotificationsPanel },
    setup: () => ({ args }),
    template: `<div style="width:48rem;max-width:100vw;padding:1rem"><NotificationsPanel v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof NotificationsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Data is loaded from the backend on mount; without a backend the panel renders
// its empty state and the "add destination" / "add alert" affordances.
export const Default: Story = { args: {} };

export const WithHighlight: Story = { args: { highlightId: 1 } };
