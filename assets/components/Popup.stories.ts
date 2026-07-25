import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Popup from "./Popup.vue";

const meta = {
  title: "Components/Popup",
  component: Popup,
  render: (args) => ({
    components: { Popup },
    setup: () => ({ args }),
    // The default slot is the trigger; the popup positions itself next to the
    // element that follows it and reveals #content on hover.
    template: `
      <div>
        <Popup v-bind="args">
          <button class="btn btn-primary btn-sm">Hover me</button>
          <template #content>
            <div class="text-sm">Extra details shown on hover.</div>
          </template>
        </Popup>
      </div>`,
  }),
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
