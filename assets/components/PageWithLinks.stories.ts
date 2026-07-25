import type { Meta, StoryObj } from "@storybook/vue3-vite";
import PageWithLinks from "./PageWithLinks.vue";

const meta = {
  title: "Components/PageWithLinks",
  component: PageWithLinks,
  parameters: { layout: "fullscreen" },
  render: (args) => ({
    components: { PageWithLinks },
    setup: () => ({ args }),
    template: `
      <PageWithLinks v-bind="args">
        <div class="rounded-box bg-base-200 p-8">Page content goes here.</div>
      </PageWithLinks>`,
  }),
} satisfies Meta<typeof PageWithLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { fill: false } };

export const Fill: Story = { args: { fill: true } };
