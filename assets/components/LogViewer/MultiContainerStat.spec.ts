/**
 * @vitest-environment jsdom
 */
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { defineComponent, h, nextTick, shallowRef, type ShallowRef } from "vue";
import { Container, Stat } from "@/models/Container";
import MultiContainerStat from "./MultiContainerStat.vue";
import { resourceStatMode } from "@/stores/settings";

vi.mock("@/stores/config", () => ({
  __esModule: true,
  default: { hosts: [], base: "" },
  withBase: (path: string) => path,
}));

// Capture recalculate() across both chart instances.
const recalculate = vi.fn();
const BarChartStub = defineComponent({
  name: "BarChart",
  props: ["chartData", "barClass"],
  setup(_, { expose }) {
    expose({ recalculate });
    return () => h("div", { class: "bar-chart-stub" });
  },
});

const i18n = createI18n({ legacy: false, locale: "en", missingWarn: false, fallbackWarn: false, messages: { en: {} } });

function stat(cpu: number): Stat {
  return {
    cpu,
    memory: cpu,
    memoryUsage: cpu,
    networkRxTotal: 0,
    networkTxTotal: 0,
    diskReadTotal: 0,
    diskWriteTotal: 0,
  };
}

function makeContainer(id: string, cpu: number): Container {
  const stats = Array.from({ length: 10 }, () => stat(cpu));
  const now = new Date();
  return new Container(id, now, now, now, "img", id, "cmd", "host1", {}, "running", 0, 0, stats);
}

// Mirror production: a parent holding a ref re-renders with a fresh [container]
// array on switch. (VueTestUtils setProps cannot trigger this because Container
// instances carry refs, which defeats prop change detection on a direct prop
// assignment.)
function mountWithContainer(current: ShallowRef<Container>) {
  const Parent = defineComponent({
    setup: () => () => h(MultiContainerStat as any, { containers: [current.value] }),
  });
  return mount(Parent, {
    global: { plugins: [i18n], stubs: { BarChart: BarChartStub, IOCard: true } },
  });
}

describe("<MultiContainerStat />", () => {
  beforeEach(() => {
    resourceStatMode.value = "chart";
    recalculate.mockClear();
  });

  test("recalculates the charts when the container changes", async () => {
    const current = shallowRef<Container>(makeContainer("a", 10));
    mountWithContainer(current);
    await flushPromises();
    recalculate.mockClear();

    // Switching containers replaces the whole stats series; the parent must
    // force the cached charts to fully recompute.
    current.value = makeContainer("b", 90);
    await nextTick();
    await flushPromises();

    expect(recalculate).toHaveBeenCalled();
  });

  test("summary mode reports max and average instead of a chart", async () => {
    resourceStatMode.value = "summary";

    const wrapper = mountWithContainer(shallowRef<Container>(makeContainer("a", 10)));
    await flushPromises();

    expect(wrapper.find(".bar-chart-stub").exists()).toBe(false);
    // The container reports a flat 10% across its history, so max and average
    // agree; both are rendered.
    expect(wrapper.text()).toContain("10.0%");
  });
});
