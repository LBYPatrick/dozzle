import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onMounted } from "vue";
import ToastModal from "./ToastModal.vue";
import { useToast } from "@/composable/toast";

const meta = {
  title: "Common/ToastModal",
  component: ToastModal,
  parameters: { layout: "fullscreen" },
  render: () => ({
    components: { ToastModal },
    setup() {
      const { toasts, showToast, removeToast } = useToast();
      // Reset any toasts left over from a previous story render, then seed a few.
      onMounted(() => {
        toasts.value.slice().forEach(({ toast }) => removeToast(toast.id));
        showToast({ id: "info", title: "Update available", message: "Dozzle v9.9.9 is ready.", type: "info" });
        showToast({ id: "warn", title: "Host unreachable", message: "localhost timed out.", type: "warning" });
        showToast({ id: "err", title: "Action failed", message: "Could not restart container.", type: "error" });
      });
      return {};
    },
    template: `<div style="height: 320px"><ToastModal /></div>`,
  }),
} satisfies Meta<typeof ToastModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
