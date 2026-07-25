import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostLog from "./HostLog.vue";

// Route-level viewer: resolves a host by id (the seeded config has "localhost")
// and streams logs for its running containers.
const meta = {
  title: "HostViewer/HostLog",
  component: HostLog,
  render: (args) => ({
    components: { HostLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><HostLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HostLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { id: "localhost", scrollable: true } };
