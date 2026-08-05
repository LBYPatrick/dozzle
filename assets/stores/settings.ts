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
  // How the log view's top bar renders CPU and memory. "summary" is the compact
  // max/average readout; "chart" is the trend sparkline.
  resourceStatMode: "summary" | "chart";
  // Same choice for the network/disk card, which additionally keeps the live
  // per-second rate ("current") it has always shown.
  ioStatMode: "summary" | "current" | "chart";
  /** How the expanded stat trends are drawn. */
  trendShape: "bars" | "line" | "area";
  // When true the log view's top bar is collapsed into a small floating
  // CPU/memory widget. Persisted so the choice survives navigation and reload.
  topBarCollapsed: boolean;
  // Accent color id from PRIMARY_COLORS ("" == the default teal theme).
  primaryColor: string;
  // The container table's own preferences. These used to live in three loose
  // DOZZLE_TABLE_* localStorage keys, which meant settings export/import — and
  // therefore moving your setup to another browser — silently skipped them.
  /** How the table's CPU/memory columns are drawn: a trend, or a level meter. */
  containerTableStatMode: "chart" | "progress";
  containerTablePageSize: number;
  containerTableSortColumn: (typeof CONTAINER_TABLE_SORT_COLUMNS)[number];
  /** Sort direction as a boolean, so it validates like any other flag; the
      table maps it to the 1 / -1 its comparators multiply by. */
  containerTableSortAsc: boolean;
};

/** Page sizes the table offers, and the only values an import may set. */
export const CONTAINER_TABLE_PAGE_SIZES = [15, 30, 50, 100] as const;

/** Sortable table columns. Declared up here because both the legacy migration
    and ALLOWED_VALUES need it, and the migration runs before ALLOWED_VALUES is
    initialised — reading that const from the migration is a temporal-dead-zone
    throw at module load. */
export const CONTAINER_TABLE_SORT_COLUMNS = ["name", "host", "state", "created", "cpu", "mem"] as const;
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
  resourceStatMode: "summary",
  ioStatMode: "current",
  trendShape: "bars",
  topBarCollapsed: false,
  primaryColor: "",
  containerTableStatMode: "chart",
  containerTablePageSize: 15,
  containerTableSortColumn: "created",
  containerTableSortAsc: false,
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
  resourceStatMode,
  ioStatMode,
  trendShape,
  topBarCollapsed,
  primaryColor,
  containerTableStatMode,
  containerTablePageSize,
  containerTableSortColumn,
  containerTableSortAsc,
} = toRefs(settings.value);

// One-time move of the container table's three legacy keys into the profile.
// Without it, upgrading silently resets everyone's table to defaults — the new
// settings simply would not exist yet, so the defaults would win. Runs only
// while a legacy key is still present, and clears them as it goes.
migrateLegacyTableSettings();

function migrateLegacyTableSettings() {
  const read = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      // Private mode, or storage disabled. Nothing to migrate either way.
      return null;
    }
  };
  const drop = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  const mode = read("DOZZLE_TABLE_STAT_MODE");
  if (mode === "chart" || mode === "progress") settings.value.containerTableStatMode = mode;
  if (mode !== null) drop("DOZZLE_TABLE_STAT_MODE");

  const size = Number(read("DOZZLE_TABLE_PAGE_SIZE"));
  if (CONTAINER_TABLE_PAGE_SIZES.includes(size as (typeof CONTAINER_TABLE_PAGE_SIZES)[number])) {
    settings.value.containerTablePageSize = size;
  }
  if (read("DOZZLE_TABLE_PAGE_SIZE") !== null) drop("DOZZLE_TABLE_PAGE_SIZE");

  const rawSort = read("DOZZLE_TABLE_CONTAINERS_SORT");
  if (rawSort !== null) {
    try {
      const { column, direction } = JSON.parse(rawSort) ?? {};
      if (CONTAINER_TABLE_SORT_COLUMNS.includes(column)) {
        settings.value.containerTableSortColumn = column;
      }
      if (direction === 1 || direction === -1) settings.value.containerTableSortAsc = direction === 1;
    } catch {
      // A corrupt value is not worth failing startup over; defaults stand.
    }
    drop("DOZZLE_TABLE_CONTAINERS_SORT");
  }
}

/**
 * Restores every preference to its default and returns the undo.
 *
 * Hands back a closure rather than just resetting, because this wipes a
 * customised setup and the two callers need different ways back: the settings
 * panel arms a confirm step (a toast would be invisible under its <dialog>,
 * which sits in the browser's top layer), while the command palette closes
 * before the toast appears and can offer a plain Undo.
 */
export function resetSettings(): () => void {
  const previous = { ...settings.value };
  Object.assign(settings.value, DEFAULT_SETTINGS);
  return () => Object.assign(settings.value, previous);
}

// Reset the sidebar to its default width. Lives here because it operates purely
// on this store's state. Unconditional: the quick command is always offered, and
// running it on an already-default sidebar is a harmless no-op.
export function resetMenuWidth() {
  menuWidth.value = DEFAULT_MENU_WIDTH;
}

/**
 * The shape of the settings *document* — the JSON you export, hand-edit and
 * import — as a map of document path to the flat store key behind it.
 *
 * Deliberately not the shape of the store. Settings stay one flat object
 * internally because ~30 modules import individual refs off it (`compact`,
 * `softWrap`, …) and nesting the store would mean rewriting every one of them
 * to no benefit. Nesting is a property of the document, so it lives with the
 * serializer, and the two are free to differ.
 *
 * Paths also let the document use clearer names than the store's historical
 * ones — `appearance/theme` rather than `lightTheme`, and `dateTime/locale`
 * rather than `dateLocale`, which sat directly beside an unrelated `locale`.
 *
 * Declaration order is the document's key order, so groups read top-down in the
 * editor the way they are written here.
 */
const SETTINGS_DOCUMENT = {
  "appearance/theme": "lightTheme",
  "appearance/accentColor": "primaryColor",
  "appearance/fontSize": "size",
  "appearance/locale": "locale",
  "appearance/smallerScrollbars": "smallerScrollbars",

  "dateTime/hourStyle": "hourStyle",
  "dateTime/locale": "dateLocale",

  "logs/compact": "compact",
  "logs/showTimestamp": "showTimestamp",
  "logs/showStd": "showStd",
  "logs/softWrap": "softWrap",
  "logs/search": "search",
  "logs/topBarCollapsed": "topBarCollapsed",

  "stats/cpuDisplay": "cpuDisplayMode",
  "stats/resourceMode": "resourceStatMode",
  "stats/ioMode": "ioStatMode",
  "stats/trendShape": "trendShape",

  "containers/showAll": "showAllContainers",
  "containers/automaticRedirect": "automaticRedirect",
  "containers/grouping": "groupContainers",

  "containerTable/statMode": "containerTableStatMode",
  "containerTable/pageSize": "containerTablePageSize",
  "containerTable/sortColumn": "containerTableSortColumn",
  "containerTable/sortAscending": "containerTableSortAsc",

  "sidebar/width": "menuWidth",
  "sidebar/collapsed": "collapseNav",
} as const satisfies Record<string, keyof Settings>;

export type SettingsPath = keyof typeof SETTINGS_DOCUMENT;

/**
 * Reads a value out of a nested document by slash path, so a caller can address
 * `stats/trendShape` without walking the object itself.
 *
 * Returns `undefined` for any path that does not resolve — a missing key, or a
 * segment that runs into a primitive or an array partway down. That is the same
 * answer as "absent", which is what every caller here wants: an incomplete
 * document should leave the setting alone, not throw.
 */
export function readPath(source: unknown, path: string): unknown {
  let node: unknown = source;
  for (const segment of path.split("/")) {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

// Mirror of readPath, used only to build the document. Creates the intermediate
// objects as it descends.
function writePath(target: Record<string, unknown>, path: string, value: unknown) {
  const segments = path.split("/");
  const leaf = segments.pop()!;
  let node = target;
  for (const segment of segments) {
    if (typeof node[segment] !== "object" || node[segment] === null) node[segment] = {};
    node = node[segment] as Record<string, unknown>;
  }
  node[leaf] = value;
}

/** The current settings as the nested document, before stringifying. */
export function toSettingsDocument(): Record<string, unknown> {
  const document: Record<string, unknown> = {};
  for (const [path, key] of Object.entries(SETTINGS_DOCUMENT) as [SettingsPath, keyof Settings][]) {
    writePath(document, path, settings.value[key]);
  }
  return document;
}

/**
 * Collapses a document back to flat store keys.
 *
 * Falls back to the flat key whenever a path does not resolve, so a document
 * exported before the nesting still imports cleanly — and so does a partial one
 * that a user pasted a single group of.
 */
function flattenDocument(input: unknown): Partial<Record<keyof Settings, unknown>> {
  const legacy = input as Record<string, unknown>;
  const flat: Partial<Record<keyof Settings, unknown>> = {};
  for (const [path, key] of Object.entries(SETTINGS_DOCUMENT) as [SettingsPath, keyof Settings][]) {
    const nested = readPath(input, path);
    flat[key] = nested === undefined ? legacy[key] : nested;
  }
  return flat;
}

// Pretty-printed JSON of the current settings, used by the export-to-clipboard
// action and as the document backing the JSON editor view.
export function serializeSettings(): string {
  return JSON.stringify(toSettingsDocument(), null, 2);
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
  resourceStatMode: ["summary", "chart"],
  ioStatMode: ["summary", "current", "chart"],
  trendShape: ["bars", "line", "area"],
  containerTableStatMode: ["chart", "progress"],
  containerTableSortColumn: CONTAINER_TABLE_SORT_COLUMNS,
};

// Numeric settings restricted to a fixed set rather than a range: an arbitrary
// page size would not match any option the table offers, leaving its dropdown
// showing nothing.
const ALLOWED_NUMBERS: Partial<Record<keyof Settings, readonly number[]>> = {
  containerTablePageSize: CONTAINER_TABLE_PAGE_SIZES,
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
  const incoming = flattenDocument(input);
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const value = incoming[key];
    if (value === undefined) continue;

    if (typeof value !== typeof DEFAULT_SETTINGS[key]) continue;

    const allowed = ALLOWED_VALUES[key];
    if (allowed && (typeof value !== "string" || !allowed.includes(value))) continue;

    if (typeof value === "number") {
      const allowedNumbers = ALLOWED_NUMBERS[key];
      if (allowedNumbers && !allowedNumbers.includes(value)) continue;

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
