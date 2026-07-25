import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerLog from "./ContainerLog.vue";

// Route-level viewer: resolves its Container from the store by id and streams
// logs. With no store data / SSE backend in Storybook it renders empty, but the
// component compiles and mounts with a best-effort id.
const meta = {
  title: "ContainerViewer/ContainerLog",
  component: ContainerLog,
  render: (args) => ({
    components: { ContainerLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><ContainerLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { id: "abc123def456", showTitle: true, scrollable: true } };
