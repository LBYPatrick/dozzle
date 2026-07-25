import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Links from "./Links.vue";

const meta = {
  title: "Components/Links",
  component: Links,
  render: (args) => ({
    components: { Links },
    setup: () => ({ args }),
    template: `<Links v-bind="args" />`,
  }),
} satisfies Meta<typeof Links>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };

export const WithMoreItems: Story = {
  args: {},
  render: (args) => ({
    components: { Links },
    setup: () => ({ args }),
    template: `
      <Links v-bind="args">
        <template #more-items>
          <span class="font-mono text-sm">v9.9.9</span>
        </template>
      </Links>`,
  }),
};
