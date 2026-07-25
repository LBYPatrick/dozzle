import type { Meta, StoryObj } from "@storybook/vue3-vite";
import HostList from "./HostList.vue";

// Renders one card per host from the store (seeded with `localhost` by the
// preview config). No props.
const meta = {
  title: "Components/HostList",
  component: HostList,
  render: (args) => ({
    components: { HostList },
    setup: () => ({ args }),
    template: `<div style="width:760px"><HostList v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof HostList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
