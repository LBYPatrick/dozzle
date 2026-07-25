import type { Meta, StoryObj } from "@storybook/vue3-vite";
import WebhookDestinationForm from "./WebhookDestinationForm.vue";

const meta = {
  title: "Notification/WebhookDestinationForm",
  component: WebhookDestinationForm,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { WebhookDestinationForm },
    setup: () => ({ args }),
    template: `<div style="width:40rem;max-width:100vw;padding:1rem"><WebhookDestinationForm v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof WebhookDestinationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create mode -> shows the payload-format presets (Slack/Discord/ntfy/custom).
export const Create: Story = { args: { isEditing: false } };

// Edit mode -> presets hidden, fields prefilled from the destination.
export const Edit: Story = {
  args: {
    isEditing: true,
    destination: {
      id: 1,
      name: "Slack #alerts",
      type: "webhook",
      url: "https://hooks.slack.com/services/T000/B000/xxxx",
      template: '{ "text": "{{ .Message }}" }',
      headers: { "X-Source": "dozzle" },
    } as any,
  },
};
