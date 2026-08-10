import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DrawerPanel from "./DrawerPanel.vue";

// DrawerPanel is designed to fill the side drawer, so every story gives it a
// bounded height — its whole point is a title bar that stays put while the body
// scrolls under it, which cannot be seen in a box that grows to fit.
const frame = (inner: string) =>
  `<div class="glass-surface glass-surface-thick h-[32rem] w-[36rem] overflow-hidden rounded-[var(--control-radius)]">${inner}</div>`;

const paragraphs = Array.from(
  { length: 12 },
  (_, i) => `<p class="type-body">Body paragraph ${i + 1}, here to make the panel scroll.</p>`,
).join("");

const meta = {
  title: "Common/DrawerPanel",
  component: DrawerPanel,
  render: (args) => ({
    components: { DrawerPanel },
    setup: () => ({ args }),
    template: frame(`
      <DrawerPanel v-bind="args">
        <div class="flex flex-col gap-3">${paragraphs}</div>
      </DrawerPanel>`),
  }),
} satisfies Meta<typeof DrawerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Title alone — the minimum a panel needs. */
export const Basic: Story = {
  args: { title: "Alert" },
};

/** The full header: a category eyebrow above the specific thing. */
export const WithEyebrow: Story = {
  args: { eyebrow: "Log entry", title: "12:04:51.238" },
};

/** Leading glyph, subtitle and a trailing action, as the log panels use it. */
export const FullHeader: Story = {
  render: (args) => ({
    components: { DrawerPanel },
    setup: () => ({ args }),
    template: frame(`
      <DrawerPanel v-bind="args">
        <template #leading><span class="status-pill level-pill" data-level="error">error</span></template>
        <template #subtitle>2 minutes ago · stderr</template>
        <template #actions>
          <button class="btn btn-sm">See in context</button>
        </template>
        <div class="flex flex-col gap-3">${paragraphs}</div>
      </DrawerPanel>`),
  }),
  args: { eyebrow: "Log entry", title: "12:04:51.238" },
};

/** The inset grouped list, which is what panels use for metadata. */
export const GroupedList: Story = {
  render: (args) => ({
    components: { DrawerPanel },
    setup: () => ({ args }),
    template: frame(`
      <DrawerPanel v-bind="args">
        <section class="flex flex-col gap-2">
          <h2 class="type-section">Source</h2>
          <div class="inset-group">
            <div class="inset-row">
              <span class="inset-label">Container</span>
              <span class="inset-value truncate">nightly-report</span>
            </div>
            <div class="inset-row">
              <span class="inset-label">Host</span>
              <span class="inset-value truncate">docker-desktop</span>
            </div>
            <div class="inset-row">
              <span class="inset-label">Image</span>
              <span class="inset-value truncate font-mono">python:3.12-alpine</span>
            </div>
          </div>
        </section>
      </DrawerPanel>`),
  }),
  args: { eyebrow: "Log entry", title: "12:04:51.238" },
};

/** `flush` hands the body over: no padding, and no scrolling of our own. */
export const Flush: Story = {
  render: (args) => ({
    components: { DrawerPanel },
    setup: () => ({ args }),
    template: frame(`
      <DrawerPanel v-bind="args">
        <div class="bg-base-content/5 grid h-full place-content-center font-mono text-sm">
          fills the panel edge to edge
        </div>
      </DrawerPanel>`),
  }),
  args: { eyebrow: "Terminal", title: "nightly-report", flush: true },
};
