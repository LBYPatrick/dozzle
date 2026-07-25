import type { Meta, StoryObj } from "@storybook/vue3-vite";
import AlertCard from "./AlertCard.vue";

const webhookDispatcher = { id: 1, name: "Slack #alerts", type: "webhook" };
const cloudDispatcher = { id: 2, name: "Dozzle Cloud", type: "cloud", prefix: "dzc_live_" };

const baseAlert = {
  id: 1,
  name: "High error rate",
  enabled: true,
  containerExpression: 'name == "api"',
  logExpression: 'level == "error"',
  cooldown: 300,
  sampleWindow: 15,
  triggerCount: 12,
  triggeredContainers: 3,
  lastTriggeredAt: "2026-07-20T10:30:00Z",
  dispatcher: webhookDispatcher,
};

const meta = {
  title: "Notification/AlertCard",
  component: AlertCard,
  render: (args) => ({
    components: { AlertCard },
    setup: () => ({ args }),
    template: `<div style="width:38rem;max-width:90vw"><AlertCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof AlertCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LogAlert: Story = {
  args: { alert: { ...baseAlert } as any },
};

export const MetricAlert: Story = {
  args: {
    alert: {
      ...baseAlert,
      id: 2,
      name: "CPU saturation",
      metricExpression: "cpu > 80",
      dispatcher: cloudDispatcher,
    } as any,
  },
};

export const EventAlert: Story = {
  args: {
    alert: {
      ...baseAlert,
      id: 3,
      name: "Container died",
      logExpression: "",
      eventExpression: 'name == "die"',
      cooldown: 10,
    } as any,
  },
};

export const Disabled: Story = {
  args: { alert: { ...baseAlert, id: 4, name: "Paused alert", enabled: false } as any },
};

export const MissingDispatcher: Story = {
  args: { alert: { ...baseAlert, id: 5, dispatcher: null } as any },
};
