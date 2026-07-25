import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MultiContainerActionToolbar from "./MultiContainerActionToolbar.vue";

// Pulls its stream/level state from the logging context via inject, which falls
// back to a sensible default when no provider is present (as in Storybook).
const meta = {
  title: "LogViewer/MultiContainerActionToolbar",
  component: MultiContainerActionToolbar,
  render: (args) => ({
    components: { MultiContainerActionToolbar },
    setup: () => ({ args }),
    // The menu is a hover dropdown; give it vertical room to expand into.
    template: `<div class="flex h-72 w-64 justify-end"><MultiContainerActionToolbar v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof MultiContainerActionToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { name: "web" } };
