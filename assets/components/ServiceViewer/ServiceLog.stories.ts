import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ServiceLog from "./ServiceLog.vue";

// Route-level viewer: looks up a Swarm service by name from the swarm store and
// streams its tasks' logs. Renders empty without store data, but compiles.
const meta = {
  title: "ServiceViewer/ServiceLog",
  component: ServiceLog,
  render: (args) => ({
    components: { ServiceLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><ServiceLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ServiceLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "web", scrollable: true } };
