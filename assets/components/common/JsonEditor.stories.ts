import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import JsonEditor from "./JsonEditor.vue";

const meta = {
  title: "Common/JsonEditor",
  component: JsonEditor,
  render: (args) => ({
    components: { JsonEditor },
    setup() {
      const model = ref(args.modelValue);
      return { args, model };
    },
    template: `
      <div class="border-base-content/20 rounded" style="width: 420px; height: 220px">
        <JsonEditor v-model="model" :read-only="args.readOnly" />
      </div>`,
  }),
} satisfies Meta<typeof JsonEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const sample = JSON.stringify({ name: "dozzle", enabled: true, hosts: ["localhost"], maxLogs: 400 }, null, 2);

export const Default: Story = { args: { modelValue: sample, readOnly: false } };
export const ReadOnly: Story = { args: { modelValue: sample, readOnly: true } };
