import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Container } from "@/models/Container";
import ContainerTitle from "./ContainerTitle.vue";

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
  health: "healthy",
});

const meta = {
  title: "ContainerViewer/ContainerTitle",
  component: ContainerTitle,
  render: (args) => ({
    components: { ContainerTitle },
    setup: () => ({ args }),
    template: `<div style="width:32rem"><ContainerTitle v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { container } };
