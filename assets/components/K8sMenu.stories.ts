import type { Meta, StoryObj } from "@storybook/vue3-vite";
import K8sMenu from "./K8sMenu.vue";

// Kubernetes namespace/owner navigation. Reads the k8s store (empty under
// Storybook, so it renders the "all namespaces" entry). No props.
const meta = {
  title: "Components/K8sMenu",
  component: K8sMenu,
  render: (args) => ({
    components: { K8sMenu },
    setup: () => ({ args }),
    template: `<div style="width:320px"><K8sMenu v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof K8sMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
