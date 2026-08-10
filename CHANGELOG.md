# Changelog

Notable changes to this fork of [amir20/dozzle](https://github.com/amir20/dozzle).
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This file records changes release by release. For a standing description of
_everything_ the fork's `dev` branch adds on top of upstream — grouped by feature
area rather than by date — see [EXP_FEATURES.md](EXP_FEATURES.md).

## [Unreleased]

A full Apple-design audit of every user-visible surface, and its remediation. The
audit itself is kept in [APPLE_DESIGN_AUDIT.md](APPLE_DESIGN_AUDIT.md).

### Added

- `composable/dismissGesture.ts` — the app's first real gesture layer: pointer
  capture with 1:1 tracking, sampled release velocity, rubber-banded boundaries,
  Apple's exponential-decay momentum projection, and a velocity-seeded spring.
  Drives swipe-to-dismiss on the side drawer and the mobile menu.
- `DrawerPanel.vue` — shared chrome for all six side-drawer panels: a sticky
  title bar with eyebrow/title/subtitle/actions, a scroll edge, and the close
  control as a real row item.
- A type scale (`type-display` / `title` / `heading` / `body` / `caption` /
  `section`), each step fixing size, weight, leading and tracking as a set.
- Inset grouped lists (`.inset-group` / `.inset-row`), promoted from the settings
  sheet so drawer panels and settings share one list shape.
- Glass weights: `.glass-surface-sheer` / `-popover` / `-chrome`, replacing eight
  hand-rolled recipes.
- `.status-pill` gained a `-dot` modifier and `secondary`/`info` tones; `.hit-44`,
  `.row-pressable` and `.reveal-on-hover` utilities.
- A per-theme `--level-*` ramp for log level marks.
- Storybook story for `DrawerPanel`.

### Changed

- **Side-drawer panels redesigned.** `LogDetails` now leads with the log message
  (Formatted/Raw segmented control) instead of burying it under a metadata grid;
  fields moved from a `<table>` with an explanatory caption to a list with visible
  drag grips and checkmarks in place of per-row switches.
- **Mobile navigation bar** rebuilt as iOS bar button items — quiet glyphs with
  44pt targets, translucent chrome with content passing under it — replacing
  three filled 48px discs.
- Menus open on press, not hover; they close on Escape and outside press, and
  restore focus to their trigger.
- Container `stop` / `restart` / `update` now arm before firing.
- Container-table rows are clickable along their whole length.
- All 16 locales brought back to key parity (21 keys, 4 of which predated this
  work).

### Fixed

- **Log-row actions were unreachable on touch devices** — the menu opened on
  hover behind a hover-revealed trigger, so copy log, copy permalink,
  see-in-context, show details and create alert did not exist on phones.
- **`/show` permalinks could hang on a blank page indefinitely** when the
  container store was already populated.
- Three dead-end screens (404 and both container-not-found pages) had no way out.
- **Contrast**: 21 foreground uses of the raw accent measured 1.61:1 on the light
  theme; timestamps 2.96:1; log level marks 1.81:1 (warn, light) and 2.96:1
  (debug, dark). All now clear AA.
- 31 `<a @click>` elements with no `href` were unreachable by keyboard.
- Five floating surfaces ignored `prefers-reduced-transparency` and
  `prefers-contrast`; eleven files' animations ignored `prefers-reduced-motion`.
- The side drawer presented modally with no scrim.
- Tooltips rendered off-screen near the right edge and never appeared on keyboard
  focus.
- Terminal sized itself against a zero-height box on open, and only refit on
  window resize rather than on its own.
- `login.vue` had nested `<label>`s with no real label association, `autofocus` on
  two fields, and an error state that blamed the username for a credential-pair
  failure.
- Browser theme colour matched neither theme's actual surface; scrollbars used
  four hardcoded colours; log zebra striping used a raw Tailwind grey.
- Four pixel-locked font sizes ignored the reader's text-size setting.
- One loading indicator used a different shape (and pulled in an inline-SVG mask)
  for the same meaning as the other nineteen.
