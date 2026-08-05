import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ToastItem from "./ToastItem.vue";

const meta = {
  title: "Common/ToastItem",
  component: ToastItem,
  render: (args) => ({
    components: { ToastItem },
    setup: () => ({ args }),
    template: `<ToastItem v-bind="args" @dismiss="() => {}" />`,
  }),
} satisfies Meta<typeof ToastItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    toast: { id: "1", title: "Heads up", message: "A new version is available.", type: "info" },
  },
};

export const Warning: Story = {
  args: {
    toast: { id: "2", title: "Careful", message: "This host is unreachable.", type: "warning" },
    expire: 6000,
  },
};

export const Error: Story = {
  args: {
    toast: { id: "3", title: "Failed", message: "Could not start the container.", type: "error" },
  },
};

export const WithTimedAction: Story = {
  args: {
    toast: {
      id: "4",
      message: "Container stopped.",
      type: "info",
      action: { label: "Undo", handler: () => {} },
    },
    timed: 5000,
  },
};

// The reset toast: the deed is done and this takes it back, so the action is a
// plain button beside the close rather than a countdown.
export const WithUndoAction: Story = {
  args: {
    toast: {
      id: "5",
      message: "Settings reset to defaults",
      type: "info",
      action: { label: "Undo", handler: () => {} },
    },
    expire: 8000,
  },
};
