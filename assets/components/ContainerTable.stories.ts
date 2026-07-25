import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerTable from "./ContainerTable.vue";
import { Container } from "@/models/Container";
import type { Stat } from "@/models/Container";
import type { ContainerState } from "@/types/Container";

function stats(n: number, load = 1): Stat[] {
  return Array.from({ length: n }, (_, i) => ({
    cpu: load * (120 + 180 * Math.abs(Math.sin(i / 6))),
    memory: 35 + 25 * Math.abs(Math.cos(i / 9)),
    memoryUsage: (450 + 220 * Math.abs(Math.cos(i / 9))) * 1024 * 1024,
    networkRxTotal: i * 2048,
    networkTxTotal: i * 1024,
    diskReadTotal: i * 512,
    diskWriteTotal: i * 256,
  }));
}

function container(id: string, name: string, state: ContainerState, load = 1, finishedAt = new Date(0)): Container {
  return new Container(
    id,
    new Date(Date.parse("2026-07-20T09:00:00Z") + id.charCodeAt(0) * 1_000_000),
    new Date("2026-07-20T09:00:03Z"),
    finishedAt,
    "nginx:1.27",
    name,
    "nginx -g 'daemon off;'",
    "localhost",
    {},
    state,
    0,
    2_000_000_000,
    stats(200, load),
  );
}

const containers = [
  container("a", "web-frontend", "running", 0.4),
  container("b", "api-server", "running", 1.6),
  container("c", "postgres", "running", 0.9),
  container("d", "redis-cache", "paused", 0.2),
  container("e", "old-worker", "exited", 0, new Date("2026-07-22T18:30:00Z")),
];

const meta = {
  title: "Components/ContainerTable",
  component: ContainerTable,
  render: (args) => ({
    components: { ContainerTable },
    setup: () => ({ args }),
    template: `<div style="width:760px"><ContainerTable v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { containers },
};

export const Empty: Story = {
  args: { containers: [] },
};
