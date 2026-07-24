import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";

import FuzzySearchModal from "./FuzzySearchModal.vue";

import { Container } from "@/models/Container";
import { lightTheme } from "@/stores/settings";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { router } from "@/modules/router";

// @ts-ignore
import EventSource, { sources } from "eventsourcemock";

vi.mock("vue-router");

vi.mock("@/stores/config", () => ({
  __esModule: true,
  default: { base: "", hosts: [{ name: "localhost", id: "localhost" }], enableActions: true },
  withBase: (path: string) => path,
}));

function createFuzzySearchModal() {
  global.EventSource = EventSource;
  const wrapper = mount(FuzzySearchModal, {
    global: {
      plugins: [
        createI18n({}),
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            container: {
              containers: [
                new Container(
                  "123",
                  new Date(),
                  new Date(),
                  new Date(),
                  "image",
                  "test",
                  "command",
                  "host",
                  {},
                  "running",
                  0,
                  0,
                  [],
                ),
                new Container(
                  "345",
                  new Date(),
                  new Date(),
                  new Date(),
                  "image",
                  "foo bar",
                  "command",
                  "host",
                  {},
                  "running",
                  0,
                  0,
                  [],
                ),
                new Container(
                  "567",
                  new Date(),
                  new Date(),
                  new Date(),
                  "image",
                  "baz",
                  "command",
                  "host",
                  {},
                  "running",
                  0,
                  0,
                  [],
                ),
              ],
            },
          },
        }),
      ],
    },
  });
  return wrapper;
}

/**
 * @vitest-environment jsdom
 */
describe("<FuzzySearchModal />", () => {
  vi.mocked(useRouter).mockReturnValue({
    ...router,
    push: vi.fn(),
  });

  beforeEach(() => {
    vi.mocked(useRouter().push).mockReset();
  });

  test("shows none initially", async () => {
    const wrapper = createFuzzySearchModal();
    expect(wrapper.findAll("li").length).toBe(0);
  });

  test("search for foo", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("foo");
    expect(wrapper.findAll("li").length).toBe(1);
    expect(wrapper.find("ul [data-name]").html()).toMatchInlineSnapshot(
      `"<span data-v-dc2e8c61="" class="text-base-content" data-name=""><mark>foo</mark> bar</span>"`,
    );
  });

  test("choose baz", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("baz");
    await wrapper.find("input").trigger("keydown.enter");
    expect(useRouter().push).toHaveBeenCalledWith({ name: "/container/[id]", params: { id: "567" } });
  });

  test("matches commands by keyword", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("theme");
    const items = wrapper.findAll("li").map((li) => li.text());
    expect(items.some((text) => text.includes("command-palette.theme-dark"))).toBe(true);
  });

  test("theme commands set the theme explicitly", async () => {
    lightTheme.value = "auto";
    const wrapper = createFuzzySearchModal();

    await wrapper.find("input").setValue("dark theme");
    await wrapper.find("input").trigger("keydown.enter");
    expect(lightTheme.value).toBe("dark");

    await wrapper.find("input").setValue("light theme");
    await wrapper.find("input").trigger("keydown.enter");
    expect(lightTheme.value).toBe("light");

    await wrapper.find("input").setValue("system theme");
    await wrapper.find("input").trigger("keydown.enter");
    expect(lightTheme.value).toBe("auto");
  });

  test("renders the slash command dimmed on each command row", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("theme");
    const rows = wrapper.findAll("li").map((li) => li.text());
    expect(rows.some((text) => text.includes("/theme dark"))).toBe(true);
  });

  test("a leading slash enters command mode and hides containers", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("/theme");
    const rows = wrapper.findAll("li").map((li) => li.text());
    expect(rows.every((text) => text.includes("/theme"))).toBe(true);
    // Containers ("test", "foo bar", "baz") must not appear in command mode.
    expect(wrapper.findAll("ul [data-name]").length).toBe(0);
  });

  test("slash command autocompletes and runs on enter", async () => {
    lightTheme.value = "auto";
    const wrapper = createFuzzySearchModal();

    await wrapper.find("input").setValue("/theme dark");
    expect(wrapper.findAll("li").length).toBe(1);
    await wrapper.find("input").trigger("keydown.enter");
    expect(lightTheme.value).toBe("dark");
  });

  test("bare slash lists all commands", async () => {
    const wrapper = createFuzzySearchModal();
    await wrapper.find("input").setValue("/");
    const rows = wrapper.findAll("li").map((li) => li.text());
    expect(rows.some((text) => text.includes("/theme dark"))).toBe(true);
    expect(rows.some((text) => text.includes("/settings"))).toBe(true);
  });

  test("an escaped slash searches literally instead of running commands", async () => {
    const wrapper = createFuzzySearchModal();

    // "/foo" is command mode: no slash command matches, containers are hidden.
    await wrapper.find("input").setValue("/foo");
    expect(wrapper.findAll("ul [data-name]").length).toBe(0);

    // "\/foo" is an escaped literal search: the "foo bar" container shows.
    await wrapper.find("input").setValue("\\/foo");
    expect(wrapper.findAll("ul [data-name]").length).toBe(1);
  });
});
