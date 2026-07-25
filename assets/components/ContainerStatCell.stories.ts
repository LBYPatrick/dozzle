import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerStatCell from "./ContainerStatCell.vue";
import { Container } from "@/models/Container";
import type { Stat } from "@/models/Container";
import type { ContainerState } from "@/types/Container";
import type { Host } from "@/stores/hosts";

function stats(n: number): Stat[] {
  return Array.from({ length: n }, (_, i) => ({
    cpu: 120 + 180 * Math.abs(Math.sin(i / 6)),
    memory: 35 + 25 * Math.abs(Math.cos(i / 9)),
    memoryUsage: (450 + 220 * Math.abs(Math.cos(i / 9))) * 1024 * 1024,
    networkRxTotal: i * 2048,
    networkTxTotal: i * 1024,
    diskReadTotal: i * 512,
    diskWriteTotal: i * 256,
  }));
}

function container(id: string, name: string, state: ContainerState = "running"): Container {
  return new Container(
    id,
    new Date("2026-07-20T09:00:00Z"),
    new Date("2026-07-20T09:00:03Z"),
    new Date(0),
    "nginx:1.27",
    name,
    "nginx -g 'daemon off;'",
    "localhost",
    {},
    state,
    0,
    2_000_000_000,
    stats(200),
  );
}

const host: Host = {
  id: "localhost",
  name: "localhost",
  nCPU: 8,
  memTotal: 16_000_000_000,
  type: "local",
  endpoint: "",
  available: true,
  dockerVersion: "24.0.7",
  agentVersion: "",
};

const meta = {
  title: "Components/ContainerStatCell",
  component: ContainerStatCell,
  render: (args) => ({
    components: { ContainerStatCell },
    setup: () => ({ args }),
    template: `<div style="width:220px"><ContainerStatCell v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ContainerStatCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CpuChart: Story = {
  args: { container: container("a1", "web-frontend"), type: "cpu", host, mode: "chart" },
};

export const CpuProgress: Story = {
  args: { container: container("a1", "web-frontend"), type: "cpu", host, mode: "progress" },
};

export const MemoryChart: Story = {
  args: { container: container("b2", "api-server"), type: "mem", host, mode: "chart" },
};

export const MemoryProgress: Story = {
  args: { container: container("b2", "api-server"), type: "mem", host, mode: "progress" },
};
