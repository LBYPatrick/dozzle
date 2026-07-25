import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { K8sNamespace } from "@/stores/k8s";
import NamespaceLog from "./NamespaceLog.vue";

// Route-level viewer: takes a K8sNamespace and streams logs across its
// containers. Passed a real (empty) namespace so the header renders; the log
// stream stays empty without an SSE backend.
const namespace = new K8sNamespace("default", [], []);

const meta = {
  title: "K8sViewer/NamespaceLog",
  component: NamespaceLog,
  render: (args) => ({
    components: { NamespaceLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><NamespaceLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof NamespaceLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { namespace, scrollable: true } };
