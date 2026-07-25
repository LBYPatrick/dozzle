import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerPopup from "./ContainerPopup.vue";
import { Container } from "@/models/Container";
import type { Stat } from "@/models/Container";
import type { ContainerState } from "@/types/Container";

function stats(n: number): Stat[] {
  return Array.from({ length: n }, (_, i) => ({
    cpu: 25 + 35 * Math.abs(Math.sin(i / 6)),
    memory: 35 + 25 * Math.abs(Math.cos(i / 9)),
    memoryUsage: (450 + 220 * Math.abs(Math.cos(i / 9))) * 1024 * 1024,
    networkRxTotal: i * 2048,
    networkTxTotal: i * 1024,
    diskReadTotal: i * 512,
    diskWriteTotal: i * 256,
  }));
}

function container(id: string, name: string, state: ContainerState = "running", finishedAt = new Date(0)): Container {
  return new Container(
    id,
    new Date("2026-07-20T09:00:00Z"),
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
    stats(120),
  );
}

const meta = {
  title: "Components/ContainerPopup",
  component: ContainerPopup,
  render: (args) => ({
    components: { ContainerPopup },
    setup: () => ({ args }),
    template: `<div style="width:240px"><ContainerPopup v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {
  args: { container: container("a1", "web-frontend", "running") },
};

export const Exited: Story = {
  args: { container: container("d4", "old-worker", "exited", new Date("2026-07-22T18:30:00Z")) },
};
