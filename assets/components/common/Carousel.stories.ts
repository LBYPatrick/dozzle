import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Carousel from "./Carousel.vue";
import CarouselItem from "./CarouselItem.vue";

const meta = {
  title: "Common/Carousel",
  component: Carousel,
  render: (args) => ({
    components: { Carousel, CarouselItem },
    setup: () => ({ args }),
    template: `
      <div style="width: 320px; height: 200px">
        <Carousel v-bind="args">
          <CarouselItem id="one" title="First panel">
            <div class="bg-base-200 flex h-40 items-center justify-center rounded-box">First panel</div>
          </CarouselItem>
          <CarouselItem id="two" title="Second panel">
            <div class="bg-base-200 flex h-40 items-center justify-center rounded-box">Second panel</div>
          </CarouselItem>
          <CarouselItem id="three" title="Third panel">
            <div class="bg-base-200 flex h-40 items-center justify-center rounded-box">Third panel</div>
          </CarouselItem>
        </Carousel>
      </div>`,
  }),
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { hideTitle: false } };
export const HiddenTitle: Story = { args: { hideTitle: true } };
