import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import CooldownField from "./CooldownField.vue";

const meta = {
  title: "Notification/CooldownField",
  component: CooldownField,
  render: (args) => ({
    components: { CooldownField },
    setup() {
      const model = ref(args.modelValue);
      return { model };
    },
    template: `<div style="width:24rem;max-width:90vw"><CooldownField v-model="model" /></div>`,
  }),
} satisfies Meta<typeof CooldownField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { modelValue: 300 } };
export const NoCooldown: Story = { args: { modelValue: 0 } };
export const OneHour: Story = { args: { modelValue: 3600 } };
