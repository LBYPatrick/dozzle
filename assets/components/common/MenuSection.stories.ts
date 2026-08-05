import type { Meta, StoryObj } from "@storybook/vue3-vite";
import MenuSection from "./MenuSection.vue";

// MenuSection renders an <li>, so every story wraps it in the sidebar's
// <ul class="menu sidebar-menu"> to pick up the outline styling it is designed
// against.
const wrap = (inner: string) => `<ul class="menu sidebar-menu" style="width:18rem">${inner}</ul>`;

const meta = {
  title: "Common/MenuSection",
  component: MenuSection,
  render: (args) => ({
    components: { MenuSection },
    setup: () => ({ args }),
    template: wrap(`
      <MenuSection v-bind="args">
        <template #icon><ph:computer-tower class="size-4 shrink-0 opacity-70" /></template>
        <li><a class="py-1">web-frontend</a></li>
        <li><a class="py-1 menu-active">api-server</a></li>
        <li><a class="py-1">redis-cache</a></li>
      </MenuSection>`),
  }),
} satisfies Meta<typeof MenuSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The prominent level: a host, or a group of hosts. */
export const Host: Story = {
  args: { title: "prod-node-1", variant: "host", count: 3, open: true },
};

/** The quiet level: a set of containers inside a host. */
export const Group: Story = {
  args: { title: "storefront", variant: "group", count: 3, open: true },
};

export const Collapsed: Story = {
  args: { title: "prod-node-1", variant: "host", count: 3, open: false },
};

/** Trailing content is always visible; actions fade in on hover. */
export const WithTrailingAndActions: Story = {
  render: (args) => ({
    components: { MenuSection },
    setup: () => ({ args }),
    template: wrap(`
      <MenuSection v-bind="args">
        <template #icon><ph:computer-tower class="size-4 shrink-0 opacity-70" /></template>
        <template #trailing><span class="badge badge-error badge-xs p-1.5">offline</span></template>
        <template #actions>
          <button class="btn btn-square btn-ghost btn-xs text-primary"><ph:arrows-merge /></button>
        </template>
        <li><a class="py-1">web-frontend</a></li>
      </MenuSection>`),
  }),
  args: { title: "staging-node", variant: "host", count: 1, open: true },
};

/**
 * Nothing to show under the current container filter. The node dims, refuses to
 * open, and drops its chevron and hover actions — the click is answered before
 * it happens rather than by an empty list afterwards.
 */
export const Disabled: Story = {
  render: (args) => ({
    components: { MenuSection },
    setup: () => ({ args }),
    template: wrap(`
      <MenuSection v-bind="args">
        <template #icon><ph:computer-tower class="size-4 shrink-0 opacity-70" /></template>
        <template #actions>
          <button class="btn btn-square btn-ghost btn-xs text-primary"><ph:arrows-merge /></button>
        </template>
        <li><a class="py-1">present, but the node cannot open onto it</a></li>
      </MenuSection>`),
  }),
  args: { title: "idle-node", variant: "host", disabled: true, open: true },
};
