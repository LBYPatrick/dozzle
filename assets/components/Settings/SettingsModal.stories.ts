import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SettingsModal from "./SettingsModal.vue";

const meta = {
  title: "Settings/SettingsModal",
  component: SettingsModal,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { SettingsModal },
    setup: () => ({ args }),
    template: `<div style="padding:1rem;display:flex;justify-content:center"><SettingsModal v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof SettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
