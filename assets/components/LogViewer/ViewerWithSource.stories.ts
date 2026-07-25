import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { DefineComponent } from "vue";
import ViewerWithSourceComponent from "./ViewerWithSource.vue";

// ViewerWithSource is a generic SFC, so `typeof` it is a generic function type
// that Storybook's Meta/StoryObj generics can't resolve. Cast to a concrete
// component type for the story. It is streaming-heavy: it opens an
// EventSource-backed log stream from the injected source, so this is a
// best-effort compiling story with stubbed props (live data needs a backend).
const ViewerWithSource = ViewerWithSourceComponent as unknown as DefineComponent<{
  streamSource: unknown;
  visibleKeys: Map<string[], boolean>;
  entity: unknown;
}>;

const meta = {
  title: "LogViewer/ViewerWithSource",
  component: ViewerWithSource,
  render: (args) => ({
    components: { ViewerWithSource },
    setup: () => ({ args }),
    template: `<div class="w-[720px]"><ViewerWithSource v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof ViewerWithSource>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    streamSource: (() => ({})) as any,
    visibleKeys: new Map<string[], boolean>(),
    entity: {} as any,
  },
};
