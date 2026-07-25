import type { Meta, StoryObj } from "@storybook/vue3-vite";
import TopBarStatWidget from "./TopBarStatWidget.vue";
import { Container, type Stat } from "@/models/Container";

const stats: Stat[] = Array.from({ length: 60 }, (_, i) => ({
  cpu: 25 + Math.sin(i / 5) * 18,
  memory: 32 + Math.cos(i / 7) * 8,
  memoryUsage: (340 + Math.cos(i / 7) * 60) * 1024 * 1024,
  networkRxTotal: i * 1200,
  networkTxTotal: i * 900,
  diskReadTotal: i * 600,
  diskWriteTotal: i * 450,
}));

const makeContainer = (id: string, name: string) =>
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
    stats,
  );

const containers = [makeContainer("abc123", "web-1"), makeContainer("def456", "web-2")];

const meta = {
  title: "LogViewer/TopBarStatWidget",
  component: TopBarStatWidget,
  render: (args) => ({
    components: { TopBarStatWidget },
    setup: () => ({ args }),
    // The widget is fixed-positioned; give it room so it is visible in the frame.
    template: `<div class="relative h-40 w-96"><TopBarStatWidget v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof TopBarStatWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { containers } };

export const Loading: Story = { args: { containers, loading: true } };

export const Scrolled: Story = { args: { containers, paused: true, progress: 0.4 } };
