import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import TextField from "./TextField.vue";
import MdiMagnify from "~icons/mdi/magnify";
import MdiLinkVariant from "~icons/mdi/link-variant";

const meta = {
  title: "Common/TextField",
  component: TextField,
  render: (args) => ({
    components: { TextField, MdiMagnify },
    setup() {
      const model = ref((args as { modelValue?: string }).modelValue ?? "");
      return { args, model };
    },
    template: `
      <div style="width:22rem">
        <TextField v-bind="args" v-model="model">
          <template #leading><MdiMagnify class="size-4" /></template>
        </TextField>
      </div>`,
  }),
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty: no clear button until there is something to clear. */
export const Empty: Story = {
  args: { placeholder: "Search containers" },
};

/** With content, the clear button grows in on the trailing edge. */
export const Filled: Story = {
  args: { placeholder: "Search containers", modelValue: "nginx" },
};

export const Invalid: Story = {
  args: { placeholder: "https://example.com/hook", modelValue: "not a url", invalid: true },
};

export const Disabled: Story = {
  args: { placeholder: "Managed by Dozzle Cloud", modelValue: "read-only", disabled: true },
};

export const Small: Story = {
  args: { placeholder: "Filter", modelValue: "err", fieldSize: "sm" },
};

export const Large: Story = {
  args: { placeholder: "Webhook URL", modelValue: "https://hooks.example.com/abc", fieldSize: "lg" },
};

/** Both affordance slots in use. */
export const WithTrailingSlot: Story = {
  render: (args) => ({
    components: { TextField, MdiLinkVariant },
    setup() {
      const model = ref("https://hooks.example.com/abc");
      return { args, model };
    },
    template: `
      <div style="width:22rem">
        <TextField v-bind="args" v-model="model">
          <template #leading><MdiLinkVariant class="size-4" /></template>
          <template #trailing><kbd class="kbd kbd-xs">↵</kbd></template>
        </TextField>
      </div>`,
  }),
  args: { placeholder: "Webhook URL" },
};
