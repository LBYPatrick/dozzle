import type { Meta, StoryObj } from "@storybook/vue3-vite";
import FuzzySearchModal from "./FuzzySearchModal.vue";

// Command palette / fuzzy search panel. Reads the container, pinned, swarm and
// cloud stores/composables (mostly empty under Storybook, so it renders the
// input row plus footer). Only emits `close`; no props.
const meta = {
  title: "Components/FuzzySearchModal",
  component: FuzzySearchModal,
  render: (args) => ({
    components: { FuzzySearchModal },
    setup: () => ({ args }),
    template: `<div style="width:640px"><FuzzySearchModal v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof FuzzySearchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
