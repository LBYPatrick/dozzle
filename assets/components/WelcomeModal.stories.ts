import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onMounted, ref } from "vue";
import WelcomeModal from "./WelcomeModal.vue";

const meta = {
  title: "Components/WelcomeModal",
  component: WelcomeModal,
} satisfies Meta<typeof WelcomeModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// WelcomeModal is hidden until its exposed open() method runs, so drive it via a
// template ref on mount to show the first step.
export const Default: Story = {
  render: () => ({
    components: { WelcomeModal },
    setup() {
      const modal = ref<{ open: () => void }>();
      onMounted(() => modal.value?.open());
      return { modal };
    },
    template: `<WelcomeModal ref="modal" />`,
  }),
};
