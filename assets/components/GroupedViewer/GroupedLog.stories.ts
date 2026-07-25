import type { Meta, StoryObj } from "@storybook/vue3-vite";
import GroupedLog from "./GroupedLog.vue";

// Route-level viewer: looks up a custom group by name from the swarm store and
// streams merged logs. Renders empty without store data, but compiles/mounts.
const meta = {
  title: "GroupedViewer/GroupedLog",
  component: GroupedLog,
  render: (args) => ({
    components: { GroupedLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><GroupedLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof GroupedLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "web", scrollable: true } };
