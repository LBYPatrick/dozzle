import type { Meta, StoryObj } from "@storybook/vue3-vite";
import WhatsNewPanel from "./WhatsNewPanel.vue";

const meta = {
  title: "Settings/WhatsNewPanel",
  component: WhatsNewPanel,
  render: (args) => ({
    components: { WhatsNewPanel },
    setup: () => ({ args }),
    template: `<div style="width:34rem;max-width:90vw"><WhatsNewPanel v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof WhatsNewPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Releases are fetched from the announcements store on mount; without data the
// panel shows its empty "no releases" state.
export const Default: Story = { args: {} };
