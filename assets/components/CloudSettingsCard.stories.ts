import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CloudSettingsCard from "./CloudSettingsCard.vue";

// Dozzle Cloud link/status card. Reads the cloud config composable; unlinked
// under Storybook, so it renders the "not linked" call-to-action. No props.
const meta = {
  title: "Components/CloudSettingsCard",
  component: CloudSettingsCard,
  render: (args) => ({
    components: { CloudSettingsCard },
    setup: () => ({ args }),
    template: `<div style="width:480px"><CloudSettingsCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof CloudSettingsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
