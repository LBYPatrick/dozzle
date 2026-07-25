import type { Meta, StoryObj } from "@storybook/vue3-vite";
import CarouselItem from "./CarouselItem.vue";

const meta = {
  title: "Common/CarouselItem",
  component: CarouselItem,
  render: (args) => ({
    components: { CarouselItem },
    setup: () => ({ args }),
    template: `
      <CarouselItem v-bind="args">
        <div class="bg-base-200 flex h-40 items-center justify-center rounded-box">Panel content</div>
      </CarouselItem>`,
  }),
} satisfies Meta<typeof CarouselItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { id: "panel-1", title: "Panel one" } };
