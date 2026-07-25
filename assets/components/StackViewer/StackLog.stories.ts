import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StackLog from "./StackLog.vue";

// Route-level viewer: looks up a compose/stack by name from the swarm store and
// streams its containers' logs. Renders empty without store data, but compiles.
const meta = {
  title: "StackViewer/StackLog",
  component: StackLog,
  render: (args) => ({
    components: { StackLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><StackLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof StackLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "my-stack", scrollable: true } };
