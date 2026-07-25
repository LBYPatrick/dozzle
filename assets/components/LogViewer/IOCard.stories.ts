import type { Meta, StoryObj } from "@storybook/vue3-vite";
import IOCard from "./IOCard.vue";

const meta = {
  title: "LogViewer/IOCard",
  component: IOCard,
  render: (args) => ({
    components: { IOCard },
    setup: () => ({ args }),
    template: `<IOCard v-bind="args" />`,
  }),
} satisfies Meta<typeof IOCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    networkRx: 1_250_000,
    networkTx: 320_000,
    diskRead: 4_500_000,
    diskWrite: 890_000,
  },
};

export const Idle: Story = {
  args: { networkRx: 0, networkTx: 0, diskRead: 0, diskWrite: 0 },
};
