import type { Component } from "vue";
import type { Ref } from "vue";
import { Container } from "@/models/Container";
import { useContainerActions } from "@/composable/containerActions";
import { canScroll, scrollLogsToTop, scrollLogsToBottom } from "@/composable/scrollControls";
import config from "@/stores/config";
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
  canResetMenuWidth,
  resetMenuWidth,
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
import mdiChip from "~icons/mdi/chip";
import mdiChevronDoubleUp from "~icons/mdi/chevron-double-up";
import mdiChevronDoubleDown from "~icons/mdi/chevron-double-down";
import mdiDockLeft from "~icons/mdi/dock-left";
import mdiArrowCollapseHorizontal from "~icons/mdi/arrow-collapse-horizontal";
import carbonRestart from "~icons/carbon/restart";
import mdiStop from "~icons/mdi/stop";
import mdiPlay from "~icons/mdi/play";
import mdiDownload from "~icons/mdi/download";

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
  perform: () => unknown;
};

// Every command sets an explicit final state so it is idempotent: running it
// twice leaves the app in the same place. That rules out bare toggles, so each
// boolean setting is exposed as an on/off pair instead of a single flip. This
// helper builds that pair from one declaration to keep the registry DRY.
function booleanStateCommands(opts: {
  base: string; // slash + id stem, e.g. "compact" -> "/compact on|off"
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
      perform: () => (opts.flag.value = true),
    },
    {
      id: `settings.${opts.base}-${off}`,
      section: "settings",
      icon: opts.icon,
      title: opts.offTitle,
      slash: `/${opts.base} ${off}`,
      keywords: opts.keywords,
      perform: () => (opts.flag.value = false),
    },
  ];
}

// Central registry for the Cmd+K command palette. Commands are recomputed on
// every access so context-sensitive entries (container actions, scroll targets)
// stay in sync with the route and settings.
export function useCommands() {
  const { t } = useI18n();
  const router = useRouter();
  const route = useRoute();
  const containerStore = useContainerStore();

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
      // lightTheme is tri-state, so expose each value as its own command rather
      // than a single toggle — that keeps "auto" (follow OS) reachable and makes
      // the target theme explicit instead of depending on the current state.
      {
        id: "settings.theme-auto",
        section: "settings",
        icon: mdiThemeLightDark,
        title: t("command-palette.theme-auto"),
        slash: "/theme auto",
        keywords: "theme auto system color mode appearance",
        perform: () => (lightTheme.value = "auto"),
      },
      {
        id: "settings.theme-light",
        section: "settings",
        icon: mdiWhiteBalanceSunny,
        title: t("command-palette.theme-light"),
        slash: "/theme light",
        keywords: "theme light color mode appearance",
        perform: () => (lightTheme.value = "light"),
      },
      {
        id: "settings.theme-dark",
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
        section: "settings",
        icon: mdiChip,
        title: t("command-palette.cpu-utilization"),
        slash: "/cpu utilization",
        keywords: "cpu utilization percent whole processor usage",
        perform: () => (cpuDisplayMode.value = "utilization"),
      },
      {
        id: "settings.cpu-cores",
        section: "settings",
        icon: mdiChip,
        title: t("command-palette.cpu-cores"),
        slash: "/cpu cores",
        keywords: "cpu cores per-core top processor usage",
        perform: () => (cpuDisplayMode.value = "cores"),
      },
      ...booleanStateCommands({
        base: "compact",
        flag: compact,
        icon: mdiFormatLineSpacing,
        onTitle: t("command-palette.compact-on"),
        offTitle: t("command-palette.compact-off"),
        keywords: "compact density spacing",
      }),
      ...booleanStateCommands({
        base: "timestamps",
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
        flag: softWrap,
        icon: mdiWrap,
        onTitle: t("command-palette.soft-wrap-on"),
        offTitle: t("command-palette.soft-wrap-off"),
        keywords: "wrap soft line",
      }),
      ...booleanStateCommands({
        base: "stopped",
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
        section: "settings",
        icon: mdiDockLeft,
        title: t("command-palette.sidebar-show"),
        slash: "/sidebar show",
        keywords: "sidebar navigation menu show expand",
        perform: () => (collapseNav.value = false),
      },
      {
        id: "settings.sidebar-hide",
        section: "settings",
        icon: mdiDockLeft,
        title: t("command-palette.sidebar-hide"),
        slash: "/sidebar hide",
        keywords: "sidebar navigation menu hide collapse",
        perform: () => (collapseNav.value = true),
      },
      {
        id: "navigation.settings",
        section: "navigation",
        icon: mdiCogOutline,
        title: t("command-palette.open-settings"),
        slash: "/settings",
        keywords: "settings preferences options config",
        perform: () => router.push("/settings"),
      },
    );

    // Resetting the sidebar width is only meaningful once it has been dragged
    // off the default, so gate it the same way the (now removed) button was.
    if (canResetMenuWidth.value) {
      list.push({
        id: "settings.reset-sidebar-width",
        section: "settings",
        icon: mdiArrowCollapseHorizontal,
        title: t("command-palette.reset-sidebar-width"),
        slash: "/sidebar reset",
        keywords: "sidebar width reset default size",
        perform: () => resetMenuWidth(),
      });
    }

    return list;
  });

  // Commands shown before the user types anything: the context-sensitive
  // container actions so e.g. Restart is one keystroke away on a container page.
  const contextCommands = computed(() => commands.value.filter((c) => c.section === "container"));

  return { commands, contextCommands };
}
