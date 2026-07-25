import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostGroupLog from "./HostGroupLog.vue";

// Route-level viewer: gathers hosts belonging to a named group and streams their
// containers' logs. With no matching hosts it shows the "not found" hero state.
const meta = {
  title: "HostViewer/HostGroupLog",
  component: HostGroupLog,
  render: (args) => ({
    components: { HostGroupLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><HostGroupLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HostGroupLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "production", scrollable: true } };
