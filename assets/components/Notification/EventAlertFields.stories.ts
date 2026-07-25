import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EventAlertFields from "./EventAlertFields.vue";

// The parent AlertForm supplies a live preview validator; stories stub it out.
const validatePreview = async () => ({ data: null });

const meta = {
  title: "Notification/EventAlertFields",
  component: EventAlertFields,
  render: (args) => ({
    components: { EventAlertFields },
    setup: () => ({ args }),
    template: `<div style="width:40rem;max-width:90vw"><EventAlertFields v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof EventAlertFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    containerExpression: 'name == "api"',
    isLoading: false,
    validatePreview,
  },
};

export const Prefilled: Story = {
  args: {
    containerExpression: 'name == "api"',
    isLoading: false,
    validatePreview,
    prefill: { eventExpression: 'name == "die"' },
  },
};
