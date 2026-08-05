/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref, type Ref } from "vue";
import { useSearchFilter } from "./search";
import { provideLoggingContext } from "./logContext";
import type { Container } from "@/models/Container";

describe("useSearchFilter", () => {
  // State is a module-level singleton, so reset before each test.
  beforeEach(() => {
    useSearchFilter().resetSearch();
  });

  test("isValidQuery reflects regex validity", () => {
    const { searchQueryFilter, isValidQuery } = useSearchFilter();
    searchQueryFilter.value = "foo.*";
    expect(isValidQuery.value).toBe(true);

    searchQueryFilter.value = "[";
    expect(isValidQuery.value).toBe(false);
  });

  test("toggleInverse flips the inverse flag", () => {
    const { inverseFilter, toggleInverse } = useSearchFilter();
    expect(inverseFilter.value).toBe(false);
    toggleInverse();
    expect(inverseFilter.value).toBe(true);
    toggleInverse();
    expect(inverseFilter.value).toBe(false);
  });

  test("resetSearch clears query, visibility and inverse", () => {
    const { searchQueryFilter, showSearch, inverseFilter, toggleInverse, resetSearch } = useSearchFilter();
    searchQueryFilter.value = "abc";
    showSearch.value = true;
    toggleInverse();

    resetSearch();

    expect(searchQueryFilter.value).toBe("");
    expect(showSearch.value).toBe(false);
    expect(inverseFilter.value).toBe(false);
  });
});

describe("seeding from ?search=", () => {
  // The palette's log search arrives by router.push, so the query only exists
  // after navigation. Reading it at module load meant a cold page load worked
  // and every in-app navigation silently searched for nothing — no `filter` on
  // the stream, no backward scan, no results.
  const seed = (url: string) => {
    window.history.replaceState({}, "", url);
    let state: ReturnType<typeof useSearchFilter> | undefined;

    // useSearchFilter only seeds a context-backed state, so the reader has to
    // be a descendant of the provider — the same shape as the real tree.
    const Reader = defineComponent({
      setup() {
        state = useSearchFilter();
        return () => h("div");
      },
    });

    mount(
      defineComponent({
        setup() {
          provideLoggingContext(ref([]) as unknown as Ref<Container[]>);
          return () => h(Reader);
        },
      }),
    );

    return state!;
  };

  test("applies a query that only appears after navigation", () => {
    const state = seed("/logs?search=timeout");
    expect(state.searchQueryFilter.value).toBe("timeout");
    expect(state.showSearch.value).toBe(true);
  });

  test("a later navigation to a different query seeds again", () => {
    seed("/logs?search=first");
    const second = seed("/logs?search=second");
    expect(second.searchQueryFilter.value).toBe("second");
  });

  test("a second view on the same URL opens empty, so pinned panes do not inherit it", () => {
    seed("/logs?search=shared");
    const sibling = seed("/logs?search=shared");
    expect(sibling.searchQueryFilter.value).toBe("");
  });

  // The stream URL is built from the *debounced* filter, and refDebounced
  // initialises from its source. Assigning the query after construction left it
  // empty for a full 400ms, so the first connection carried no filter at all —
  // on a fleet view that is every running container on every host streaming to
  // the browser, only to be thrown away on reconnect.
  test("the debounced filter is already set, so the first connection is filtered", () => {
    const state = seed("/logs?search=timeout");
    expect(state.debouncedSearchFilter.value).toBe("timeout");
    expect(state.isSearching.value).toBe(true);
  });

  test("no query leaves the field alone", () => {
    const state = seed("/logs");
    expect(state.searchQueryFilter.value).toBe("");
    expect(state.showSearch.value).toBe(false);
  });
});
