import type { Meta, StoryObj } from "@storybook/vue3-vite";
import LabeledInput from "./LabeledInput.vue";

const meta = {
  title: "Common/LabeledInput",
  component: LabeledInput,
  render: (args) => ({
    components: { LabeledInput },
    setup: () => ({ args }),
    template: `
      <LabeledInput v-bind="args" class="w-72">
        <template #label>Enable notifications</template>
        <template #input>
          <input type="checkbox" class="toggle toggle-primary" checked />
        </template>
      </LabeledInput>`,
  }),
} satisfies Meta<typeof LabeledInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTextInput: Story = {
  render: () => ({
    components: { LabeledInput },
    template: `
      <LabeledInput class="w-72">
        <template #label>Display name</template>
        <template #input>
          <input type="text" class="input input-bordered input-sm" value="dozzle" />
        </template>
      </LabeledInput>`,
  }),
};
