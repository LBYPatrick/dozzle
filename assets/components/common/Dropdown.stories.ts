import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Dropdown from "./Dropdown.vue";

const meta = {
  title: "Common/Dropdown",
  component: Dropdown,
  render: (args) => ({
    components: { Dropdown },
    setup: () => ({ args }),
    template: `
      <Dropdown v-bind="args">
        <template #trigger>
          <mdi:dots-vertical />
        </template>
        <template #content>
          <ul class="menu">
            <li><a>First action</a></li>
            <li><a>Second action</a></li>
            <li><a>Third action</a></li>
          </ul>
        </template>
      </Dropdown>`,
  }),
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
