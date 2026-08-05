/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, beforeEach, vi } from "vitest";

// The store reaches config for the profile sync; jsdom gives it localStorage.
// Neither is under test here — the document mapping and validation are.
vi.mock("@/stores/config", () => ({
  __esModule: true,
  default: { base: "", hosts: [], authProvider: "simple" },
}));

import {
  DEFAULT_SETTINGS,
  applySettings,
  readPath,
  resetSettings,
  serializeSettings,
  settings,
  toSettingsDocument,
  type Settings,
} from "./settings";

function reset() {
  Object.assign(settings.value, DEFAULT_SETTINGS);
}

describe("readPath", () => {
  const doc = { appearance: { theme: "dark", nested: { deep: 1 } }, list: [1, 2] };

  test("resolves a slash path", () => {
    expect(readPath(doc, "appearance/theme")).toBe("dark");
    expect(readPath(doc, "appearance/nested/deep")).toBe(1);
  });

  test("returns the node itself for a single segment", () => {
    expect(readPath(doc, "appearance")).toEqual(doc.appearance);
  });

  // "Absent" is the answer every caller wants for a malformed path: an
  // incomplete document should leave the setting alone rather than throw.
  test("returns undefined rather than throwing on a path that does not resolve", () => {
    expect(readPath(doc, "appearance/missing")).toBeUndefined();
    expect(readPath(doc, "missing/entirely")).toBeUndefined();
    expect(readPath(doc, "appearance/theme/deeper")).toBeUndefined();
    expect(readPath(doc, "list/0")).toBeUndefined();
    expect(readPath(undefined, "anything")).toBeUndefined();
  });
});

describe("settings document", () => {
  beforeEach(reset);

  test("is nested, not a flat blob of keys", () => {
    const document = toSettingsDocument() as Record<string, Record<string, unknown>>;
    expect(document.appearance.theme).toBe(DEFAULT_SETTINGS.lightTheme);
    expect(document.containerTable.pageSize).toBe(DEFAULT_SETTINGS.containerTablePageSize);
    expect(document.sidebar.width).toBe(DEFAULT_SETTINGS.menuWidth);
    // The old flat names must not survive at the top level.
    expect(document.lightTheme).toBeUndefined();
    expect(document.containerTablePageSize).toBeUndefined();
  });

  // The map is hand-maintained, so a setting added to the store without a path
  // would silently vanish from export/import. This is the guard against that.
  test("covers every setting exactly once", () => {
    const document = toSettingsDocument();
    const leaves: string[] = [];
    const walk = (node: unknown, prefix: string) => {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) walk(value, `${prefix}${key}/`);
        else leaves.push(`${prefix}${key}`);
      }
    };
    walk(document, "");
    expect(leaves).toHaveLength(Object.keys(DEFAULT_SETTINGS).length);
  });

  test("round-trips through serialize and apply", () => {
    settings.value.lightTheme = "dark";
    settings.value.containerTablePageSize = 50;
    settings.value.trendShape = "area";
    const exported = serializeSettings();

    reset();
    expect(settings.value.lightTheme).toBe(DEFAULT_SETTINGS.lightTheme);

    expect(applySettings(JSON.parse(exported))).toEqual({ ok: true });
    expect(settings.value.lightTheme).toBe("dark");
    expect(settings.value.containerTablePageSize).toBe(50);
    expect(settings.value.trendShape).toBe("area");
  });

  test("applies a partial document without disturbing the rest", () => {
    applySettings({ stats: { trendShape: "line" } });
    expect(settings.value.trendShape).toBe("line");
    expect(settings.value.lightTheme).toBe(DEFAULT_SETTINGS.lightTheme);
  });

  // Documents exported before the nesting have to keep working.
  test("still accepts a legacy flat document", () => {
    expect(applySettings({ lightTheme: "light", trendShape: "area" })).toEqual({ ok: true });
    expect(settings.value.lightTheme).toBe("light");
    expect(settings.value.trendShape).toBe("area");
  });
});

describe("resetSettings", () => {
  beforeEach(reset);

  test("returns every preference to its default", () => {
    settings.value.lightTheme = "dark";
    settings.value.compact = true;
    settings.value.containerTablePageSize = 100;

    resetSettings();
    expect(settings.value).toEqual(DEFAULT_SETTINGS);
  });

  // The undo is the whole safety net — the panel arms a confirm and the palette
  // offers Undo, and both are worthless if the snapshot is partial.
  test("hands back an undo that restores the exact prior state", () => {
    settings.value.lightTheme = "dark";
    settings.value.trendShape = "area";
    settings.value.menuWidth = 42;
    const before = { ...settings.value };

    const undo = resetSettings();
    expect(settings.value).toEqual(DEFAULT_SETTINGS);

    undo();
    expect(settings.value).toEqual(before);
  });

  test("is idempotent, as the palette command needs it to be", () => {
    settings.value.compact = true;
    resetSettings();
    resetSettings();
    expect(settings.value).toEqual(DEFAULT_SETTINGS);
  });
});

describe("applySettings validation", () => {
  beforeEach(reset);

  test("rejects a non-object document", () => {
    expect(applySettings([]).ok).toBe(false);
    expect(applySettings(null).ok).toBe(false);
    expect(applySettings("nope").ok).toBe(false);
  });

  test("ignores values outside a string enum", () => {
    applySettings({ appearance: { theme: "solarized" } });
    expect(settings.value.lightTheme).toBe(DEFAULT_SETTINGS.lightTheme);
  });

  test("ignores values of the wrong type", () => {
    applySettings({ logs: { softWrap: "yes" } });
    expect(settings.value.softWrap).toBe(DEFAULT_SETTINGS.softWrap);
  });

  // An arbitrary page size matches no option the table offers, which would
  // leave its dropdown showing nothing.
  test("restricts page size to the offered set", () => {
    applySettings({ containerTable: { pageSize: 37 } });
    expect(settings.value.containerTablePageSize).toBe(DEFAULT_SETTINGS.containerTablePageSize);

    applySettings({ containerTable: { pageSize: 100 } });
    expect(settings.value.containerTablePageSize).toBe(100);
  });

  test("clamps a ranged number", () => {
    applySettings({ sidebar: { width: 999 } });
    expect(settings.value.menuWidth).toBe(50);
  });

  test("drops unknown keys entirely", () => {
    applySettings({ appearance: { theme: "dark" }, nonsense: { evil: true } });
    expect(settings.value.lightTheme).toBe("dark");
    expect((settings.value as Record<string, unknown>).nonsense).toBeUndefined();
    expect(Object.keys(settings.value).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort() as (keyof Settings)[]);
  });
});
