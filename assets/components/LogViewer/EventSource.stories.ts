import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import EventSource from "./EventSource.vue";
import { Container } from "@/models/Container";

const container = new Container(
  "abc123def456",
  new Date("2026-07-24T14:00:00Z"),
  new Date("2026-07-24T14:00:05Z"),
  new Date(0),
  "nginx:latest",
  "web-server",
  "nginx -g daemon off;",
  "localhost",
  {},
  "running",
  0,
  0,
  [],
);

// EventSource owns the live SSE connection and loading/empty/error states. In a
// story there is no backend, so a fake stream source is injected to exercise the
// component's slot/skeleton rendering without a network connection.
const fakeStreamSource = () => ({
  messages: ref([]),
  opened: ref(true),
  loading: ref(false),
  error: ref(false),
  searchStatus: ref({ active: false, done: false, matches: 0 }),
});

// EventSource.vue is a generic component (`<script setup generic="T">`), which
// TS can't feed to `Meta<typeof EventSource>`, so type the args explicitly and
// erase the generic component's type here.
type EventSourceArgs = { streamSource: unknown; entity: unknown };

const meta = {
  title: "LogViewer/EventSource",
  component: EventSource as any,
  render: (args) => ({
    components: { EventSource },
    setup: () => ({ args }),
    template: `<EventSource v-bind="args"><template #default="{ messages }"><div>{{ messages.length }} messages streamed</div></template></EventSource>`,
  }),
} satisfies Meta<EventSourceArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { streamSource: fakeStreamSource, entity: container } as any };
