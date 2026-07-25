import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CloudDestinationForm from "./CloudDestinationForm.vue";

const meta = {
  title: "Notification/CloudDestinationForm",
  component: CloudDestinationForm,
  render: (args) => ({
    components: { CloudDestinationForm },
    setup: () => ({ args }),
    template: `<div style="width:32rem;max-width:90vw"><CloudDestinationForm v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof CloudDestinationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// No destination -> shows the "link Dozzle Cloud" call to action.
export const Unlinked: Story = { args: {} };

// Editing a linked cloud destination -> shows the API key + status panel.
export const Linked: Story = {
  args: {
    destination: {
      id: 2,
      name: "Dozzle Cloud",
      type: "cloud",
      prefix: "dzc_live_",
    } as any,
  },
};
