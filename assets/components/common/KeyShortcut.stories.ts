import type { Meta, StoryObj } from "@storybook/vue3-vite";
import KeyShortcut from "./KeyShortcut.vue";

const meta = {
  title: "Common/KeyShortcut",
  component: KeyShortcut,
  render: (args) => ({
    components: { KeyShortcut },
    setup: () => ({ args }),
    template: `<KeyShortcut v-bind="args" />`,
  }),
} satisfies Meta<typeof KeyShortcut>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Meta_: Story = { args: { char: "k", modifiers: ["meta"] } };
export const MetaShift: Story = { args: { char: "f", modifiers: ["meta", "shift"] } };
export const Control: Story = { args: { char: "c", modifiers: ["^"] } };
export const NoModifier: Story = { args: { char: "/", modifiers: [] } };
