import type { Meta, StoryObj } from "@storybook/vue3-vite";
import GroupMenu from "./GroupMenu.vue";

// Custom-group navigation. Reads `customGroups` from the swarm store (empty
// under Storybook, so the list renders empty). No props.
const meta = {
  title: "Components/GroupMenu",
  component: GroupMenu,
  render: (args) => ({
    components: { GroupMenu },
    setup: () => ({ args }),
    template: `<div style="width:320px"><GroupMenu v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof GroupMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
