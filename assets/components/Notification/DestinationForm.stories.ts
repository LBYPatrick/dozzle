import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DestinationForm from "./DestinationForm.vue";

const meta = {
  title: "Notification/DestinationForm",
  component: DestinationForm,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { DestinationForm },
    setup: () => ({ args }),
    template: `<div style="width:40rem;max-width:100vw"><DestinationForm v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof DestinationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create mode -> shows the webhook/cloud type picker.
export const Create: Story = { args: {} };

// Edit mode -> jumps straight to the webhook form.
export const EditWebhook: Story = {
  args: {
    destination: {
      id: 1,
      name: "Slack #alerts",
      type: "webhook",
      url: "https://hooks.slack.com/services/T000/B000/xxxx",
    } as any,
  },
};
