import type { Meta, StoryObj } from "@storybook/vue3-vite";
import JsonValue from "./JsonValue.vue";

const meta = {
  title: "Common/JsonValue",
  component: JsonValue,
  render: (args) => ({
    components: { JsonValue },
    setup: () => ({ args }),
    template: `<span class="font-mono whitespace-pre-wrap break-all"><JsonValue v-bind="args" /></span>`,
  }),
} satisfies Meta<typeof JsonValue>;

export default meta;
type Story = StoryObj<typeof meta>;

const value = {
  level: "warn",
  message: "disk almost full",
  usage: 0.92,
  paths: ["/var/log", "/tmp"],
  meta: { host: "localhost", retries: 3, ok: false, extra: null },
};

export const Pretty: Story = { args: { value, indent: 0 } };
export const Inline: Story = { args: { value, indent: -1 } };
export const Highlighted: Story = { args: { value, indent: 0, highlight: "disk" } };
