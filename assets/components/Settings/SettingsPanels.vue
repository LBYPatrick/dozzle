<template>
  <div class="@container flex flex-col gap-8">
    <!-- ABOUT / UPDATES (was the top-right announcements bell) -->
    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">{{ $t("settings.about") }}</h2>
        <p class="text-base-content/60 mt-1 text-sm">{{ $t("settings.about-desc") }}</p>
      </div>
      <UpdatesCard />
    </section>

    <!-- CLOUD (was the top-right cloud popover) -->
    <section id="settings-cloud" class="flex scroll-mt-4 flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">{{ $t("cloud.title") }}</h2>
        <p class="text-base-content/60 mt-1 text-sm">{{ $t("settings.cloud-desc") }}</p>
      </div>
      <CloudSettingsCard />
    </section>

    <!-- NOTIFICATIONS (was the top-right bell link) -->
    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">{{ $t("notifications.title") }}</h2>
        <p class="text-base-content/60 mt-1 text-sm">{{ $t("notifications.description") }}</p>
      </div>
      <button
        type="button"
        class="drill-in border-base-content/15 bg-base-200/40 hover:border-base-content/30 flex items-center gap-3 rounded-lg border p-4 text-left"
        @click="openSubview('notifications')"
      >
        <mdi:bell-outline class="text-base-content/60 size-6 shrink-0" />
        <span class="text-base-content/80 flex-1 text-sm font-medium">{{ $t("settings.open-notifications") }}</span>
        <!-- Leans toward the screen it pushes, so the row hints at the
             direction the transition will actually travel. -->
        <mdi:chevron-right class="chevron text-base-content/40 size-5 shrink-0" />
      </button>
    </section>

    <!-- DISPLAY -->
    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">{{ $t("settings.display") }}</h2>
        <p class="text-base-content/60 mt-1 text-sm">{{ $t("settings.display-desc") }}</p>
      </div>

      <div class="grid items-stretch gap-3 @3xl:grid-cols-2">
        <div class="settings-group border-base-content/15 bg-base-200/40 overflow-hidden rounded-lg border">
          <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
            {{ $t("settings.compact") }}
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="compact" />
          </label>
          <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
            {{ $t("settings.small-scrollbars") }}
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="smallerScrollbars" />
          </label>
          <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
            {{ $t("settings.show-timestamps") }}
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="showTimestamp" />
          </label>
          <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
            {{ $t("settings.show-std") }}
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="showStd" />
          </label>
          <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
            {{ $t("settings.soft-wrap") }}
            <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="softWrap" />
          </label>
          <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
            <span>{{ $t("settings.datetime-format") }}</span>
            <div class="ml-auto flex flex-wrap gap-2">
              <DropdownMenu
                v-model="dateLocale"
                :options="[
                  { label: 'Auto', value: 'auto' },
                  { label: 'MM/DD/YYYY', value: 'en-US' },
                  { label: 'DD/MM/YYYY', value: 'en-GB' },
                  { label: 'DD.MM.YYYY', value: 'de-DE' },
                  { label: 'YYYY-MM-DD', value: 'en-CA' },
                ]"
              />
              <DropdownMenu
                v-model="hourStyle"
                :options="[
                  { label: $t('settings.hour.auto'), value: 'auto' },
                  { label: $t('settings.hour.12'), value: '12' },
                  { label: $t('settings.hour.24'), value: '24' },
                ]"
              />
            </div>
          </div>
          <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
            <span>{{ $t("settings.font-size") }}</span>
            <SegmentedControl
              class="ml-auto"
              v-model="size"
              :options="[
                { label: $t('settings.size.small'), value: 'small' },
                { label: $t('settings.size.medium'), value: 'medium' },
                { label: $t('settings.size.large'), value: 'large' },
              ]"
            />
          </div>
          <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
            <span>{{ $t("settings.cpu-display") }}</span>
            <SegmentedControl
              class="ml-auto"
              v-model="cpuDisplayMode"
              :options="[
                { label: $t('settings.cpu.utilization'), value: 'utilization' },
                { label: $t('settings.cpu.cores'), value: 'cores' },
              ]"
            />
          </div>
        </div>

        <LogList
          :messages="fakeMessages"
          :last-selected-item="undefined"
          :show-container-name="false"
          class="border-base-content/15 hidden h-full overflow-hidden rounded-lg border @3xl:block"
        />
      </div>
    </section>

    <!-- OPTIONS -->
    <section class="flex flex-col gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight">{{ $t("settings.options") }}</h2>
        <p class="text-base-content/60 mt-1 text-sm">{{ $t("settings.options-desc") }}</p>
      </div>

      <div class="settings-group border-base-content/15 bg-base-200/40 overflow-hidden rounded-lg border">
        <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
          <span>{{ $t("settings.locale") }}</span>
          <DropdownMenu
            class="ml-auto"
            v-model="locale"
            :options="[
              { label: 'Auto', value: '' },
              ...availableLocales.map((l) => ({ label: l.toLocaleUpperCase(), value: l })),
            ]"
          />
        </div>
        <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
          <span>{{ $t("settings.color-scheme") }}</span>
          <SegmentedControl
            class="ml-auto"
            v-model="lightTheme"
            :options="[
              { label: $t('settings.theme.light'), value: 'light' },
              { label: $t('settings.theme.dark'), value: 'dark' },
              { label: $t('settings.theme.auto'), value: 'auto' },
            ]"
          />
        </div>
        <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
          <span>{{ $t("settings.accent-color") }}</span>
          <PrimaryColorPicker class="ml-auto" />
        </div>
        <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
          <span>{{ $t("settings.automatic-redirect") }}</span>
          <DropdownMenu
            class="ml-auto"
            v-model="automaticRedirect"
            :options="[
              { label: $t('settings.redirect.instant'), value: 'instant' },
              { label: $t('settings.redirect.delayed'), value: 'delayed' },
              { label: $t('settings.redirect.none'), value: 'none' },
            ]"
          />
        </div>
        <div class="flex min-h-13 flex-wrap items-center justify-between gap-3 p-4 text-sm font-medium">
          <span>{{ $t("settings.group-containers") }}</span>
          <DropdownMenu
            class="ml-auto"
            v-model="groupContainers"
            :options="[
              { label: $t('settings.grouping.always'), value: 'always' },
              { label: $t('settings.grouping.at-least-2'), value: 'at-least-2' },
              { label: $t('settings.grouping.never'), value: 'never' },
            ]"
          />
        </div>
        <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
          <span class="inline-flex items-center gap-2">
            {{ $t("settings.search") }}
            <key-shortcut char="f" />
          </span>
          <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="search" />
        </label>
        <label class="flex min-h-13 items-center justify-between gap-4 p-4 text-sm font-medium">
          {{ $t("settings.show-stopped-containers") }}
          <input type="checkbox" class="toggle toggle-primary toggle-sm" v-model="showAllContainers" />
        </label>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ComplexLogEntry, SimpleLogEntry, GroupedLogEntry } from "@/models/LogEntry";

import {
  automaticRedirect,
  compact,
  hourStyle,
  dateLocale,
  lightTheme,
  search,
  showAllContainers,
  showStd,
  showTimestamp,
  size,
  smallerScrollbars,
  softWrap,
  locale,
  groupContainers,
  cpuDisplayMode,
} from "@/stores/settings";

import { availableLocales, i18n } from "@/modules/i18n";
import { useSettingsModal } from "@/composable/settingsModal";

const { t } = useI18n();

// Notifications and What's New open as secondary drill-in screens of the popup.
const { openSubview } = useSettingsModal();

const now = new Date();
const hoursAgo = (hours: number) => {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);
  return date;
};

const fakeMessages = computedWithControl(
  () => i18n.global.locale.value,
  () => [
    new SimpleLogEntry(t("settings.log.preview"), "123", 1, hoursAgo(16), "info", "stdout", ""),
    new SimpleLogEntry(t("settings.log.warning"), "123", 2, hoursAgo(12), "warn", "stdout", ""),
    new GroupedLogEntry(
      [
        t("settings.log.multi-line-error.start-line"),
        t("settings.log.multi-line-error.middle-line"),
        t("settings.log.multi-line-error.end-line"),
      ],
      "123",
      3,
      hoursAgo(7),
      "error",
      "stderr",
    ),
    new ComplexLogEntry(
      {
        message: t("settings.log.complex"),
        context: {
          key: "value",
          key2: "value2",
        },
      },
      "123",
      6,
      new Date(),
      "info",
      "stdout",
      "",
    ),
    new SimpleLogEntry(t("settings.log.simple"), "123", 7, new Date(), "debug", "stderr", ""),
  ],
);
</script>

<style scoped>
@reference "@/main.css";

/* Grouped list, Apple's shape. Two things distinguish it from a stack of
   bordered divs, and `divide-y` gets both wrong.

   First, the separator is inset to the leading text edge rather than run wall
   to wall. Full-bleed rules cut the group into slices; an inset rule reads as
   one card with rows in it, and the indent points at where each row's label
   starts.

   Second, a row you can operate has to respond to being pressed. The <label>
   rows toggle from anywhere along their length — that was already true and
   nothing on screen said so, so the whole row was a hit target that looked
   like text. */
.settings-group > * + * {
  position: relative;
}

.settings-group > * + *::before {
  content: "";
  position: absolute;
  top: 0;
  inset-inline: 1rem 0;
  height: 1px;
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
}

.settings-group label {
  @apply cursor-pointer;
  transition: background-color 150ms ease;
}

.settings-group label:hover {
  @apply bg-base-content/4;
}

/* On the press, not on the release — the toggle's own animation covers the
   release, and by then the confirmation is late. */
.settings-group label:active {
  @apply bg-base-content/8;
}

.drill-in {
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    transform 120ms cubic-bezier(0.32, 0.72, 0, 1);
}

.drill-in:active {
  @apply bg-base-content/5;
  transform: scale(0.99);
}

.drill-in .chevron {
  transition: transform 180ms cubic-bezier(0.32, 0.72, 0, 1);
}

.drill-in:hover .chevron {
  transform: translateX(2px);
}

@media (prefers-contrast: more) {
  .settings-group > * + *::before {
    background-color: color-mix(in oklab, var(--color-base-content) 35%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .settings-group label,
  .drill-in .chevron {
    transition: none;
  }

  .drill-in {
    transition:
      border-color 150ms ease,
      background-color 150ms ease;
  }

  .drill-in:active,
  .drill-in:hover .chevron {
    transform: none;
  }
}

:deep(.text-base-content\/60 a:not(.btn)),
:deep(.text-base-content\/70 a:not(.btn)) {
  @apply text-primary;
}
:deep(.text-base-content\/60 a:not(.btn):hover),
:deep(.text-base-content\/70 a:not(.btn):hover) {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
