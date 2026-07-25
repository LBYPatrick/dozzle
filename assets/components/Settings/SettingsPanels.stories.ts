import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SettingsPanels from "./SettingsPanels.vue";

const meta = {
  title: "Settings/SettingsPanels",
  component: SettingsPanels,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { SettingsPanels },
    setup: () => ({ args }),
    template: `<div style="width:52rem;max-width:100vw;padding:1rem"><SettingsPanels v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SettingsPanels>;

export default meta;
type Story = StoryObj<typeof meta>;

// Reads/writes the user settings store; renders the full visual settings form.
export const Default: Story = { args: {} };
