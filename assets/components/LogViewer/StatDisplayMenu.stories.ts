import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onMounted, ref } from "vue";
import StatDisplayMenu from "./StatDisplayMenu.vue";
import { ioStatMode, resourceStatMode } from "@/stores/settings";
import type { Settings } from "@/stores/settings";

type Args = { resource: Settings["resourceStatMode"]; io: Settings["ioStatMode"] };

// The menu renders bare <li> rows for a daisyUI dropdown, so the stories supply
// the surrounding <ul> the log toolbars provide, and force the <details> open so
// the choices are visible without interaction. Typed loosely: the component
// takes no props — the story args drive the settings store it reads.
const meta = {
  title: "LogViewer/StatDisplayMenu",
  component: StatDisplayMenu as unknown as Meta["component"],
  render: (args) => ({
    components: { StatDisplayMenu },
    setup() {
      const { resource, io } = args as Args;
      resourceStatMode.value = resource;
      ioStatMode.value = io;

      const root = ref<HTMLElement>();
      onMounted(() => root.value?.querySelectorAll("details").forEach((el) => (el.open = true)));
      return { root };
    },
    template: `
      <ul ref="root" class="menu rounded-box bg-base-200 border-base-content/20 w-60 border p-1 shadow-sm">
        <StatDisplayMenu />
      </ul>`,
  }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The defaults: compact CPU/memory, live network and disk rate. */
export const Default: Story = { args: { resource: "summary", io: "current" } };

/** Everything switched to the trend sparklines. */
export const AllCharts: Story = { args: { resource: "chart", io: "chart" } };

/** Everything switched to the compact max/average readout. */
export const AllSummaries: Story = { args: { resource: "summary", io: "summary" } };
