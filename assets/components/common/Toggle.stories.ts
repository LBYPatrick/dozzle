import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import Toggle from "./Toggle.vue";

const meta = {
  title: "Common/Toggle",
  component: Toggle,
  render: (args) => ({
    components: { Toggle },
    setup() {
      const model = ref(args.modelValue ?? false);
      return { args, model };
    },
    template: `
      <div class="w-72">
        <Toggle v-model="model">Enable smart mode</Toggle>
      </div>`,
  }),
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = { args: { modelValue: false } };
export const On: Story = { args: { modelValue: true } };
