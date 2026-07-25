import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Container } from "@/models/Container";
import VolumeWarning from "./VolumeWarning.vue";

// mountStats with a nearly full volume so the warning badge renders.
const container = Container.fromJSON({
  id: "abc123def456",
  created: "2026-07-24T10:00:00Z",
  startedAt: "2026-07-24T10:00:00Z",
  finishedAt: "0001-01-01T00:00:00Z",
  image: "postgres:16",
  name: "db",
  command: "postgres",
  status: "Up 2 hours",
  state: "running",
  host: "localhost",
  cpuLimit: 4,
  memoryLimit: 0,
  labels: {},
  stats: [],
  mountStats: {
    "/var/lib/postgresql/data": {
      destination: "/var/lib/postgresql/data",
      total: 100_000_000_000,
      free: 5_000_000_000,
      used: 95_000_000_000,
      available: true,
      lastChecked: "2026-07-24T10:00:00Z",
    },
  },
});

const meta = {
  title: "ContainerViewer/VolumeWarning",
  component: VolumeWarning,
  render: (args) => ({
    components: { VolumeWarning },
    setup: () => ({ args }),
    template: `<VolumeWarning v-bind="args" />`,
  }),
} satisfies Meta<typeof VolumeWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { container } };
