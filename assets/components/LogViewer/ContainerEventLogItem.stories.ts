import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ContainerEventLogItem from "./ContainerEventLogItem.vue";
import { ContainerEventLogEntry } from "@/models/LogEntry";

const date = new Date("2026-07-24T14:30:00Z");

const started = new ContainerEventLogEntry("Container web-server started", "abc123def456", date, "container-started");
const stopped = new ContainerEventLogEntry("Container web-server stopped", "abc123def456", date, "container-stopped");

const meta = {
  title: "LogViewer/ContainerEventLogItem",
  component: ContainerEventLogItem,
  render: (args) => ({
    components: { ContainerEventLogItem },
    setup: () => ({ args }),
    template: `<ContainerEventLogItem v-bind="args" />`,
  }),
} satisfies Meta<typeof ContainerEventLogItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Started: Story = { args: { logEntry: started } as any };
export const Stopped: Story = { args: { logEntry: stopped } as any };
