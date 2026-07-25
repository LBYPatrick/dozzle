import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Container } from "@/models/Container";
import Terminal from "./Terminal.vue";

// Terminal only reads id/name/host/created off the container to open its xterm
// session and websocket, so a minimal running container is enough for the story.
const container = new Container(
  "abc123def456",
  new Date("2026-07-24T14:30:45Z"),
  new Date("2026-07-24T14:30:46Z"),
  new Date(0),
  "nginx:latest",
  "web",
  "nginx -g 'daemon off;'",
  "localhost",
  {},
  "running",
  0,
  0,
  [],
);

const meta = {
  title: "Components/Terminal",
  component: Terminal,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { Terminal },
    setup: () => ({ args }),
    template: `<div class="h-96 p-4"><Terminal v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof Terminal>;

export default meta;
type Story = StoryObj<typeof meta>;

// The websocket target does not exist under Storybook, so the shell will show a
// connection-closed notice. The chrome (header + xterm surface) still renders.
export const Attach: Story = {
  args: { container: container as any, action: "attach" },
};

export const Exec: Story = {
  args: { container: container as any, action: "exec" },
};
