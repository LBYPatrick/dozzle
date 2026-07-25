import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Container } from "@/models/Container";
import ContainerActionsToolbar from "./ContainerActionsToolbar.vue";

const container = Container.fromJSON({
  id: "abc123def456",
  created: "2026-07-24T10:00:00Z",
  startedAt: "2026-07-24T10:00:00Z",
  finishedAt: "0001-01-01T00:00:00Z",
  image: "nginx:latest",
  name: "nginx",
  command: "nginx -g 'daemon off;'",
  status: "Up 2 hours",
  state: "running",
  host: "localhost",
  cpuLimit: 4,
  memoryLimit: 0,
  labels: {},
  stats: [],
});

const meta = {
  title: "ContainerViewer/ContainerActionsToolbar",
  component: ContainerActionsToolbar,
  render: (args) => ({
    components: { ContainerActionsToolbar },
    setup: () => ({ args }),
    template: `<div style="min-height:16rem"><ContainerActionsToolbar v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerActionsToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { container } };
export const Historical: Story = { args: { container, historical: true } };
