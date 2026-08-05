import type { Component } from "vue";
import type { Ref } from "vue";
import { Container } from "@/models/Container";
import { useContainerActions } from "@/composable/containerActions";
import { canScroll, scrollLogsToTop, scrollLogsToBottom } from "@/composable/scrollControls";
import { useSettingsModal } from "@/composable/settingsModal";
import config from "@/stores/config";
import type { Settings } from "@/stores/settings";
import { availableLocales } from "@/modules/i18n";
import {
  lightTheme,
  compact,
  showTimestamp,
  softWrap,
  showAllContainers,
  showStd,
  smallerScrollbars,
  collapseNav,
  cpuDisplayMode,
  resetMenuWidth,
  resetSettings,
  size,
  search,
  topBarCollapsed,
  resourceStatMode,
  ioStatMode,
  trendShape,
  groupContainers,
  automaticRedirect,
  containerTableStatMode,
  containerTablePageSize,
  CONTAINER_TABLE_PAGE_SIZES,
  hourStyle,
  dateLocale,
  primaryColor,
  locale,
} from "@/stores/settings";

import mdiThemeLightDark from "~icons/mdi/theme-light-dark";
import mdiWhiteBalanceSunny from "~icons/mdi/white-balance-sunny";
import mdiWeatherNight from "~icons/mdi/weather-night";
import mdiFormatLineSpacing from "~icons/mdi/format-line-spacing";
import mdiClockOutline from "~icons/mdi/clock-outline";
import mdiWrap from "~icons/mdi/wrap";
import mdiEyeOutline from "~icons/mdi/eye-outline";
import mdiFormatListBulleted from "~icons/mdi/format-list-bulleted";
import mdiUnfoldMoreHorizontal from "~icons/mdi/unfold-more-horizontal";
import mdiCogOutline from "~icons/mdi/cog-outline";
import mdiCodeJson from "~icons/mdi/code-json";
import mdiChip from "~icons/mdi/chip";
import mdiChevronDoubleUp from "~icons/mdi/chevron-double-up";
import mdiChevronDoubleDown from "~icons/mdi/chevron-double-down";
import mdiDockLeft from "~icons/mdi/dock-left";
import mdiArrowCollapseHorizontal from "~icons/mdi/arrow-collapse-horizontal";
import carbonRestart from "~icons/carbon/restart";
import mdiStop from "~icons/mdi/stop";
import mdiPlay from "~icons/mdi/play";
import mdiDownload from "~icons/mdi/download";
import mdiFormatSize from "~icons/mdi/format-size";
import mdiMemory from "~icons/mdi/memory";
import mdiSwapVertical from "~icons/mdi/swap-vertical";
import mdiChartLine from "~icons/mdi/chart-line";
import mdiTable from "~icons/mdi/table";
import mdiFormatListNumbered from "~icons/mdi/format-list-numbered";
import mdiMagnify from "~icons/mdi/magnify";
import mdiDockTop from "~icons/mdi/dock-top";
import mdiGroup from "~icons/mdi/group";
import mdiSwapHorizontal from "~icons/mdi/swap-horizontal";
import mdiCalendarOutline from "~icons/mdi/calendar-outline";
import mdiBackupRestore from "~icons/mdi/backup-restore";
import mdiPalette from "~icons/mdi/palette";
import mdiTranslate from "~icons/mdi/translate";

export type CommandSection = "container" | "settings" | "navigation";

export type Command = {
  id: string;
  title: string;
  section: CommandSection;
  icon: Component;
  // Explicit slash command (e.g. "/theme dark"). Shown dimmed on the right of
  // the row and used for autocomplete when the query starts with "/". Kept
  // untranslated so the command names stay stable across locales.
  slash: string;
  keywords?: string;
  // Which preference this command sets, when it sets one. Read by the parity
  // test, and the reason a new setting cannot quietly go unreachable.
  setting?: keyof Settings;
  // A colour to show in place of the icon. The accent commands are choosing a
  // colour, so the row should show the colour rather than name it twice.
  swatch?: string;
  perform: () => unknown;
};

// Every command sets an explicit final state so it is idempotent: running it
// twice leaves the app in the same place. That rules out bare toggles, so each
// boolean setting is exposed as an on/off pair instead of a single flip. This
// helper builds that pair from one declaration to keep the registry DRY.
function booleanStateCommands(opts: {
  base: string; // slash + id stem, e.g. "compact" -> "/compact on|off"
  setting: keyof Settings;
  flag: Ref<boolean>;
  icon: Component;
  onTitle: string;
  offTitle: string;
  keywords: string;
  onWord?: string; // slash suffix for the enabled state (default "on")
  offWord?: string; // slash suffix for the disabled state (default "off")
}): Command[] {
  const on = opts.onWord ?? "on";
  const off = opts.offWord ?? "off";
  return [
    {
      id: `settings.${opts.base}-${on}`,
      section: "settings",
      icon: opts.icon,
      title: opts.onTitle,
      slash: `/${opts.base} ${on}`,
      keywords: opts.keywords,
      setting: opts.setting,
      perform: () => (opts.flag.value = true),
    },
    {
      id: `settings.${opts.base}-${off}`,
      section: "settings",
      icon: opts.icon,
      title: opts.offTitle,
      slash: `/${opts.base} ${off}`,
      keywords: opts.keywords,
      setting: opts.setting,
      perform: () => (opts.flag.value = false),
    },
  ];
}

// The same idempotency rule for a setting with more than two values: one
// command per value, never a "cycle" — you should be able to say where you want
// to land without knowing where you are.
//
// Titles are composed from the labels the settings UI already uses ("CPU &
// memory" + "Trend chart"), so a new command needs no new translation and the
// palette can never describe a setting differently from the panel that owns it.
function enumStateCommands<T extends string | number>(opts: {
  base: string; // slash + id stem, e.g. "trend" -> "/trend bars"
  setting: keyof Settings;
  value: Ref<T>;
  icon: Component;
  label: string; // translated group label, e.g. "Trend shape"
  keywords: string;
  options: { value: T; word: string; label: string; swatch?: string }[]; // word = slash suffix
}): Command[] {
  return opts.options.map((option) => ({
    id: `settings.${opts.base}-${option.word}`,
    section: "settings" as const,
    icon: opts.icon,
    title: `${opts.label}: ${option.label}`,
    slash: `/${opts.base} ${option.word}`,
    keywords: `${opts.keywords} ${option.word}`,
    setting: opts.setting,
    swatch: option.swatch,
    perform: () => (opts.value.value = option.value),
  }));
}

// A language in its own name — "Deutsch", not "German" — since the person
// looking for it is the one who reads it. Intl carries the table, so this costs
// nothing and stays right as locales are added.
function languageName(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/**
 * Every command that sets a preference, as a pure function of `t`.
 *
 * Extracted from useCommands so the palette's settings coverage can be
 * asserted directly: this needs no router, store or app context, so a test can
 * build the real list and check that every key in `Settings` is either driven
 * by a command here or named in SETTINGS_WITHOUT_COMMANDS. Parity then fails
 * loudly when a setting is added, instead of quietly going unreachable.
 */
export function settingCommands(t: (key: string, named?: Record<string, unknown>) => string): Command[] {
  return [
    // lightTheme is tri-state, so expose each value as its own command rather
    // than a single toggle — that keeps "auto" (follow OS) reachable and makes
    // the target theme explicit instead of depending on the current state.
    {
      id: "settings.theme-auto",
      setting: "lightTheme",
      section: "settings",
      icon: mdiThemeLightDark,
      title: t("command-palette.theme-auto"),
      slash: "/theme auto",
      keywords: "theme auto system color mode appearance",
      perform: () => (lightTheme.value = "auto"),
    },
    {
      id: "settings.theme-light",
      setting: "lightTheme",
      section: "settings",
      icon: mdiWhiteBalanceSunny,
      title: t("command-palette.theme-light"),
      slash: "/theme light",
      keywords: "theme light color mode appearance",
      perform: () => (lightTheme.value = "light"),
    },
    {
      id: "settings.theme-dark",
      setting: "lightTheme",
      section: "settings",
      icon: mdiWeatherNight,
      title: t("command-palette.theme-dark"),
      slash: "/theme dark",
      keywords: "theme dark color mode appearance",
      perform: () => (lightTheme.value = "dark"),
    },
    // CPU display is a two-value enum (whole-CPU utilization vs per-core), so
    // expose both explicitly for the same idempotency reason as the theme.
    {
      id: "settings.cpu-utilization",
      setting: "cpuDisplayMode",
      section: "settings",
      icon: mdiChip,
      title: t("command-palette.cpu-utilization"),
      slash: "/cpu utilization",
      keywords: "cpu utilization percent whole processor usage",
      perform: () => (cpuDisplayMode.value = "utilization"),
    },
    {
      id: "settings.cpu-cores",
      setting: "cpuDisplayMode",
      section: "settings",
      icon: mdiChip,
      title: t("command-palette.cpu-cores"),
      slash: "/cpu cores",
      keywords: "cpu cores per-core top processor usage",
      perform: () => (cpuDisplayMode.value = "cores"),
    },
    ...booleanStateCommands({
      base: "compact",
      setting: "compact",
      flag: compact,
      icon: mdiFormatLineSpacing,
      onTitle: t("command-palette.compact-on"),
      offTitle: t("command-palette.compact-off"),
      keywords: "compact density spacing",
    }),
    ...booleanStateCommands({
      base: "timestamps",
      setting: "showTimestamp",
      flag: showTimestamp,
      icon: mdiClockOutline,
      onTitle: t("command-palette.timestamps-show"),
      offTitle: t("command-palette.timestamps-hide"),
      keywords: "timestamp time date",
      onWord: "show",
      offWord: "hide",
    }),
    ...booleanStateCommands({
      base: "wrap",
      setting: "softWrap",
      flag: softWrap,
      icon: mdiWrap,
      onTitle: t("command-palette.soft-wrap-on"),
      offTitle: t("command-palette.soft-wrap-off"),
      keywords: "wrap soft line",
    }),
    ...booleanStateCommands({
      base: "stopped",
      setting: "showAllContainers",
      flag: showAllContainers,
      icon: mdiEyeOutline,
      onTitle: t("command-palette.stopped-show"),
      offTitle: t("command-palette.stopped-hide"),
      keywords: "stopped hidden all containers exited",
      onWord: "show",
      offWord: "hide",
    }),
    ...booleanStateCommands({
      base: "std",
      setting: "showStd",
      flag: showStd,
      icon: mdiFormatListBulleted,
      onTitle: t("command-palette.std-show"),
      offTitle: t("command-palette.std-hide"),
      keywords: "stdout stderr std labels stream",
      onWord: "show",
      offWord: "hide",
    }),
    ...booleanStateCommands({
      base: "scrollbars",
      setting: "smallerScrollbars",
      flag: smallerScrollbars,
      icon: mdiUnfoldMoreHorizontal,
      onTitle: t("command-palette.scrollbars-on"),
      offTitle: t("command-palette.scrollbars-off"),
      keywords: "scrollbar smaller thin",
    }),
    // Sidebar collapse is also a boolean, mapped to explicit show/hide. The
    // flag is inverted (collapseNav === hidden) so "show" clears it.
    {
      id: "settings.sidebar-show",
      setting: "collapseNav",
      section: "settings",
      icon: mdiDockLeft,
      title: t("command-palette.sidebar-show"),
      slash: "/sidebar show",
      keywords: "sidebar navigation menu show expand",
      perform: () => (collapseNav.value = false),
    },
    {
      id: "settings.sidebar-hide",
      setting: "collapseNav",
      section: "settings",
      icon: mdiDockLeft,
      title: t("command-palette.sidebar-hide"),
      slash: "/sidebar hide",
      keywords: "sidebar navigation menu hide collapse",
      perform: () => (collapseNav.value = true),
    },
    // The flag is inverted (topBarCollapsed === hidden), so "show" clears it —
    // same shape as the sidebar pair below.
    {
      id: "settings.topbar-show",
      setting: "topBarCollapsed",
      section: "settings",
      icon: mdiDockTop,
      title: t("command-palette.topbar-show"),
      slash: "/topbar show",
      keywords: "top bar stats expand show header",
      perform: () => (topBarCollapsed.value = false),
    },
    {
      id: "settings.topbar-hide",
      setting: "topBarCollapsed",
      section: "settings",
      icon: mdiDockTop,
      title: t("command-palette.topbar-hide"),
      slash: "/topbar hide",
      keywords: "top bar stats collapse hide header widget",
      perform: () => (topBarCollapsed.value = true),
    },
    {
      id: "settings.reset-sidebar-width",
      setting: "menuWidth",
      section: "settings",
      icon: mdiArrowCollapseHorizontal,
      title: t("command-palette.reset-sidebar-width"),
      slash: "/sidebar reset",
      keywords: "sidebar width reset default size",
      perform: () => resetMenuWidth(),
    },
    // Display modes you flip while looking at logs, so they belong on the
    // palette rather than only behind the log view's actions menu.
    ...enumStateCommands({
      base: "font",
      setting: "size",
      value: size,
      icon: mdiFormatSize,
      label: t("command-palette.font-size"),
      keywords: "font size text scale",
      options: [
        { value: "small" as const, word: "small", label: t("settings.size.small") },
        { value: "medium" as const, word: "medium", label: t("settings.size.medium") },
        { value: "large" as const, word: "large", label: t("settings.size.large") },
      ],
    }),
    ...enumStateCommands({
      base: "stats",
      setting: "resourceStatMode",
      value: resourceStatMode,
      icon: mdiMemory,
      label: t("label.cpu-memory"),
      keywords: "cpu memory ram stat display",
      options: [
        { value: "summary" as const, word: "summary", label: t("toolbar.stat-summary") },
        { value: "chart" as const, word: "chart", label: t("toolbar.stat-chart") },
      ],
    }),
    ...enumStateCommands({
      base: "io",
      setting: "ioStatMode",
      value: ioStatMode,
      icon: mdiSwapVertical,
      label: t("label.network-disk"),
      keywords: "network disk io throughput stat display",
      options: [
        { value: "summary" as const, word: "summary", label: t("toolbar.stat-summary") },
        { value: "current" as const, word: "current", label: t("toolbar.stat-current") },
        { value: "chart" as const, word: "chart", label: t("toolbar.stat-chart") },
      ],
    }),
    ...enumStateCommands({
      base: "trend",
      setting: "trendShape",
      value: trendShape,
      icon: mdiChartLine,
      label: t("toolbar.trend-shape"),
      keywords: "trend shape chart graph",
      options: [
        { value: "bars" as const, word: "bars", label: t("toolbar.shape-bars") },
        { value: "line" as const, word: "line", label: t("toolbar.shape-line") },
        { value: "area" as const, word: "area", label: t("toolbar.shape-area") },
      ],
    }),
    ...enumStateCommands({
      base: "table",
      setting: "containerTableStatMode",
      value: containerTableStatMode,
      icon: mdiTable,
      label: t("command-palette.table-stats"),
      keywords: "table container stat column chart meter",
      options: [
        { value: "chart" as const, word: "history", label: t("label.stat-history") },
        { value: "progress" as const, word: "level", label: t("label.stat-level") },
      ],
    }),
    ...enumStateCommands({
      base: "rows",
      setting: "containerTablePageSize",
      value: containerTablePageSize,
      icon: mdiFormatListNumbered,
      label: t("label.per-page"),
      keywords: "rows page size pagination table",
      options: CONTAINER_TABLE_PAGE_SIZES.map((n) => ({ value: n, word: `${n}`, label: `${n}` })),
    }),
    ...enumStateCommands({
      base: "grouping",
      setting: "groupContainers",
      value: groupContainers,
      icon: mdiGroup,
      label: t("command-palette.grouping"),
      keywords: "group namespace stack sidebar",
      options: [
        { value: "always" as const, word: "always", label: t("settings.grouping.always") },
        { value: "at-least-2" as const, word: "auto", label: t("settings.grouping.at-least-2") },
        { value: "never" as const, word: "never", label: t("settings.grouping.never") },
      ],
    }),
    ...enumStateCommands({
      base: "redirect",
      setting: "automaticRedirect",
      value: automaticRedirect,
      icon: mdiSwapHorizontal,
      label: t("command-palette.redirect"),
      keywords: "redirect follow recreate replacement container",
      options: [
        { value: "instant" as const, word: "instant", label: t("settings.redirect.instant") },
        { value: "delayed" as const, word: "delayed", label: t("settings.redirect.delayed") },
        { value: "none" as const, word: "never", label: t("settings.redirect.none") },
      ],
    }),
    ...enumStateCommands({
      base: "hours",
      setting: "hourStyle",
      value: hourStyle,
      icon: mdiClockOutline,
      label: t("command-palette.hour-style"),
      keywords: "hour clock 12 24 time format",
      options: [
        { value: "auto" as const, word: "auto", label: t("settings.hour.auto") },
        { value: "12" as const, word: "12", label: t("settings.hour.12") },
        { value: "24" as const, word: "24", label: t("settings.hour.24") },
      ],
    }),
    // Paired with /hours: the two halves of the same date-and-time row, so
    // covering one and not the other would be an odd place to stop. The value
    // labels are the formats themselves, which need no translating.
    ...enumStateCommands({
      base: "dates",
      setting: "dateLocale",
      value: dateLocale,
      icon: mdiCalendarOutline,
      label: t("command-palette.date-format"),
      keywords: "date format order day month year",
      options: [
        { value: "auto" as const, word: "auto", label: t("settings.hour.auto") },
        { value: "en-US" as const, word: "mdy", label: "MM/DD/YYYY" },
        { value: "en-GB" as const, word: "dmy", label: "DD/MM/YYYY" },
        { value: "de-DE" as const, word: "dot", label: "DD.MM.YYYY" },
        { value: "en-CA" as const, word: "iso", label: "YYYY-MM-DD" },
      ],
    }),
    // Each language names itself, which is the one label that needs no
    // translating and the only one a speaker of it can actually read. Falls back
    // to the bare code if the runtime has no display name for it.
    ...enumStateCommands({
      base: "lang",
      setting: "locale",
      value: locale,
      icon: mdiTranslate,
      label: t("command-palette.language"),
      keywords: "language locale translation i18n",
      options: [
        { value: "", word: "auto", label: t("settings.hour.auto") },
        ...availableLocales.map((code) => ({ value: code, word: code, label: languageName(code) })),
      ],
    }),
    // The one setting whose values are better shown than described, which is
    // why it was left out of the palette at first: nine rows all reading
    // "Accent color: <name>" is a colour picker with the colour removed. The
    // swatch puts it back, so the row is the choice rather than a label for it.
    ...enumStateCommands({
      base: "accent",
      setting: "primaryColor",
      value: primaryColor,
      icon: mdiPalette,
      label: t("settings.accent-color"),
      keywords: "accent colour color primary theme swatch",
      options: PRIMARY_COLORS.map((color) => ({
        value: color.id,
        word: color.name.toLowerCase(),
        label: color.name,
        swatch: color.swatch,
      })),
    }),
    ...booleanStateCommands({
      base: "search",
      setting: "search",
      flag: search,
      icon: mdiMagnify,
      onTitle: t("command-palette.search-on"),
      offTitle: t("command-palette.search-off"),
      keywords: "search find filter shortcut",
      onWord: "on",
      offWord: "off",
    }),
  ];
}

/**
 * Settings the palette deliberately does not expose, and why. A command is for
 * naming a state you want to land in; these are not that.
 */
export const SETTINGS_WITHOUT_COMMANDS = [
  // Direct manipulation. You sort the table by clicking its header, which is
  // both faster and already in front of you.
  "containerTableSortColumn",
  "containerTableSortAsc",
] as const satisfies readonly (keyof Settings)[];

// Central registry for the Cmd+K command palette. Commands are recomputed on
// every access so context-sensitive entries (container actions, scroll targets)
// stay in sync with the route and settings.
export function useCommands() {
  const { t } = useI18n();
  const route = useRoute();
  const containerStore = useContainerStore();
  const { openSettings } = useSettingsModal();
  const { showToast } = useToast();

  const currentId = computed(() =>
    route?.name === "/container/[id]" && typeof route.params.id === "string" ? route.params.id : "",
  );
  // Null-safe: containerStore.currentContainer is a stubbed action under
  // @pinia/testing, so guard against it being absent.
  const currentContainerRef = containerStore.currentContainer?.(currentId);
  const currentContainer = computed(() => currentContainerRef?.value as Container | undefined);

  // Bound to the current container. The cast is safe because the action
  // handlers only read container.value when invoked, and container commands are
  // only pushed into the list when currentContainer is truthy — so the handlers
  // never run against an undefined container.
  const { start, stop, restart, update } = useContainerActions(currentContainer as Ref<Container>);

  const commands = computed<Command[]>(() => {
    const list: Command[] = [];

    const container = currentContainer.value;
    if (container && config.enableActions) {
      const name = container.name;
      list.push({
        id: "container.restart",
        section: "container",
        icon: carbonRestart,
        title: t("command-palette.restart-container", { name }),
        slash: "/restart",
        keywords: "restart reboot",
        perform: restart,
      });
      if (container.state === "running") {
        list.push({
          id: "container.stop",
          section: "container",
          icon: mdiStop,
          title: t("command-palette.stop-container", { name }),
          slash: "/stop",
          keywords: "stop kill halt",
          perform: stop,
        });
      } else {
        list.push({
          id: "container.start",
          section: "container",
          icon: mdiPlay,
          title: t("command-palette.start-container", { name }),
          slash: "/start",
          keywords: "start run",
          perform: start,
        });
      }
      list.push({
        id: "container.update",
        section: "container",
        icon: mdiDownload,
        title: t("command-palette.update-container", { name }),
        slash: "/update",
        keywords: "update pull recreate upgrade",
        perform: update,
      });
    }

    // Scroll targets, only while a log view is mounted. Both are idempotent:
    // "top" always lands on the first line, "bottom" always rejoins the tail.
    if (canScroll.value) {
      list.push(
        {
          id: "navigation.scroll-to-top",
          section: "navigation",
          icon: mdiChevronDoubleUp,
          title: t("command-palette.scroll-to-top"),
          slash: "/scroll top",
          keywords: "scroll top first oldest beginning",
          perform: () => scrollLogsToTop(),
        },
        {
          id: "navigation.scroll-to-bottom",
          section: "navigation",
          icon: mdiChevronDoubleDown,
          title: t("command-palette.scroll-to-bottom"),
          slash: "/scroll bottom",
          keywords: "scroll bottom latest newest tail follow",
          perform: () => scrollLogsToBottom(),
        },
      );
    }

    list.push(
      ...settingCommands(t),
      {
        id: "navigation.settings",
        section: "navigation",
        icon: mdiCogOutline,
        title: t("command-palette.open-settings"),
        slash: "/settings",
        keywords: "settings preferences options config",
        perform: () => openSettings("visual"),
      },
      // Lives here rather than in settingCommands because it drives every
      // setting, not one — and because it needs the toast, which that pure
      // function deliberately has no access to.
      {
        id: "settings.reset-all",
        section: "settings",
        icon: mdiBackupRestore,
        title: t("settings.reset-all"),
        slash: "/settings reset",
        keywords: "reset defaults restore factory clear preferences",
        perform: () => {
          const undo = resetSettings();
          // Undo rather than a confirm: the palette has already closed, so the
          // toast is visible here (it is not, under the settings dialog), and
          // taking it back is one click instead of one more before acting.
          showToast(
            {
              title: t("toasts.settings-reset"),
              message: "",
              type: "info",
              action: { label: t("button.undo"), handler: undo },
            },
            { expire: 8000 },
          );
        },
      },
      {
        id: "navigation.settings-json",
        section: "navigation",
        icon: mdiCodeJson,
        title: t("command-palette.open-settings-json"),
        slash: "/settings json",
        keywords: "settings json edit raw import export config",
        perform: () => openSettings("json"),
      },
    );

    return list;
  });

  // Commands shown before the user types anything: the context-sensitive
  // container actions so e.g. Restart is one keystroke away on a container page.
  const contextCommands = computed(() => commands.value.filter((c) => c.section === "container"));

  return { commands, contextCommands };
}
