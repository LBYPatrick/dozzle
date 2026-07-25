import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MetricAlertFields from "./MetricAlertFields.vue";

// The parent AlertForm supplies a live preview validator; stories stub it out.
const validatePreview = async () => ({ data: null });

const meta = {
  title: "Notification/MetricAlertFields",
  component: MetricAlertFields,
  render: (args) => ({
    components: { MetricAlertFields },
    setup: () => ({ args }),
    template: `<div style="width:40rem;max-width:90vw"><MetricAlertFields v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MetricAlertFields>;

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
    prefill: { metricExpression: "cpu > 80 || memory > 90" },
  },
};
