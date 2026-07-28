# UI Overhaul Progress

Apple-HIG UI overhaul pass. Each item updates the component(s) and its Storybook story, then the quality gate runs at the end (format, test, typecheck, build).

Legend: [ ] todo · [~] in progress · [x] done · [-] deferred/blocked

## Items

- [x] 1. ContainerDropdown: distinct visual emphasis for container name vs. time (Apple HIG).
- [x] 2. Log view: compact CPU/mem stat (max + average) as default, graphical trend as optional toggle in action menu.
- [x] 3. Network & disk stats: support max + average (compact) + graphical, toggle in actions menu.
- [x] 4. Hide the blinking horizontal bar at log start/end while logs are loading.
- [x] 5. STDERR/STDOUT filter switch freezes/janks the page. Diagnose + fix.
- [x] 6. ContainerPopup: same visual-emphasis treatment as #1.
- [x] 7. HostMenu redesign: drop hosts page, hosts as collapsable tabs (hosts -> groups -> container), no outlined containers, tonal/container HIG.
- [x] 8. Converge all buttons on the glass-texture button style + consistent corner radius.
- [x] 9. Cloud search table header bar: unify with ContainerTable, extract shared component.
- [x] 10. Redesign all sidebar menus in the same fashion as #7.
- [x] 11. ContainerHealth: drop outlined, use tonal.
- [x] 12. 'Live Logs' badge redesign (Apple HIG).
- [x] 13. ComplexLogItem horizontal alignment fix.
- [x] 14. LogItem/SimpleLogItem horizontal alignment fix.
- [x] 15. MultiContainerActionToolbar: traditional three-dot icon instead of blue/red dots.
- [x] 16. SQLTable loading skeletons: rounded corners matching the UI.
- [x] 17. ScrollProgressBar: animated progress.
- [x] 17b. Remove ZigZag everywhere; redesign those spots for their intent.
- [x] 18. Input fields: richer design (hover/typing animations, clear button when non-empty).
- [x] 19. SegmentedControl: higher-contrast highlighted option (current Apple HIG design).
- [x] 20. SideDrawer button redesign.
- [x] 21. SlideTransition: fix disconnectedness.
- [x] 22. Input-field treatment also applies to CloudSearchInline.

## Notes / decisions

- Design tokens live in `assets/main.css`. `--control-radius: var(--radius-box)` is the shared control roundedness.
- No screen-wide blur; glass/backdrop-blur reserved for cards + small floating widgets.
- Storybook stories live alongside components as `*.stories.ts`.

### Per-item decisions

- **#2** Compact mode shows max + average only (no live value, no chart), which is
  what "only cpu and ram max and average is shown" asks for. The live value is
  still on the collapsed top-bar widget and in the container table.
- **#3** Default left at `current` (the live per-second rate) since only #2 asked
  for compact-by-default. Summary mode combines the two directions into one
  throughput figure; the per-direction split stays available in `current`.
- **#5** Three causes, all fixed: the SSE buffer copied itself once per incoming
  line (quadratic over a reconnect's backfill burst); `useLoggingContext()` ran
  `toRefs` per log row; and every log row eagerly built a five-item dropdown with
  two resolved routes. The menu is now built on first hover/focus.
- **#7** "hosts page" read as the hosts pane inside the sidebar (the left half of
  the old two-pane slide), which is gone. The dashboard's host cards on `/` are
  untouched — say the word if that was the intent instead.
- **#8** Glass is applied to `.btn` globally; `[data-logs] .btn` opts out of the
  blur only, because a log view renders hundreds of them.
- **#15** Applied to `ContainerActionsToolbar` too — it is the same control, and
  leaving one of the two on coloured dots would be a worse inconsistency.
- **#18** Login keeps its floating-label markup and picks up the new hover/focus
  styling from the shared `.input` rules; a clear button on a password field is
  not wanted.

### New shared pieces

- `common/DataTable.vue` — the one table shell (sticky recessed header, sort
  interaction). Used by `ContainerTable` and the cloud search results.
- `common/MenuSection.vue` — one collapsible node of a sidebar outline.
- `common/TextField.vue` — the app's text field (leading affordance, clear
  button, transitions). Note: its size prop is `fieldSize` — a prop literally
  named `size` collapses the component's props type to `never` under vue-tsc.
- `composable/collapsedSections.ts` — all sidebar collapse state in one
  prefix-namespaced persisted set.
- `composable/containerGroups.ts` — one host's containers split into groups.
- `composable/statSummary.ts` — max/average and rate-from-counter helpers.

## Follow-up round

- [x] 23. `make dev` was broken: Homebrew's `air` is an R language server, and Go's
      `air` was not installed. Installed to `~/go/bin` and scoped a PATH prefix to
      the three `air` scripts in package.json, so the R tool is untouched.
- [x] 24. Sidebar: removed the hover translateX shift on menu rows.
- [x] 25. Restored the log-view search field's expand animation (the shared
      `.input` rule is unlayered, so it has to carry `width` itself).
- [x] 26. Search moved to the head of the sidebar; the dashboard's own search bar
      and the whole `hasInlineSearch` mechanism are gone.
- [x] 27. Sidebar rows overflowed the pane (daisyUI sizes `.menu` to fit-content),
      putting the merge and pin buttons on top of the main pane where they could
      not be clicked. Every level of the outline is now width-pinned.
- [x] 28. The catch-all "All containers" group no longer duplicates the host's
      merge action.
- [x] 29. Search freeze on long logs: `filteredPayload` rebuilt every visible
      entry (and a Vue computed per entry) on every 250ms flush, then
      `JSON.stringify`-ed every field to look for `<mark>`. Derived entries are
      cached per visible-keys ref, the mark test walks the value, and the search
      debounce went from VueUse's 200ms default to an explicit 400ms.
- [x] 30. Compact stat widgets rebuilt as one shared card: CPU/memory and
      network/disk share chrome, column tracks and typography; figures are
      current / max / available; the meter animates and marks the peak; clicking
      a card cycles its form.
- [x] 31. Container bar row 1 pinned to one height across every stat form.
- [x] 32. Shadows use a dark ink token instead of a `base-content` tint, which
      rendered as a glow on the dark theme.
- [x] 33. Container state dot reverted to the original daisyUI `.status` badge.

### Stat widget, final shape

- One component (`StatSummaryCard`) in two forms, used for both metric pairs:
  - **Compact** — two rows on fixed column tracks. CPU/memory reads
    current / max / available; throughput reads current / max (no ceiling to
    report, so no third figure). A meter draws current against the ceiling and
    ticks where the window peaked.
  - **Expanded** — the two metrics sit side by side so each trend gets the
    card's full height.
- The card is its own control: clicking cycles the form. Throughput also keeps
  the per-direction live rate (`IOCard`), so its cycle is three-way.
- Forms cross-fade in place, with the outgoing one lifted out of flow so the
  card never empties or resizes mid-swap.
- Both forms render the same figures block, so the only difference between them
  is the meter giving way to the trend — no number is added, dropped, or moved.
- Columns are labelled. Compact puts NOW / AVAIL inline on each metric's single
  line — MAX is dropped there because the meter's tick already shows the peak,
  which keeps the whole card to two lines. Expanded heads all three columns
  (NOW / MAX / AVAIL) once per trend. Throughput has no ceiling, so it reports
  one figure fewer.
- Trends draw as bars, a line, or a filled area (`trendShape`, in the actions
  menu). One downsampled series, three renderings: bars keep their per-bar
  hover, line and area are a single stretched SVG path. No charting library —
  see the note below.
- Each widget sits in a slot that animates its own width across a form change:
  CSS cannot transition `width: auto`, so `useAnimatedWidth` measures either
  side, drives the width for the duration, then hands it back to the layout.
- A stopped container reports N/A through that same block (no second layout):
  the parent substitutes the labels, and `unavailable` governs only the empty
  meter, the flat trend, and the dimming. The ceiling still reports, since it is
  a property of the host rather than a measurement.
- Cards are content-sized and shrink with the bar; a transition can no longer
  push anything past the viewport (the card clips its own contents).
- Container bar row 1 is pinned to one height across every form.

### Incidental fixes

- `formatBytes` returned `undefined` for fractional and non-finite inputs
  (`sizes[-1]`); averages are fractional, so the compact stat cards hit it.
- `formatBytes`'s short form rendered a megabyte as `1.6M` (first letter of the
  unit), which reads as a count. It now emits the real abbreviation, `1.6MB`.

### Environment note

- New keys in `locales/*.yml` do not reach the dev server until vite is fully
  restarted: `@intlify/unplugin-vue-i18n` does not invalidate its
  `virtual:intlify-i18n-*` modules on a locale edit, so the key renders as its
  own path (`label.not-available`). Production builds are unaffected.

### Known, not changed

- `[class*="shadow-"] { @apply shadow-base-content/8 }` in main.css tints _every_
  Tailwind shadow utility with base-content, so they all glow on the dark theme.
  Pre-existing, and changing it shifts shadows app-wide — say the word.
