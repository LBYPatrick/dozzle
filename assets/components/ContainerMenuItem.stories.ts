import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerMenuItem from "./ContainerMenuItem.vue";
import { Container } from "@/models/Container";
import type { Stat } from "@/models/Container";
import type { ContainerHealth, ContainerState } from "@/types/Container";

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

function container(
  id: string,
  name: string,
  state: ContainerState = "running",
  health?: ContainerHealth,
  finishedAt = new Date(0),
): Container {
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
    undefined,
    health,
  );
}

const meta = {
  title: "Components/ContainerMenuItem",
  component: ContainerMenuItem,
  render: (args) => ({
    components: { ContainerMenuItem },
    setup: () => ({ args }),
    template: `<ul class="menu sidebar-menu" style="width:18rem"><ContainerMenuItem v-bind="args" /></ul>`,
  }),
} satisfies Meta<typeof ContainerMenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = { args: { container: container("a1", "web-frontend") } };

export const Healthy: Story = { args: { container: container("b2", "api-server", "running", "healthy") } };

export const Unhealthy: Story = { args: { container: container("c3", "payments", "running", "unhealthy") } };

export const Paused: Story = { args: { container: container("d4", "redis-cache", "paused") } };

export const Exited: Story = {
  args: { container: container("e5", "old-worker", "exited", undefined, new Date("2026-07-22T18:30:00Z")) },
};

/** A long name truncates rather than pushing the row's trailing controls out. */
export const LongName: Story = {
  args: { container: container("f6", "storefront-checkout-service-canary-eu-west-1") },
};
