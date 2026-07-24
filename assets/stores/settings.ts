import { computed } from "vue";
import { toRefs } from "@vueuse/core";

export type Settings = {
  search: boolean;
  size: "small" | "medium" | "large";
  compact: boolean;
  menuWidth: number;
  smallerScrollbars: boolean;
  showTimestamp: boolean;
  showStd: boolean;
  showAllContainers: boolean;
  lightTheme: "auto" | "dark" | "light";
  hourStyle: "auto" | "24" | "12";
  dateLocale: "auto" | "en-US" | "en-GB" | "de-DE" | "en-CA";
  softWrap: boolean;
  collapseNav: boolean;
  automaticRedirect: "instant" | "delayed" | "none";
  locale: string;
  groupContainers: "always" | "at-least-2" | "never";
  cpuDisplayMode: "utilization" | "cores";
  // When true the log view's top bar is collapsed into a small floating
  // CPU/memory widget. Persisted so the choice survives navigation and reload.
  topBarCollapsed: boolean;
  // Accent color id from PRIMARY_COLORS ("" == the default teal theme).
  primaryColor: string;
};
// Shared sidebar sizing (percent of the window width) so the layout and the
// collapse/expand handling always agree on one value.
export const DEFAULT_MENU_WIDTH = 15;
export const MIN_MENU_WIDTH = 10;

export const DEFAULT_SETTINGS: Settings = {
  search: true,
  compact: false,
  size: "medium",
  menuWidth: DEFAULT_MENU_WIDTH,
  smallerScrollbars: false,
  showTimestamp: true,
  showStd: false,
  showAllContainers: false,
  lightTheme: "auto",
  hourStyle: "auto",
  dateLocale: "auto",
  softWrap: true,
  collapseNav: false,
  automaticRedirect: "delayed",
  locale: "",
  groupContainers: "at-least-2",
  cpuDisplayMode: "utilization",
  topBarCollapsed: false,
  primaryColor: "",
};

export const settings = useProfileStorage("settings", DEFAULT_SETTINGS);

// @ts-ignore: automaticRedirect is now a string enum, but might be a boolean in older data
if (settings.value.automaticRedirect === true) {
  settings.value.automaticRedirect = "delayed";
  // @ts-ignore: automaticRedirect is now a string enum, but might be a boolean in older data
} else if (settings.value.automaticRedirect === false) {
  settings.value.automaticRedirect = "none";
}

export const {
  collapseNav,
  compact,
  softWrap,
  hourStyle,
  dateLocale,
  lightTheme,
  showAllContainers,
  showTimestamp,
  showStd,
  smallerScrollbars,
  menuWidth,
  size,
  search,
  locale,
  automaticRedirect,
  groupContainers,
  cpuDisplayMode,
  topBarCollapsed,
  primaryColor,
} = toRefs(settings.value);

// Reset the sidebar to its default width, exposed in the sidebar itself. Lives
// here because it operates purely on this store's state. canResetMenuWidth also
// gates the control's visibility: there is nothing to reset while the sidebar is
// collapsed or already at the default width.
export const canResetMenuWidth = computed(
  () => !collapseNav.value && Math.abs(menuWidth.value - DEFAULT_MENU_WIDTH) > 0.01,
);

export function resetMenuWidth() {
  if (canResetMenuWidth.value) menuWidth.value = DEFAULT_MENU_WIDTH;
}

// Pretty-printed JSON of the current settings, used by the export-to-clipboard
// action and as the document backing the JSON editor view.
export function serializeSettings(): string {
  return JSON.stringify(settings.value, null, 2);
}

// Allowed values for the string-enum settings, so an imported document can't
// set e.g. lightTheme to a non-existent theme. Keys without an entry accept any
// value of the matching primitive type.
const ALLOWED_VALUES: Partial<Record<keyof Settings, readonly string[]>> = {
  size: ["small", "medium", "large"],
  lightTheme: ["auto", "dark", "light"],
  hourStyle: ["auto", "24", "12"],
  dateLocale: ["auto", "en-US", "en-GB", "de-DE", "en-CA"],
  automaticRedirect: ["instant", "delayed", "none"],
  groupContainers: ["always", "at-least-2", "never"],
  cpuDisplayMode: ["utilization", "cores"],
};

// Numeric settings clamped to a safe range on import.
const NUMBER_BOUNDS: Partial<Record<keyof Settings, { min: number; max: number }>> = {
  menuWidth: { min: MIN_MENU_WIDTH, max: 50 },
};

// Merges an incoming settings object, keeping only keys Dozzle knows about and
// only values that are the right type, within a known enum, and (for numbers)
// within range — so a hand-edited or imported document can never inject
// arbitrary or malformed state. Returns a typed result instead of throwing.
export function applySettings(input: unknown): { ok: true } | { ok: false; error: string } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "Expected a JSON object of settings." };
  }
  const incoming = input as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (!(key in incoming) || incoming[key] === undefined) continue;

    const value = incoming[key];
    if (typeof value !== typeof DEFAULT_SETTINGS[key]) continue;

    const allowed = ALLOWED_VALUES[key];
    if (allowed && (typeof value !== "string" || !allowed.includes(value))) continue;

    if (typeof value === "number") {
      const bounds = NUMBER_BOUNDS[key];
      const clamped = bounds ? Math.min(bounds.max, Math.max(bounds.min, value)) : value;
      (settings.value as Record<string, unknown>)[key] = clamped;
      continue;
    }

    (settings.value as Record<string, unknown>)[key] = value;
  }
  return { ok: true };
}

// Parses a JSON string and applies it. Convenience wrapper over applySettings.
export function importSettingsJson(json: string): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  return applySettings(parsed);
}
