import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CloudSearchInline from "./CloudSearchInline.vue";

// Topbar search button that opens the fuzzy search palette. Reads the cloud
// config composable (unlinked under Storybook, so it shows the plain hero
// copy). No props.
const meta = {
  title: "Components/CloudSearchInline",
  component: CloudSearchInline,
  render: (args) => ({
    components: { CloudSearchInline },
    setup: () => ({ args }),
    template: `<div style="width:360px"><CloudSearchInline v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof CloudSearchInline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
