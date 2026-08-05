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

- **Commits ahead:** 71
- **Files changed:** 293
- **Lines:** +16362 / -3033 (net +13329)

Upstream has since shipped its own command palette and `copy-image` action, so
that ground is no longer unique to this fork even though the fork's
implementations were kept.

Roughly split: frontend Vue/TS UI (144 files) plus a full Storybook suite (113
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

## Command palette (Cmd/Ctrl+Shift+P)

- **Brought up to parity with the settings surface.** The palette covered nine
  preferences out of twenty-six; every display mode added since — font size,
  CPU/memory and network/disk stat modes, trend shape, the container table's stat
  rendering and page size, container grouping, auto-redirect, hour and date
  format, in-log search, the collapsible stat bar — was reachable only by opening
  Settings or a view's own menu. All are commands now: 23 of 26 settings, with
  the remaining three named and justified in `SETTINGS_WITHOUT_COMMANDS` (locale
  is an open-ended value space; table sort is direct manipulation you do by
  clicking the header).
- **Reset all settings**, on both surfaces, with a different safety net on each
  because the surfaces differ. The panel arms a two-step confirm; a toast would
  be invisible there, since the settings sheet is a `<dialog>` and therefore in
  the browser's top layer, which the toast layer cannot rise above however high
  its z-index. The palette has already closed by the time its toast appears, so
  it offers a plain Undo instead — one click to take it back rather than one
  more before acting. `resetSettings()` returns the undo closure rather than
  just resetting, which is what lets the two callers differ.
- **`ToastItem` gained a non-timed action button.** `TimedButton` is for
  something about to happen unless you stop it; Undo is for something already
  done, so it renders as a plain button beside the close.
- **Titles are composed from the labels the settings UI already uses** —
  `"CPU & memory" + "Trend chart"` — so a new command needs no new translation
  and the palette can never describe a setting differently from the panel that
  owns it. Only short group labels that did not already exist were added
  (10 keys, 16 locales).
- **Colour commands show the colour.** The accent was left out at first on the
  grounds that nine rows reading "Accent color: Violet" is a picker with the
  picking removed — true of the _label_, not of the row. `Command` gained an
  optional `swatch`, so `/accent violet` renders the colour itself, with an inset
  ring to keep a pale swatch visible on the light theme. Nine commands, no new
  translations (the colour names are literals, as in the picker).
- **Command mode announces itself.** A leading `/` turned the palette into a
  command autocomplete silently: the field looked exactly like container search
  while behaving nothing like it. The magnifier now swaps to a boxed slash —
  mirroring the character you typed — in a deeper shade of the _configured_
  accent (`color-mix` toward base-content, so it deepens on light and brightens
  on dark, and a custom accent stays the accent). Deliberately distinct from the
  plain `text-primary` the magnifier already takes on focus, so the two states
  cannot be read as one. The glyphs cross-fade and rotate rather than cutting,
  `out-in` so they never overlap in a 20px box, with a reduced-motion path that
  keeps the fade and drops the travel.
- **`enumStateCommands`** mirrors the existing `booleanStateCommands` for
  settings with more than two values: one command per value, never a cycle, so
  you can name the state you want without knowing the one you are in.
- **Parity is enforced, not just performed.** The settings commands were
  extracted into `settingCommands(t)`, a pure function needing no router, store
  or app context, and each command declares the `setting` it drives.
  `commands.spec.ts` then builds the real list and asserts every key in
  `Settings` is either commanded or explicitly excluded — so adding a setting
  without deciding either way fails the suite instead of shipping unreachable.
  It also checks idempotency by running each command twice, and that every value
  of the tri-state settings is reachable (a bare toggle would strand "auto").

- **Cmd/Ctrl+Shift+P opens the palette already in command mode**, the way an
  editor does: Cmd+K is "find a container", this is "run a command". It seeds the
  input with the `/` prefix rather than adding a second mode flag, so the palette
  needs no knowledge of how it was opened — it already switches on a leading
  slash. The caret lands after the prefix instead of selecting it, since a seeded
  `/` is a starting point to type after; a query carried in from `/cloud/search`
  still arrives selected, being a value you are likely to replace wholesale.

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

## Settings popup, JSON/visual editor, export

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
- **Export** settings to clipboard as JSON. The separate import panel (paste a
  document, or fetch a URL returning `application/json`) is gone: the JSON view
  is already a full editor with Apply, so the panel was a second, weaker way to
  do the same thing — and it collapsed the header into two competing modes.
  Applying still validates: only known keys with matching types are taken, string
  enums are checked against allowed values, numeric settings are clamped or
  restricted to a fixed set, and everything else is ignored.
- **The document is nested, the store is not.** Export used to be
  `JSON.stringify(settings)` — 26 keys in one flat blob, in whatever order they
  happened to be declared. It is now grouped (`appearance`, `dateTime`, `logs`,
  `stats`, `containers`, `containerTable`, `sidebar`), which also lets the
  document carry clearer names than the store's historical ones:
  `appearance/theme` rather than `lightTheme`, and `dateTime/locale` rather than
  `dateLocale`, which sat directly beside an unrelated `locale`.

  Settings stay flat _internally_, because ~30 modules import individual refs off
  the store (`compact`, `softWrap`, …) and nesting it would mean rewriting every
  one of them to no benefit. The nesting is a property of the document, so it
  lives with the serializer as one path-to-key map, and the two are free to
  differ. A `readPath(source, "stats/trendShape")` helper addresses the nested
  document in flat slash form; it returns `undefined` for anything that does not
  resolve — a missing key, or a path running into a primitive or an array
  partway down — because "absent" is what every caller wants there: an
  incomplete document should leave a setting alone, not throw.

  Import takes either shape. A path that does not resolve falls back to the flat
  key, so documents exported before the nesting still apply, and so does a
  partial one holding a single group.

  `settings.spec.ts` covers it, including a guard that the map has exactly as
  many leaves as the store has keys — it is hand-maintained, so a setting added
  without a path would otherwise vanish silently from export and import.

- **Every changeable preference is in the document.** The container table's stat
  mode, page size and sort order lived in three loose `DOZZLE_TABLE_*`
  localStorage keys, so exporting your settings — or moving to another browser —
  silently skipped them; they are settings now, with a one-time migration off the
  old keys so an upgrade does not reset anyone's table. The log view's CPU/memory,
  network/disk and trend-shape choices were already stored but reachable only
  from that view's own actions menu, so Settings never showed the whole of what
  you can change; they now have rows in the Display section, sharing the actions
  menu's labels so the two surfaces cannot drift.
- Key files: `assets/components/Settings/SettingsModal.vue` (new),
  `Settings/SettingsPanels.vue` (new, ~324 lines), `common/JsonEditor.vue` (new),
  `composable/settingsModal.ts`, `composable/jsonEditor.ts`,
  `stores/settings.ts` (import/validation logic). The old `pages/settings.vue`
  route (325 lines) is deleted — settings live in the modal now.

## Accent contrast (WCAG)

`--color-primary` is tuned to sit _behind_ dark text — every swatch in the
palette is a mid-to-light hue (L 66-80%) paired with an `oklch(24%)` content
colour. Used as a foreground it measured **1.3-1.8:1** on the light theme, and
the sidebar's selected row was **1.46:1** against its own accent wash. AA wants
4.5:1. The dark theme happened to clear it (5.9-7.9:1), which is exactly how a
violation like this survives review: it looks fine in whichever theme you use.

- **`--color-primary-text` / `--color-secondary-text`** derive a foreground form
  from whichever accent is configured — same hue and chroma, forced to a
  lightness that clears 4.5:1 on every surface it can land on. The two
  lightnesses (0.46 light, 0.73 dark) were solved numerically across all nine
  palette entries against base-100/200/300 and the 18% selection wash; worst case
  is 4.54:1 light and 4.64:1 dark. Derived rather than hand-picked per colour, so
  a custom accent is covered too.
- Relative colour syntax (`oklch(from … 0.46 c h)`) does the derivation, behind
  `@supports`, with the plain accent as the fallback — no worse than what shipped.
- Applied to every place the accent was carrying _text_: the sidebar's selected
  row, dropdown selection, the collapsed stat widget's readouts, links in log
  messages and in muted copy, the table's link hover, analytics badges, the
  mobile stat chip, the completion list's matched text, status pills, the cloud
  search CTA, and the log view's scroll-progress figure.
- **Icons keep the raw accent.** They are decoration or state, judged against the
  3:1 non-text threshold rather than 4.5:1, and swapping them would flatten the
  accent out of the UI entirely.
- **The four status colours get the same treatment, but by default rather than
  on request.** They measured 1.98:1 (warning) to 3.44:1 (success) as text on
  light — every one under AA, and warning under even the 3:1 a meaningful icon
  needs. Being read is their whole job, so `.text-success/-warning/-error/-info`
  override the utility outright: a `text-error` written anywhere later is
  readable without anyone remembering a suffix. One lightness pair covers all six
  colours. `@apply text-error` sites inline the raw colour onto their own
  selector, where a utility override cannot reach them, so those eight were
  pointed at the token directly.

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
- **Pinning looks like pinning, and is animated.** The container title's toggle
  was a star (stars mean "favourite"; the control pins), and the sidebar section it
  feeds wore `ph:map-pin-simple`, a location pin — so neither icon matched the
  gesture nor each other. Both are a pushpin now, filled and red when pinned,
  outline at rest, sharing a `--color-pin` token rather than borrowing `error`,
  since a pinned container is not a problem (darker on the light theme, or the
  same red reads pink on white). Pinning was also silent: it does not add a row,
  it _moves_ one out of the host tree into the Pinned section, and with both lists
  unanimated the row vanished from one place and materialised in another. Both are
  `TransitionGroup`s now, sharing one definition in `main.css` because it is one
  effect across both ends of the gesture — rows fade and slide along the leading
  edge, and the Pinned header has its own timing so creating the section does not
  land as one block. The leaving row keeps its space while it fades rather than
  going `position: absolute`, which would require every list in the outline to
  become a positioning context. Covered by `composable/containerGroups.spec.ts`.
- **The container search field is filled, not outlined** (`.field-filled`, paired
  with `.input` so radius, transition and focus ring stay shared). A recessed
  shade of the surface is how Apple draws a search box, and it earns its keep
  here: the field sits directly above a dense navigation list, where a hairline
  box is one more horizontal rule to sort out from the rows. Tinted with
  `base-content` rather than a `base-N` step so it reads as recessed on either
  theme without a second rule. Focus keeps the ring but not the edge, so it reads
  as the well brightening rather than growing a frame. The placeholder went 60% →
  70%: against the fill, 60% measures 3.5:1 on the light theme, under AA for text
  that size (the old `bg-base-200` was 3.52:1, so this was inherited, not new);
  70% clears it at 4.6:1 light and 5.7:1 dark.
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

## Sidebar: hosts with nothing to show

- A host whose containers are all filtered out by the current display setting —
  the eye toggle's running-vs-all — now **dims and stops responding**, rather
  than inviting a click that opens onto an empty list. `MenuSection` gained a
  `disabled` state for it: the node is forced shut (so one left open cannot be
  stranded holding nothing when the filter changes under it), the chevron goes
  `invisible` rather than `hidden` so icons and labels still line up across
  rows, and the hover-revealed actions are dropped since the row cannot act.
- `<details>` has no disabled state of its own — a click on the summary toggles
  it natively — so the click is refused in a handler rather than styled away.
- Dimmed to 35% rather than the offline host's 50%: an empty host is not a
  problem to look at, it is a branch with nothing behind it.
- Empty hosts are also skipped when collecting the sidebar's collapsible keys,
  or "expand all" would stay permanently live with nothing left to expand.

## Running vs all, as a view-level filter

- Multi-container views (host, group, host-group, the fleet search) default to
  running containers, and now take `?stopped=1` to include the stopped ones —
  in the tail _and_ in the backward scan. Exposed on the multi-container actions
  menu and in the fleet view's header, both bound to the same `showAllContainers`
  setting the sidebar's eye drives, so "running vs all" means one thing across
  the app rather than one thing per surface. It reconnects the stream, because
  the server decides the set: this is a different subscription, not a
  client-side unhide.
- **Per route, deliberately.** Applying it centrally in
  `streamLogsForContainers` also caught the single-container and merged routes,
  which name their containers outright — a stopped container then matched
  nothing, the stream had no containers to end, and `Test_handler_streamLogs_happy`
  hung until the suite timed out. Both halves are now tested: a stopped container
  still streams from its own view, and a host view opens one container by default
  and two with `stopped=1`.

## Search freeze on the backfill path

The page locked up for a moment just before search results appeared — and only
ever when there were matches, which was the clue: no matches means no events, so
no work.

- **The live stream was buffered and the search backfill was not.** Incoming log
  lines go through a 250ms/1000ms debounced flush, but `logs-backfill` — one SSE
  event per time window the server scans — spliced straight into `messages` as
  each arrived. Every event rebuilt the whole array and re-rendered every row, and
  because backfill _prepends_, every existing row moved, so Vue patched all of
  them. Ten windows against a list already holding hundreds of lines is the
  freeze.
- Backfill now batches through its own buffer on the same cadence, so a burst of
  windows costs one rebuild instead of one per window. Ordering is preserved (each
  window is older, so a new batch goes in front of the ones already waiting), the
  buffer is flushed the moment `search-status` reports `done` so the last batch
  does not sit out the debounce, and it is cancelled on clear so a pending batch
  can never land on a list it no longer belongs to.
- `EventSource.spec.ts` covers all three. The batching test is written so it
  fails against the old code — verified by restoring the synchronous splice, which
  reproduces it exactly (`expected [...6 entries] to have a length of 0`).
- **The bigger cause was upstream of rendering: the first connection carried no
  filter at all.** `refDebounced` initialises from its source, so seeding the
  query _after_ the search state was built left the debounced value empty for a
  full 400ms — long enough for the stream to connect unfiltered, which on a fleet
  view means the server tails every running container on every host and floods
  the browser, only to reconnect and throw it all away. The query is seeded at
  construction now, so the first URL already carries `filter=`. Also verified by
  reintroducing the late assignment, which fails the new test.
- The backfill path had no ceiling while the live path capped at `maxLogs`, so
  prepended results could push the list past it and every later render paid for
  rows nobody had scrolled to. Capped now, dropping from the tail — backfill
  reaches backwards, so the oldest lines are furthest from what was asked for.

## Log row provenance

- **Host and container names were two filled `RandomColorTag`s at a fixed
  `w-30`/`md:w-40` each** — 20rem of every row reserved for provenance before the
  timestamp began, whether the names needed it or not. Two faults in one: the
  width was spent regardless of content, and a saturated filled plate states
  context at the volume of content.
- `LogSource` replaces both with one cell: a 3px colour mark plus text, at
  `w-32`/`md:w-44`. Identity-by-colour survives (it is genuinely how you scan a
  merged stream) as a hairline rather than a plate, and the cell costs a little
  over half what the pair did.
- **Stacked, at the log's own size, with nothing elided.** Host and container sit
  on two lines so each gets the cell's full width instead of the two competing for
  one strip. Both at the same size, hierarchy carried by tone: shrinking the pair
  to 0.72em of an already-`text-[0.8em]` list produced a 9px label, which is not a
  legible answer to a width problem.
- **The host is only shown when it varies.** On a single-host install the same
  word on every row is repetition, and it was taking the width the container name
  needed. `AllLogs` enables `showHostname` only above one host.
- The column width is _derived_: `LogList` measures the longest name it actually
  renders (it counts host names only while hostnames are shown) and publishes it
  as `--log-source-chars`, once for the list rather than per row.
- That number is a **floor**, and it sits on the text column rather than the
  cell. Both details were got wrong once each, with a visible symptom each time.
  As a `width` on the cell, an estimate that came out short made the cell too
  narrow, the text spilled, and the timestamp drew over it. As a `min-width` on
  the _cell_ it still had to cover the colour mark and its gap, so the text got
  ~9px less than the character count asked for: every row overflowed by a hair,
  each sized to its own name, and the messages stopped starting at the same x —
  which the old fixed-width tags had got right. On the text column it is exact,
  and the cell is mark + gap + N characters, identical on every row.
- No ceiling and no truncation, so a name longer than the estimate widens its own
  row rather than being cut. That is the safe direction to fail: it costs
  alignment on one row, where the earlier version let the timestamp cover the
  name outright.
- The palette is exported from `RandomColorTag` and shared, so a container's mark
  and its tag can never drift to different colours.

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
- **Scroll progress no longer claims 100% at the oldest line.** Two causes, both
  reporting a confident percentage where nothing had been measured. `progress`
  defaulted to `1` and `LogList` only computed it when exactly one container was
  in view, so every merged/host/stack/service/group view read "100%" with a full
  bar for as long as you were scrolled up. And the arithmetic had no guard on its
  span: with `container.created` unset the backend sends the Unix epoch, and
  `(line - 0) / (now - 0)` is ~0.9998 for every line including the oldest; a
  container created in the same instant divided by zero; an invalid date gave
  `NaN`, which no comparison rejects. `progress` is now `number | undefined`, the
  span starts at the oldest container in view (so multi-container views are
  measured rather than skipped), and the arithmetic lives in a pure
  `scrollProgress()` that refuses unmeasurable spans and clamps at the source —
  host clocks run ahead of the browser's, so a line can legitimately be stamped
  after `now`. Unknown renders no percentage at all, and an empty bar rather than
  a full one. Covered by `composable/scrollContext.spec.ts` (9 cases).
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
- **Focus is a fill shift, not a ring.** Five treatments had accumulated that
  agreed on nothing: a 3px box-shadow at 22% on fields (flush to the edge, so it
  read as a fat halo rather than a ring), a 2px ring at 60% on segmented buttons,
  a 2px outline at 55% on toggles, 4px of _inset_ chrome on the selected colour
  swatch (which left the colour as a small disc behind a heavy band), and
  daisyUI's own near-black outline on buttons — invisible on the dark theme, so
  buttons had no usable focus indicator. All of them are gone rather than
  reconciled: focus now tints the control's own surface (`--focus-fill`) and
  brightens its edge where it has one (`--focus-edge`), with no outline anywhere.
  Accent-tinted rather than a brighter neutral, since hover is already a neutral
  lift on every control here. Applied as a `background-image` over the control's
  own `background-color`, so one rule covers daisyUI's button variants and a
  swatch's own hue without this file knowing them, and `box-shadow` is left alone.
  Removing `@utility input { outline-hidden! }` was required earlier and
  reinstating `outline: none` on field focus is now load-bearing — with no ring of
  our own, the browser's default would otherwise sit on top of the tint. The
  segmented control tints its whole track (`:has(:focus-visible)`) rather than the
  focused segment, which would conflate "chosen" with "focused". Colour swatches
  are the one control a fill shift cannot mark, because the fill _is_ the value:
  they add a lift on focus, and selection is the check glyph over a 1.5px hairline
  inside the swatch's own edge.
  **Tradeoff, measured:** the focused-vs-unfocused state change is 1.14:1 on the
  dark theme, well under the 3:1 WCAG 1.4.11 asks of a focus indicator. This is a
  deliberate choice of quiet over conformance. Text contrast inside the tinted
  field is unaffected (5.17:1 dark, 4.64:1 light, both AA).
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

## Dashboard (home page)

Rebuilt from the ground up. Upstream's `/` opened straight into a grid of
per-host cards roughly 480px wide, each carrying two tint-washed metric boxes
with their own chart and an avg/peak line, above a container table — with both
sections behind manual collapse chevrons persisted to localStorage.

- **A fleet summary comes first**, because "is everything OK?" is the question
  you arrive with and the old page never answered it: it showed per-host cards
  and left you to add them up. Containers / CPU / memory / hosts as one
  hairline-divided surface (`FleetSummary`, `MetricCell`), drawn with a 1px grid
  gap over a tinted parent so the dividers need no per-cell border logic and stay
  correct when the columns reflow.
- **Colour moved off the furniture.** Figures stay in the text colour and the
  accent is spent on the sparkline; the old `bg-primary/10` box washes are gone.
  Charts bleed to the cell edge instead of sitting inset as a second object.
- **Hosts are tonal, compact and navigable** (`HostTile`): press feedback on
  pointer-down, a chevron that leans toward the destination, and hairline meters
  rather than per-host charts — the question a host list answers is "which one is
  busy", a comparison across rows that a shared scale answers and five separate
  time series do not. The old cards were not clickable at all, so the one thing
  you want from a host here (its logs) was not on offer.
- **An unreachable host drops its meters** rather than drawing them at 0%, which
  reports the machine as idle when all we know is that we cannot see it.
- **Both collapse chevrons are gone.** They managed a height problem this layout
  does not have: the summary is fixed, the hosts are capped at two rows with a
  scroll-edge mask, and the table takes what is left and scrolls internally.
- **Adapts to one host**: the hosts section and the hosts cell both disappear —
  the three remaining figures already describe that machine.
- **Container table** gained a title/count on its own control bar, a `fill` mode,
  state chips, and segmented controls for the host filter and the stat rendering.
- Removed: `HostCard.vue`, `HostList.vue`, `MetricCard.vue` (and their stories).
  New: `components/Dashboard/{FleetSummary,MetricCell,HostTile,StateRibbon}.vue`,
  `composable/{fleetStats,hostTotals}.ts`.

## iOS 18 shades and elevations

A correctness pass over the control material, after the first attempt used
plausible-looking numbers rather than Apple's.

- **Shadow utilities were a glow.** `[class*="shadow-"]` recoloured every
  Tailwind shadow to a tint of `base-content`, which is near-white on the dark
  theme — so `shadow-md`/`lg`/`xl` on all 19 dropdowns, toasts, popovers and
  cards were a pale halo, not a shadow. They now carry ink at a per-theme
  strength (`--shadow-alpha`).
- **One fill ramp, from Apple's grey.** Tints were single percentages of
  `base-content` reused across both themes (7% button, 11% segmented track, 22%
  switch). Apple mixes fills from one neutral grey (`#787880`) in both
  appearances and roughly doubles the alpha in dark, because a light tint over a
  dark surface reads far weaker than the same alpha of dark over white.
  `--fill-1`…`--fill-4` are Apple's four levels; `--fill-3` is what a grey button
  and a segmented track share, which is why those two never matched before.
- **Buttons lost their elevation and their edge.** An iOS button is a flat fill:
  neutral is `--fill-3` with no border, ghost hover is `--fill-4`, and the filled
  colour variants drop daisyUI's `0 1px 3px`. The hairline was doing the
  separating the fill is supposed to do.
- **Three elevations, not ad-hoc ones**: `--elev-thumb` (Apple's own
  segmented-control shadow, verbatim in light), `--elev-popover`, `--elev-sheet`.
- **Switch rebuilt to UISwitch proportions**: 51×31pt with a 27pt knob, held in a
  single `--switch-h` so width, knob and travel all derive from it (travel is
  width − height) — the old `sm`/`xs` had drifted to different ratios than the
  base. Off track is a flat specific grey (`#E9E9EA` / `#39393D`) instead of
  `base-content/22`, which read as half-on in light.
- **Segmented thumb** is white in light and `#636366` in dark — a grey lighter
  than its own track, since a white capsule on a dark track reads as a headlight.
  At the previous values the dark thumb cleared its track by 4.6 points of
  lightness (visually identical); it now clears it by 16.3, which is iOS's own
  separation. Its hairline border is gone, as the shadow already lifts it.

## Toasts

- **Alignment follows content.** The row was unconditionally `items-start` with
  hand-tuned `mt-0.5`/`pt-0.5` offsets — geometry that only works when there is a
  second line to hang off, so single-line toasts (most of them) sat their text
  about a pixel above the icon and close button.
- **Confirmations describe what changed**, not which button was pressed. "All
  Containers" echoed the control's own label and gave no hint the setting reaches
  beyond the current view; it now reads "Showing all containers, including
  stopped ones". Collapse/expand confirmations moved to past tense, since the
  button labels are instructions and read as though nothing had happened yet. New
  `toasts.*` keys in all 16 locales; the `label.*` keys they replaced stay, as
  they are also sidebar group names and button titles.

## Settings popup

- **Header rule is a scroll edge**, drawn only once content is passing beneath,
  so a short panel is one uninterrupted surface.
- **Grouped-list rows** take Apple's shape: separators inset to the leading text
  edge rather than run wall to wall, and the `<label>` rows — togglable along
  their whole length, with nothing previously saying so — respond to hover and
  press.
- Reduced-motion paths for the drill-in and import transitions keep the
  cross-fade and drop only the travel.

## Fleet-wide log search without Dozzle Cloud

The palette offered "Search logs for X" and then, without Cloud, sat dimmed and
inert under "Connect Dozzle Cloud to search logs" — which reads as _this cannot
be done_. It could: `streamLogsForContainers` runs a backward scan across
whatever container set it is handed (`internal/web/logs.go`), walking back in
exponentially growing windows and streaming matches over `logs-backfill`. Six
routes already used it. Nothing pointed it at the whole fleet.

- **`GET /api/logs/stream`** (`streamAllLogs`) hands that same path every running
  container on every host. Three lines; the engine was already there.
- **`/logs`** renders it through the ordinary log viewer, with hostnames shown —
  a fleet-wide view is the one place two containers can share a name and mean
  different machines.
- **The palette routes to whichever is available**: `/cloud/search` when Cloud is
  linked, `/logs?search=…` otherwise. `?search=` is already read by
  `useSearchFilter`, so the query is applied and the server's scan is already
  running by the time the page paints — no second search mechanism to maintain.
- **The CTA is always actionable**, and its subtitle states what the local scan
  covers ("Scans running containers, newest first") so the difference from Cloud
  is a stated limit rather than a surprise.
- **What Cloud still buys**, stated plainly: an index (so a query with no recent
  matches does not degrade to scanning every container's retained history),
  retention beyond the Docker log driver's rotation, and hits from containers
  that no longer exist. The local path is fast where it matters — the 50-match
  cap and doubling windows mean a recent hit returns almost immediately — and
  honestly slower on a cold, deep query.
- **Host filter on the fleet view.** Row 1 of the top bar carries a multi-select
  of hosts (only when there is more than one — a filter with one option is a
  control that cannot do anything), with a reset back to all. Empty means every
  host, which is exactly what the server treats as no filter, so there is no
  second way to express "all". Sent as `?hosts=` and applied to _both_ the tail
  and the scan, so narrowing actually reduces what the server reads rather than
  hiding rows after the fact. The panel stays open while ticking hosts — closing
  after each would make choosing three of five a three-trip job.
- The header's container count used to render a bare "No containers" floating in
  the bar when nothing was running; it is guarded now, and the count follows the
  host filter so the header describes the same set the log body draws from.
- **Tails the running containers, searches all of them.** These are different
  questions and the route now answers them separately
  (`streamLogsForContainersWithSearch`). Tailing a stopped container is
  pointless — its stream EOFs at once, and that path emits a "container-stopped"
  event, so including the dead in the live fan-out would post one event row per
  corpse. Searching one is the opposite: a container that crashed is usually the
  whole reason someone is searching, and scoping the scan to what is currently
  running quietly answers a narrower question than the one asked. `logs_test.go`
  asserts both halves — history is read for the stopped container, nothing tries
  to tail it.
- The per-view routes pass no search filter, so they still search exactly what
  they show; there the visible set _is_ the subject. Widening those (a host
  search covering that host's stopped containers) is a one-argument change if
  wanted.

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

- **Escape in settings goes back one level, not all the way out.** The settings
  popup has iOS-style drill-in screens (What's New, Notifications) with a back
  button in the header, but Escape closed the whole dialog — and `closeSettings`
  resets `subview`, so it also forgot where you were. Handled on `cancel` rather
  than `close`, so Escape pops the subview when one is open and only dismisses
  settings from the top level. Note settings has no "Escape commits something"
  problem: the visual controls write straight to the store as you change them, and
  the JSON editor requires an explicit Apply, so cancelling correctly discards.

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
- `assets/composable/containerGroups.spec.ts` — host-branch grouping, and the
  invariant the pin animation depends on: a pinned container is excluded from its
  host's groups, so the row genuinely leaves the tree rather than being drawn in
  two places while both lists animate against each other.
- `assets/composable/scrollContext.spec.ts` — the scroll-progress span maths: the
  oldest line reads 0 rather than 1, lines outside the span clamp, and every
  unmeasurable span (epoch start, zero-length, future start, invalid date) returns
  undefined instead of a plausible number. Includes an assertion that the old
  epoch arithmetic really did land above 0.99, so the regression cannot quietly
  return.
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
