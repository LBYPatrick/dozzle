import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SideDrawer from "./SideDrawer.vue";

const meta = {
  title: "Common/SideDrawer",
  component: SideDrawer,
  argTypes: {
    width: { control: "inline-radio", options: ["md", "lg", "xl"] },
  },
  render: (args) => ({
    components: { SideDrawer },
    setup: () => ({ args }),
    // SideDrawer is a <dialog> opened via its exposed open() method.
    template: `
      <div>
        <button class="btn btn-primary" @click="$refs.drawer.open()">Open drawer</button>
        <SideDrawer ref="drawer" v-bind="args">
          <template #default="{ close }">
            <div class="space-y-4 p-4">
              <h2 class="text-lg font-semibold">Drawer content</h2>
              <p>Anything can go inside the side drawer.</p>
              <button class="btn" @click="close()">Close</button>
            </div>
          </template>
        </SideDrawer>
      </div>`,
  }),
} satisfies Meta<typeof SideDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = { args: { width: "md" } };
export const Large: Story = { args: { width: "lg" } };
