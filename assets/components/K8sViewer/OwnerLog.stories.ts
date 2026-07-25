import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { K8sOwner } from "@/stores/k8s";
import OwnerLog from "./OwnerLog.vue";

// Route-level viewer: takes a K8sOwner (e.g. a Deployment) and streams logs
// across its pods. Passed a real (empty) owner so the header renders.
const owner = new K8sOwner("my-app", "Deployment", "default", "default/Deployment/my-app", "my-app", []);

const meta = {
  title: "K8sViewer/OwnerLog",
  component: OwnerLog,
  render: (args) => ({
    components: { OwnerLog },
    setup: () => ({ args }),
    template: `<div style="height:32rem;width:52rem;display:flex;flex-direction:column"><OwnerLog v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof OwnerLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { owner, scrollable: true } };
