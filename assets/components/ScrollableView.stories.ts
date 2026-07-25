import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ScrollableView from "./ScrollableView.vue";

const meta = {
  title: "Components/ScrollableView",
  component: ScrollableView,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { ScrollableView },
    setup: () => ({ args }),
    template: `
      <ScrollableView v-bind="args">
        <div class="space-y-1 p-4 font-mono text-sm">
          <div v-for="n in 60" :key="n">log line {{ n }} — the quick brown fox jumps over the lazy dog</div>
        </div>
      </ScrollableView>`,
  }),
} satisfies Meta<typeof ScrollableView>;

export default meta;
type Story = StoryObj<typeof meta>;

// No #header slot -> plain flowing scroller (hasHeader is false).
export const Default: Story = { args: { scrollable: false } };

// With a #header slot the floating top bar and scroll controls appear.
export const WithHeader: Story = {
  args: { scrollable: false },
  render: (args) => ({
    components: { ScrollableView },
    setup: () => ({ args }),
    template: `
      <ScrollableView v-bind="args">
        <template #header>
          <span class="font-semibold">example-container</span>
        </template>
        <div class="space-y-1 p-4 font-mono text-sm">
          <div v-for="n in 60" :key="n">log line {{ n }} — the quick brown fox jumps over the lazy dog</div>
        </div>
      </ScrollableView>`,
  }),
};
