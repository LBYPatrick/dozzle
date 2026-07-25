# EXP_FEATURES.md

Fork feature changelog for this repo's `dev` branch, documenting what it adds on
top of the real upstream `amir20/dozzle` `master`.

- **Compared refs:** `dev` (this fork) vs `upstream/master`
- **Merge base:** `5693bcc4`
- **Diff basis:** three-dot (`upstream/master...dev`), i.e. only changes our branch introduces.

The work is a large Apple-HIG UI overhaul of the log viewer plus supporting
command-palette, settings, theming, and dev-tooling changes. Everything below is
verified against the actual diff.

## Summary

- **Commits ahead:** 46
- **Files changed:** 225
- **Lines:** +9717 / -1164 (net +8553)

Roughly split: frontend Vue/TS UI (~95 files) plus a full Storybook suite (106
component stories + `.storybook/` config), locales (16 files, i18n parity), Go
backend (`download.go` + test), a new Go dev tool (`scripts/cloudmock`),
`Makefile`, and regenerated e2e visual snapshots (4 PNGs).

## UI / Top bar

The single biggest theme. The container log view's top bar was reworked into a
floating, collapsible, two-row glass bar following Apple HIG.

- Log area is now a fixed-height internal scroller; the bar and search overlay it
  as glass (backdrop blur), so opening search or collapsing never shifts the
  scroll position or view height.
- **Two-row layout:** row 1 = identity (image tag + container name) + stats
  (network / cpu / memory); row 2 = log status (loading spinner, on-demand scroll
  progress % + date) on the left and controls (search field, actions menu,
  collapse chevron) on the trailing edge. A scroll-progress bar/strip straddles
  the bottom edge of both rows.
- **Collapse-to-widget:** the bar folds into a single floating rounded glass
  CPU/memory pill whose perimeter draws a determinate "circuit" progress ring
  (starts at 12 o'clock, runs clockwise, % shown inline). Clicking it or its
  chevron restores the bar; persisted via a `topBarCollapsed` setting. Switching
  container tabs re-expands a collapsed bar.
- **Progress animation:** row-2 progress readout slides in/out and the bar
  fades when you scroll away from / back to the tail; loading spinner eases its
  width/opacity instead of popping. Real scroll-position progress (how far back
  in time you've scrolled) restored from `scrollContext`.
- Row 2 has a recessed tint + top divider; padding evened out (`px-3 md:px-4`)
  with `min-w-0`/`flex-1` so text shrinks rather than pushing stats off-edge.
- Unified control roundedness via a shared `--control-radius` (search field,
  scroll-button capsule, collapsed widget), replacing pill shapes.
- Key files: `assets/components/ScrollableView.vue` (main rewrite, gains an
  `#actions` slot filled by every viewer), `LogViewer/TopBarStatWidget.vue`,
  `LogViewer/ScrollProgressBar.vue`, `LogViewer/SearchStatus.vue`,
  `common/CircuitRing.vue` (new, indeterminate + determinate rings),
  `composable/liveStatTotals.ts`, `composable/scrollControls.ts`. All viewer
  components (`Container/Host/Group/Service/Stack/K8s/MultiContainer`) updated to
  fill the new `#header` / `#actions` slots.

## Search (in-log, Cmd/Ctrl+F)

- The floating draggable search box is replaced by an integrated search that
  expands from a bar icon in place into an inline field (only width animates, bar
  height never changes, so no reflow / re-blur). Icon turns accent-colored while
  a query is active and spins a circuit ring while a search loads.
- Search status ("N matches · searched back to …") renders inline in row 2 on
  demand (via a shared `activeSearchStatus` ref) instead of as a strip over logs.
- Multi-view correctness: per-view search bars are reference-counted so closing
  one side-by-side column doesn't wipe another column's active search.
- Key files: `assets/components/Search.vue`, `composable/search.ts`,
  `composable/inlineSearch.ts`, `LogViewer/SearchStatus.vue`.

## Command palette (Cmd/Ctrl+K)

The global fuzzy-search modal was extended into a VS Code-style command palette.

- Commands appear alongside container results with unified arrow-key navigation:
  container actions (restart/stop/start/update, gated behind
  `config.enableActions`), settings toggles (theme, compact, timestamps, soft
  wrap, stopped containers, std labels, scrollbars), open settings.
- **Slash commands:** each command has an explicit `/command` (e.g. `/theme dark`,
  `/compact`, `/restart`, `/settings`, `/settings json`, `/sidebar reset`) shown
  dimmed on its row. Typing a leading `/` enters command mode with substring
  autocomplete; `\/` escapes to a literal slash search.
- **Idempotent commands:** every boolean toggle is split into explicit on/off
  pairs (running twice is a no-op, not a flip). Theme split into auto/light/dark.
- Added CPU display (utilization/cores), scroll to top/bottom (gated to log views
  via the `scrollControls` registry), sidebar show/hide, sidebar-width reset.
- Key files: `assets/components/FuzzySearchModal.vue` (+ `.spec.ts`),
  `composable/commands.ts` (new, ~358 lines).

## Settings popup, JSON/visual editor, import/export

- The `/settings` route is **removed entirely** — settings is now only a
  fullscreen in-place popup (dim overlay + glass card). The header gear, sidebar
  gear, and command palette all open it. A router guard opens the popup for any
  lingering `/settings` / `/settings/cloud` URL or bookmark (cancelling in-app
  navigations, redirecting a cold load to the dashboard). Cloud CTAs deep-link to
  the popup's Cloud section via a section target in `useSettingsModal`.
- Settings sections live in a shared `SettingsPanels` component. The top-right
  header bar (home, notifications, cloud-search) is stripped to just the account
  menu: the settings gear, notifications bell, new-version announcements bell, and
  cloud popover all moved into the popup. New-version alerts, the version, and the
  support links are redesigned into the popup's About section via a new
  `Settings/UpdatesCard.vue`. Cloud stays in the Cloud section; notifications
  becomes a section linking to the page. The mobile menu gains a settings gear,
  and the cloud OAuth-return plus WelcomeModal handling moved to the default
  layout. `CloudPopover.vue` and `Announcements.vue` deleted.
- **Secondary drill-in screens** (iOS-settings style — back button, slide-in
  over the main list, tracked as `subview` in `useSettingsModal`): What's New
  (the scrollable release list, `Settings/WhatsNewPanel.vue`) drilled into from
  the About card's nav row, and Notifications (the management UI, extracted into a
  reusable `Notification/NotificationsPanel.vue` shared by the `/notifications`
  route and the popup — destination/alert drawers open over the popup).
- **Visual / JSON toggle:** JSON view uses a lazily-loaded CodeMirror editor with
  an Apply action and live validity feedback. Segmented control toggles the view.
- **Export** settings to clipboard as JSON; **import** from pasted JSON or a URL
  returning `application/json`. Import validates: only known keys with matching
  types are applied, string enums are checked against allowed values, and numeric
  settings (`menuWidth`) are clamped.
- Key files: `assets/components/Settings/SettingsModal.vue` (new),
  `Settings/SettingsPanels.vue` (new, ~324 lines), `common/JsonEditor.vue` (new),
  `composable/settingsModal.ts`, `composable/jsonEditor.ts`,
  `stores/settings.ts` (import/validation logic), `pages/settings.vue`.

## Theming

- Selectable **accent (primary) color** with a swatch picker (teal default + 8
  candidates) that overrides daisyUI's `--color-primary` per theme at runtime;
  tracks light/dark via the theme watcher. Persisted via a new `primaryColor`
  setting; reusable component in the Options section.
- Screen-wide backdrop blur behind the Cmd+K modal dropped in favor of a plain
  dim scrim; glass (backdrop blur) now reserved for container cards / the modal
  card / top bar / settings popup.
- Key files: `assets/components/PrimaryColorPicker.vue` (new),
  `composable/primaryColor.ts` (new).

## Sidebar

- Reworked edge collapse handle: sits flush against the left edge with the UI's
  small corner radius, expands on hover to show a label + shortcut. `Cmd+Ctrl+S`
  toggles the sidebar.
- Added a **settings gear** near the top of the sidebar (cog rotates on hover)
  that opens the in-place settings popup.
- Menu interaction polish on every carousel menu: rows lift on hover, depress on
  click, the active route grows an accent bar, group disclosure chevrons animate.
- On pages without an inline top-bar container search, the sidebar shows one at
  its foot (replacing the carousel title). Reset-width button appears once the
  sidebar has been dragged off its default.
- **Width-consistency fix:** collapsing now drives the pane to zero width (keeping
  it mounted) instead of `v-if` unmounting it, so splitpanes no longer redistribute
  and grow the sidebar on each collapse/expand. Shared `DEFAULT_MENU_WIDTH` /
  `MIN_MENU_WIDTH` constants prevent layout/stored-default drift.
- Key files: `assets/components/SidePanel.vue`, `SideMenu.vue`,
  `assets/layouts/default.vue`.

## Log viewer misc

- **Combined scroll buttons:** "go to top" and "go to bottom" merged into one
  floating glass capsule (tonal weight up, contained weight down). Go-to-top now
  fetches only the oldest window (from container creation date, capped at
  `maxLogs`) instead of lazily loading every line in between; go-to-bottom
  reconnects to the live tail. Extracted `mergeLoadedLogs` helper.
- **CPU display toggle:** opt-in per-core CPU reading (Linux/top style, 100% = one
  core) alongside the default whole-CPU percentage. Applied across container
  table, host cards, and multi-container stat bar via a single `cpuDisplayValue`
  helper. Stored per profile.
- Removed the old `ScrollProgress.vue` (102 lines) in favor of the new
  bar/widget/circuit-ring approach; dropped the fake determinate progress strip.
- Key files: `composable/cpuDisplay.ts` (new), `composable/loadBetween.ts`,
  `composable/logLoader.ts`, `LogViewer/MultiContainerStat.vue`,
  `HostCard.vue`, `ContainerStatCell.vue`.

## Shared UI components (Apple HIG)

- **Toasts:** redesigned as elevated colored glass cards that animate in/out with
  a dismiss progress bar that pauses on hover (timing moved into a per-toast
  `ToastItem`).
- **Dropdowns:** rounded glass panels that spring in, caret flips on open,
  selected row tinted with theme color.
- **iOS switches:** unlayered `.toggle` rules override daisyUI with a solid track
  - sliding white knob; on-state uses the accent color; softened focus ring.
- **Segmented controls:** shared `SegmentedControl` with a sliding, spring-eased
  selected indicator; used for font size, CPU display, color scheme, and the
  settings visual/JSON toggle.
- Key files: `common/ToastItem.vue` (new), `common/ToastModal.vue`,
  `common/DropdownMenu.vue`, `common/SegmentedControl.vue` (new),
  `common/CircuitRing.vue` (new), `assets/main.css`.

## Cloud / dev tooling

- **`scripts/cloudmock/main.go`** (new): a tiny Go reverse proxy that fakes the
  `/api/cloud/*` endpoints (config/status, linked + pro + streaming state, and
  canned paginated log search at `/api/cloud/search/logs`) and proxies everything
  else to the dev backend, so the cloud UIs can be play-tested without a real
  cloud account. Search hits carry nanosecond timestamps to match the real
  `SearchLogHit` API contract.
- **`/cloud/search` redesign** (`assets/pages/cloud/search.vue`): the results view
  no longer scrolls the page; the table scrolls internally under a pinned header.
  Columns are sortable with a three-state header cycle (ascending -> descending ->
  default server order). Level chips are tonal (no outline) and follow the app's
  level palette; the container column matches the Time column's mono/xs
  typography; every row has a trailing chevron and opens a right-side drawer.
- **`LogViewer/CloudLogDetails.vue`** (new): the drawer panel for a cloud hit.
  Reuses the shared `SideDrawer` and mirrors the normal `LogDetails` layout
  (level tag + timestamp header, container/host/image grid) but renders the log
  message in a read-only CodeMirror, and works for hits whose container no longer
  exists locally (offering a live-logs deep link when it does).
- **`PageWithLinks` `fill` mode**: opt-in full-height, non-scrolling page layout
  (used by the cloud search page) where the child owns scrolling.

## Backend (Go)

- **Inverse download filter** (`internal/web/download.go`): log downloads now honor
  the inverse search filter. Previously the regex was always applied as an include
  filter even when inverse mode was on; now `inverse == Search(regex, event)`
  skips the line, so inverse mode excludes matches.
- Added `internal/web/download_test.go` (new, ~57 lines) covering the filter.

## i18n

- New settings-popup / command-palette / button / placeholder strings added to
  **all 16 locales** (`locales/*.yml`, +54 lines each): visual/JSON views, import,
  export, apply and their toasts, primary-color label, etc. Achieves 417-key
  parity across every locale so nothing falls back to English.

## Accessibility & polish fixes

- **Accent contrast (WCAG):** the accent (primary) colors are all mid-to-light
  (L ~69-80%), so near-white `--color-primary-content` failed WCAG AA on primary
  buttons/badges (worst on light mode). Switched primary-content to dark text,
  which clears AA on every swatch in both themes (`main.css`, `primaryColor.ts`).
- **Sidebar menu hover clipping:** rows translate 3px on hover and the active row
  draws an accent bar in the left gutter; the carousel's `overflow-x` (for
  snap-scrolling) was clipping both. Padded the carousel slides so they render.
- **Collapsed-sidebar search:** the `fixed` sidebar doesn't clip overflow, so the
  foot search could linger past the zero-width collapsed pane; gated on
  `!collapseNav` and allowed to shrink.

## Storybook

- **Full Storybook 10 suite** (`.storybook/` + `make storybook` /
  `storybook-build`). The vue3-vite framework auto-loads the project's
  `vite.config.ts`, so VueMacros/vue, auto-imports, icons, i18n, Tailwind and
  svg-loader all apply unchanged. The preview installs Pinia, vue-i18n and a
  stubbed vue-router, seeds the app `config` via `preview-head.html`, imports
  `main.css`, and adds a light/dark theme toggle (addon-themes, `data-theme`).
- **A co-located `.stories.ts` for all 106 components** (common, LogViewer,
  Notification, Settings, ContainerViewer, per-mode viewers, top-level widgets),
  CSF3 + `satisfies Meta`, with real model instances where practical. Verified:
  `pnpm typecheck` clean and `storybook build` green (823 modules).

## Tests & snapshots

- Regenerated Playwright visual snapshots (4 PNGs under
  `e2e/visual.spec.ts-snapshots/`) for the sidebar handle and the reserved
  scrollbar gutter.
- Frontend spec updates: `FuzzySearchModal.spec.ts` (command palette),
  `LogViewer/SearchStatus.spec.ts`, `LogViewer/EventSource.spec.ts` (+ snapshot).

## Build / Makefile

- New default `help` goal: `make help` documents every target with args and
  examples (setup, dev, build, test, run/deploy sections).
- New `make cloud-mock` target: runs the cloud mock proxy on `:3200` (proxies the
  `make dev` backend on `:3100`).
- New `make storybook` / `make storybook-build` targets.

## Misc

- `.claude/agent-memory/bug-hunter/` notes (MEMORY.md, frontend-patterns.md) added
  — internal agent scratch memory, not user-facing.
- Clipboard/accessibility/mobile polish batch (`e15ef2a0`): theme-aware ghost
  button hover ring, white level-chip labels on light theme, reserved document
  scrollbar gutter to stop splitpanes flicker, padded mobile top nav via
  `--mobile-nav-height`, legacy clipboard fallback for non-secure (http) origins,
  click-to-copy image tag.
