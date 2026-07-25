import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LogAlertFields from "./LogAlertFields.vue";

// The parent AlertForm supplies a live preview validator; stories stub it out.
const validatePreview = async () => ({ data: null });

const meta = {
  title: "Notification/LogAlertFields",
  component: LogAlertFields,
  render: (args) => ({
    components: { LogAlertFields },
    setup: () => ({ args }),
    template: `<div style="width:40rem;max-width:90vw"><LogAlertFields v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof LogAlertFields>;

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
    prefill: { logExpression: 'level == "error" && message contains "timeout"' },
  },
};
