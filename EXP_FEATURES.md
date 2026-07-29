# EXP_FEATURES.md

Fork feature changelog for this repo's `dev` branch, documenting what it adds on
top of the real upstream `amir20/dozzle` `master`.

- **Compared refs:** `dev` (this fork) vs `upstream/master`
- **Merge base:** `03011eea` (upstream merged into `dev` on 2026-07-27)
- **Diff basis:** three-dot (`upstream/master...dev`), i.e. only changes our branch introduces.

The work is a large Apple-HIG UI overhaul of the log viewer plus supporting
command-palette, settings, theming, and dev-tooling changes. Everything below is
verified against the actual diff.

## Summary

- **Commits ahead:** 61
- **Files changed:** 275
- **Lines:** +14204 / -2672 (net +11532)

Upstream has since shipped its own command palette and `copy-image` action, so
that ground is no longer unique to this fork even though the fork's
implementations were kept.

Roughly split: frontend Vue/TS UI (121 files) plus a full Storybook suite (111
component stories + `.storybook/` config), locales (16 files, i18n parity), Go
backend (`download.go` + test), a new Go dev tool (`scripts/cloudmock`),
`Makefile`/CI, and regenerated e2e visual snapshots (2 PNGs).

## Upstream merges

`upstream/master` was merged in at `03011eea` (12 commits, including two security
fixes for GHSA-p66q-2gfp-8v55 and a move to tsgo for type-checking). 28 files
conflicted; how each was settled:

- **Command palette** — both sides built one independently. The fork's was kept:
  it covers every upstream command plus 14 more, and its commands are idempotent
  (`compact-on` / `compact-off`) where upstream's are bare toggles. All 16
  locales resolved the same way; upstream's six `toggle-*` keys are dropped as
  unreferenced.
- **`html { scrollbar-gutter: stable }`** — the fork's, i.e. the rule is dropped.
  It was briefly taken from upstream during this merge, which reverted the fork's
  own fix and put back a dead strip to the right of the log view's scrollbar: the
  log view is a fixed-height internal scroller, so the document never scrolls and
  the reserved gutter is never used. The gutter lives on `ScrollableView`'s
  `<main>` alone.
- **`ScrollableView.vue`, `default.vue`, settings/search surfaces** — the fork's,
  which supersede the upstream versions wholesale.
- **`Links.vue`** — the fork's structure, keeping upstream's `data-testid` so
  their new e2e specs still bind.
- **Generated files** (`auto-imports.d.ts`, `components.d.ts`) regenerated;
  `pnpm-lock.yaml` taken from upstream and reinstalled.
- **e2e visual snapshots** kept as the fork's. They are stale either way and need
  `make int` to regenerate against this UI.

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

- **Stat widgets rebuilt** (`LogViewer/StatSummaryCard.vue`, replacing `StatCard.vue`):
  one component in two forms for each metric pair (CPU+memory, network+disk).
  Expanded puts the metrics side by side so each trend gets the card's full
  height, headed `NOW` / `MAX` / `AVAIL`. Headings and values share one grid, so
  alignment is structural rather than tuned.
- **Compact form is a table, not a picture.** One line per metric — name, the
  live figure, the ceiling — and nothing drawn. The meter bar and its peak tick
  are gone: a fill that animates its width every tick is movement in a readout
  meant to be read at a glance, and the ceiling it encoded is already written out
  beside it.
- Every track is content-sized — the card is exactly as wide as what it says.
  Reserving room for the widest possible figure is how the design grew dead space
  twice over (a hole mid-card from fixed value tracks, a dead right edge from a
  `min-width` floor), so nothing holds space for digits that are not on screen: a
  stopped container's card collapses to the width of `N/A / 18 CPU`. Tabular
  numerals keep the per-tick case still (verified in Storybook: same-digit ticks
  and a shrinking CPU figure both hold the card at 185px, since the wider memory
  figure anchors the shared column); only a figure crossing a digit boundary
  moves it, by one glyph. Throughput values swing across magnitudes every second,
  so their column alone keeps a small floor.
- Clicking a widget cycles its form; throughput also keeps its per-direction live
  rate. Each widget sits in a slot that animates its own width across the change
  (`composable/animatedWidth.ts` — CSS cannot transition `width: auto`).
- Trends render as bars, a line, or a filled area (`trendShape` setting), all from
  one downsampled series in `BarChart.vue`. No charting dependency.
- Stopped containers report `N/A` through the same layout rather than a column of
  zeros; the ceiling still reports, being a property of the host.
- Bar row 1 is pinned to a constant height so switching form never shifts the page.

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
  `LogViewer/SearchStatus.vue`.

- **Search state is now per log view**, keyed off the logging context each view
  already provides. Side-by-side columns search independently — previously one
  module-level singleton filtered every pane at once. Status line and loading
  indicator are per view too.
- `Cmd/Ctrl+F` resolves to the pane under the pointer (via the browser's own
  `:hover`), falling back to the main pane. It also re-focuses and selects an
  already-open field, which previously did nothing.
- Debounce raised from VueUse's 200ms default to an explicit 400ms: each distinct
  value reconnects the stream and rebuilds the visible window.

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
  `stores/settings.ts` (import/validation logic). The old `pages/settings.vue`
  route (325 lines) is deleted — settings live in the modal now.

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
  its foot. Resetting the width is a quick command (`/sidebar reset`) rather than
  a button, always offered and a no-op at the default.
- **The carousel caption is gone** (`Hosts and Containers` and friends). With one
  panel it named the only thing on screen; with several, the panel dots already
  carry each name as their tooltip and accessible name. The `hideTitle` prop that
  existed solely to suppress it went with it — nothing but stories ever set it.
- **Width-consistency fix:** collapsing now drives the pane to zero width (keeping
  it mounted) instead of `v-if` unmounting it, so splitpanes no longer redistribute
  and grow the sidebar on each collapse/expand. Shared `DEFAULT_MENU_WIDTH` /
  `MIN_MENU_WIDTH` constants prevent layout/stored-default drift.
- Key files: `assets/components/SidePanel.vue`, `SideMenu.vue`,
  `assets/layouts/default.vue`.

- **Reworked into a single folder-style outline:** host group -> host -> container
  group -> container. The separate hosts pane is gone; hosts are collapsible
  branches. Every level uses the same type size, with depth carried by
  indentation and a hairline guide rather than shrinking labels.
- New pieces: `common/MenuSection.vue` (one collapsible node), `HostNode.vue`,
  `ContainerMenuItem.vue`, `composable/containerGroups.ts`, and
  `composable/collapsedSections.ts` (all collapse state in one prefix-namespaced
  persisted set, replacing four ad-hoc keys).
- Swarm, Kubernetes and custom-group menus adopt the same outline.
- The merge action sits on the group rows rather than the host row.
- **Overflow fix:** daisyUI sizes `.menu` to fit-content, so rows grew past the
  sidebar and put their trailing controls (merge, pin-as-column) on top of the
  main pane, unclickable. Every level is width-pinned; nested lists use
  `width: auto` so the indent margin does not compound.
- Search moved to the head of the pane; the dashboard's own search bar and the
  `hasInlineSearch` mechanism are gone.

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

- **Log row alignment:** a shared `--log-line` box height anchors the level dot,
  std/host/container tags and timestamp to the row's first text line.
  `ComplexLogItem` switched from `space-x-*` to `gap` so wrapped rows stop
  indenting by one gap.
- **Performance:** the SSE buffer no longer copies itself per incoming line
  (quadratic over a reconnect's backfill); `useLoggingContext` memoizes its
  `toRefs`; each row's action menu is built on first hover instead of eagerly.
  `useVisibleFilter` caches derived entries per visible-keys ref and walks values
  for the search highlight instead of `JSON.stringify`-ing every field — together
  these are what made a stdout/stderr toggle or a search on a long log lock up.
- `ZigZag.vue` removed; the skipped-entries marker is now a faded rule broken by
  the button that fills the gap back in.

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

- **`common/DataTable.vue`** — one table shell (sticky recessed header, sort
  interaction) shared by the container table and cloud search results.
- **`common/TextField.vue`** — the app's text field: leading affordance that takes
  the accent on focus, inline clear button, transitioned hover/focus states.
- **`.glass-surface`** in `main.css` — one definition of the app's glass, used by
  the action menus and the settings popup. Note: `backdrop-filter` only samples
  outside the nearest ancestor that has one, so the log bar's own glass moved to
  a dedicated layer to stop it blanking the menus inside it.
- **Segmented control** — raised full-contrast capsule on a recessed track.
- **Resize dividers** (sidebar and pinned columns) — iPad-style: a hairline
  carrying an opaque capsule grabber, visible at rest, thickening on approach and
  taking the accent while dragging. The splitter occupies only the 1px it paints;
  the ~11px drag target overflows symmetrically into both panes rather than
  reserving width, so the panes meet at the hairline instead of straddling an
  empty 12px channel. It sits above the log top bar so the handle stays grabbable
  along its full height.
- **Buttons** converge on one glass treatment and `--control-radius`; outline
  variants render tonal.

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

- **Ghost button text contrast:** daisyUI dims the label as well as the surface,
  measuring 2.68:1 against a light panel (AA needs 4.5). Ghost buttons are now
  quiet by surface only — measured 8.68:1. Buttons carrying an explicit `text-*`
  colour keep it.
- **Shadows** use a dark ink token instead of a `base-content` tint, which
  rendered as a glow on the dark theme.
- `formatBytes` returned `undefined` for fractional and non-finite input, and its
  short form rendered a megabyte as `1.6M`; both fixed.

## Storybook

- **Full Storybook 10 suite** (`.storybook/` + `make storybook` /
  `storybook-build`). The vue3-vite framework auto-loads the project's
  `vite.config.ts`, so VueMacros/vue, auto-imports, icons, i18n, Tailwind and
  svg-loader all apply unchanged. The preview installs Pinia, vue-i18n and a
  stubbed vue-router, seeds the app `config` via `preview-head.html`, imports
  `main.css`, and adds a light/dark theme toggle (addon-themes, `data-theme`).
- **A co-located `.stories.ts` for all 111 components** (common, LogViewer,
  Notification, Settings, ContainerViewer, per-mode viewers, top-level widgets),
  CSF3 + `satisfies Meta`, with real model instances where practical. Verified:
  `pnpm typecheck` clean and `storybook build` green (823 modules).

## Tests & snapshots

- Regenerated Playwright visual snapshots (2 PNGs under
  `e2e/visual.spec.ts-snapshots/`) for the light and dark homepage.
- Frontend spec updates: `FuzzySearchModal.spec.ts` (command palette),
  `LogViewer/SearchStatus.spec.ts`, `LogViewer/EventSource.spec.ts` (+ snapshot).

- `assets/composable/visible.spec.ts` — covers the search-highlight filter and
  the derived-entry caching that keeps the log list from rebuilding every flush.
- `MultiContainerStat.spec.ts` extended for the compact/expanded stat forms.

## Build / Makefile / CI

- New default `help` goal: `make help` documents every target with args and
  examples (setup, dev, build, test, run/deploy sections).
- New `make cloud-mock` target: runs the cloud mock proxy on `:3200` (proxies the
  `make dev` backend on `:3100`).
- New `make storybook` / `make storybook-build` targets.
- New `.github/workflows/exp.yml`: the fork's own release channel. Pushes to the
  `exp` branch (and manual dispatch) build `linux/amd64` + `linux/arm64/v8` and
  publish to this owner's Docker Hub and GHCR namespaces, tagged `exp` and
  `exp-<sha7>`. Needs `DOCKER_USERNAME` / `DOCKER_PASSWORD` repo secrets;
  `DOCKERHUB_IMAGE` repo variable overrides the Docker Hub repo. Falls back to
  generating `shared_{key,cert}.pem` when `TTL_KEY` / `TTL_CERT` are unset, in
  which case server and agent images must come from the same build.
- New `make dockerhub-overview` (`scripts/dockerhub_overview.py`): publishes the
  Docker Hub listing, composed from `.github/dockerhub-overview.md` plus this
  file, so the Hub page is generated from the repo. It runs locally rather than
  in CI because Docker Hub's repository API refuses personal access tokens
  outright, and a JWT minted from a PAT comes back scoped too low to edit a
  description; only a Docker Desktop web-login session carries account scope.
  The workflow still composes the page, uploads it as an artifact, and syncs it
  when a `DOCKERHUB_DESCRIPTION_PASSWORD` secret exists.
- Upstream's `dev.yml` and `deploy.yml` are left untouched so merges stay clean;
  their fork guard already makes them no-ops here.
- Removed `.github/workflows/claude.yml` and `claude-code-review.yml`.

## Misc

- `.claude/agent-memory/bug-hunter/` notes (MEMORY.md, frontend-patterns.md) added
  — internal agent scratch memory, not user-facing.
- Clipboard/accessibility/mobile polish batch (`e15ef2a0`): theme-aware ghost
  button hover ring, white level-chip labels on light theme, padded mobile top nav via
  `--mobile-nav-height`, legacy clipboard fallback for non-secure (http) origins,
  click-to-copy image tag.
