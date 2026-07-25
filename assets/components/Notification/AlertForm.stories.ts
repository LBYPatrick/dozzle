import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AlertForm from "./AlertForm.vue";

const meta = {
  title: "Notification/AlertForm",
  component: AlertForm,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { AlertForm },
    setup: () => ({ args }),
    template: `<div style="width:44rem;max-width:100vw"><AlertForm v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof AlertForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = { args: {} };

export const Prefilled: Story = {
  args: {
    prefill: {
      name: "Error watcher",
      containerExpression: 'name == "api"',
      logExpression: 'level == "error"',
    },
  },
};

export const EditExisting: Story = {
  args: {
    alert: {
      id: 1,
      name: "High error rate",
      enabled: true,
      containerExpression: 'name == "api"',
      logExpression: 'level == "error"',
      cooldown: 300,
      sampleWindow: 15,
      triggerCount: 4,
      triggeredContainers: 1,
      lastTriggeredAt: "2026-07-20T10:30:00Z",
      dispatcher: { id: 1, name: "Slack #alerts", type: "webhook" },
    } as any,
  },
};
