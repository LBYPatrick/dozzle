import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import SlideTransition from "./SlideTransition.vue";

const meta = {
  title: "Common/SlideTransition",
  component: SlideTransition,
  render: (args) => ({
    components: { SlideTransition },
    setup() {
      const slideRight = ref(args.slideRight);
      return { args, slideRight };
    },
    template: `
      <div class="space-y-4">
        <button class="btn btn-sm" @click="slideRight = !slideRight">Toggle</button>
        <SlideTransition :slide-right="slideRight">
          <template #left>
            <div class="bg-base-200 rounded-box p-6">Left view</div>
          </template>
          <template #right>
            <div class="bg-base-200 rounded-box p-6">Right view</div>
          </template>
        </SlideTransition>
      </div>`,
  }),
} satisfies Meta<typeof SlideTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Left: Story = { args: { slideRight: false } };
export const Right: Story = { args: { slideRight: true } };
