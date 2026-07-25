import type { Meta, StoryObj } from "@storybook/vue3-vite";
import UpdatesCard from "./UpdatesCard.vue";

const meta = {
  title: "Settings/UpdatesCard",
  component: UpdatesCard,
  render: (args) => ({
    components: { UpdatesCard },
    setup: () => ({ args }),
    template: `<div style="width:30rem;max-width:90vw"><UpdatesCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof UpdatesCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Version comes from the injected `config`; release info is fetched on mount.
export const Default: Story = { args: {} };
