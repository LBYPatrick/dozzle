import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DestinationCard from "./DestinationCard.vue";

const webhook = {
  id: 1,
  name: "Slack #alerts",
  type: "webhook",
  url: "https://hooks.slack.com/services/T000/B000/xxxx",
};
const cloud = { id: 2, name: "Dozzle Cloud", type: "cloud", prefix: "dzc_live_" };
const existingDispatchers = [webhook, cloud];

const meta = {
  title: "Notification/DestinationCard",
  component: DestinationCard,
  render: (args) => ({
    components: { DestinationCard },
    setup: () => ({ args }),
    template: `<div style="width:18rem"><DestinationCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof DestinationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Webhook: Story = {
  args: { destination: webhook as any, existingDispatchers: existingDispatchers as any },
};

export const Cloud: Story = {
  args: { destination: cloud as any, existingDispatchers: existingDispatchers as any },
};
