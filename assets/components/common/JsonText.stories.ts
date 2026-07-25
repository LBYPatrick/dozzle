import type { Meta, StoryObj } from "@storybook/vue3-vite";
import JsonText from "./JsonText.vue";

const meta = {
  title: "Common/JsonText",
  component: JsonText,
  render: (args) => ({
    components: { JsonText },
    setup: () => ({ args }),
    template: `<span class="font-mono"><JsonText v-bind="args" /></span>`,
  }),
} satisfies Meta<typeof JsonText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = { args: { text: "container web-1 started successfully" } };
export const Highlighted: Story = { args: { text: "container web-1 started successfully", highlight: "web" } };
