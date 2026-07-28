/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi } from "vitest";
import { ref, shallowRef } from "vue";
import { ComplexLogEntry, type JSONObject } from "@/models/LogEntry";
import { useVisibleFilter } from "./visible";
import { useSearchFilter } from "./search";

vi.mock("@/stores/config", () => ({
  __esModule: true,
  default: { hosts: [], base: "", maxLogs: 400 },
  withBase: (path: string) => path,
}));

const { searchQueryFilter, showSearch, resetSearch, inverseFilter } = useSearchFilter();

function entry(id: number, message: JSONObject) {
  return new ComplexLogEntry(
    message,
    "abc",
    id,
    new Date("2026-07-27T10:00:00Z"),
    "info",
    "stdout",
    JSON.stringify(message),
  );
}

// isSearching only flips once the debounced filter catches up.
async function startSearch(query: string) {
  showSearch.value = true;
  searchQueryFilter.value = query;
  await new Promise((resolve) => setTimeout(resolve, 500));
}

describe("useVisibleFilter", () => {
  test("passes everything through when no search is active", () => {
    resetSearch();
    const messages = shallowRef([entry(1, { msg: "plain" }), entry(2, { msg: "also plain" })]);
    const { filteredPayload } = useVisibleFilter(ref(new Map()));

    expect(filteredPayload(messages).value).toHaveLength(2);
  });

  test("keeps only entries the server highlighted, including nested values", async () => {
    await startSearch("probe");
    inverseFilter.value = false;
    const messages = shallowRef([
      entry(1, { msg: "no match here" }),
      entry(2, { msg: "a <mark>probe</mark> hit" }),
      // The highlight can sit anywhere in the payload, not just at the top level.
      entry(3, { outer: { inner: ["deep <mark>probe</mark>"] } }),
    ]);
    const { filteredPayload } = useVisibleFilter(ref(new Map()));

    expect(filteredPayload(messages).value.map((m) => m.id)).toEqual([2, 3]);
    resetSearch();
  });

  test("inverse search keeps the entries that did not match", async () => {
    await startSearch("probe");
    inverseFilter.value = true;
    const messages = shallowRef([entry(1, { msg: "no match here" }), entry(2, { msg: "a <mark>probe</mark> hit" })]);
    const { filteredPayload } = useVisibleFilter(ref(new Map()));

    expect(filteredPayload(messages).value.map((m) => m.id)).toEqual([1]);
    resetSearch();
    inverseFilter.value = false;
  });

  test("derives a stable entry per visible-keys ref", () => {
    // Recomputing must not hand the list fresh objects: every re-render of the
    // visible window would then rebuild every row (and allocate a Vue computed
    // per entry), which is what made searching a long log lock the page up.
    resetSearch();
    // shallowRef, as the log stream uses: a deep ref would wrap each entry in a
    // reactive proxy and the identity check below would be meaningless.
    const messages = shallowRef([entry(1, { msg: "one" })]);
    const visibleKeys = ref(new Map<string[], boolean>());
    const { filteredPayload } = useVisibleFilter(visibleKeys);

    const first = filteredPayload(messages).value[0];
    const second = filteredPayload(messages).value[0];
    expect(second).toBe(first);
  });

  test("a second view with its own visible keys gets its own derived entry", () => {
    resetSearch();
    const source = entry(1, { msg: "one" });
    const messages = shallowRef([source]);
    const columnA = ref(new Map<string[], boolean>());
    const columnB = ref(new Map<string[], boolean>());

    const a = useVisibleFilter(columnA).filteredPayload(messages).value[0];
    const b = useVisibleFilter(columnB).filteredPayload(messages).value[0];

    expect(a).not.toBe(b);
    // ...and each stays stable on its own.
    expect(useVisibleFilter(columnA).filteredPayload(messages).value[0]).toBe(a);
  });
});
