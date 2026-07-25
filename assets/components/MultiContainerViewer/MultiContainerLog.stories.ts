import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MultiContainerLog from "./MultiContainerLog.vue";

// Route-level viewer: merges logs of several containers resolved from the store
// by id. Renders empty without store data / SSE, but compiles and mounts.
const meta = {
  title: "MultiContainerViewer/MultiContainerLog",
  component: MultiContainerLog,
  render: (args) => ({
    components: { MultiContainerLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><MultiContainerLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MultiContainerLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { ids: ["abc123def456", "def456abc123"], scrollable: true } };
