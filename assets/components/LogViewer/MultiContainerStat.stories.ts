import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MultiContainerStat from "./MultiContainerStat.vue";
import { Container, type Stat } from "@/models/Container";

const makeStats = (base: number): Stat[] =>
  Array.from({ length: 120 }, (_, i) => ({
    cpu: base + Math.sin(i / 6) * 20,
    memory: 30 + Math.cos(i / 9) * 10,
    memoryUsage: (400 + Math.cos(i / 9) * 90) * 1024 * 1024,
    networkRxTotal: i * 1500,
    networkTxTotal: i * 1100,
    diskReadTotal: i * 700,
    diskWriteTotal: i * 500,
  }));

const makeContainer = (id: string, name: string, base: number) =>
  new Container(
    id,
    new Date(),
    new Date(),
    new Date(0),
    "nginx:latest",
    name,
    "nginx -g 'daemon off;'",
    "localhost",
    {},
    "running",
    0,
    0,
    makeStats(base),
  );

const containers = [makeContainer("abc123", "web-1", 30), makeContainer("def456", "worker-1", 55)];

const meta = {
  title: "LogViewer/MultiContainerStat",
  component: MultiContainerStat,
  render: (args) => ({
    components: { MultiContainerStat },
    setup: () => ({ args }),
    template: `<div class="w-[720px]"><MultiContainerStat v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MultiContainerStat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoContainers: Story = { args: { containers } };

export const SingleContainer: Story = {
  args: { containers: [makeContainer("abc123", "web-1", 40)] },
};
