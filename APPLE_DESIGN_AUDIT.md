# Apple Design Audit

An adversarial pass over every user-visible surface in the Vue frontend, measured against
Apple's interface and motion doctrine (_Designing Fluid Interfaces_ WWDC18, _The Details of
UI Typography_ WWDC20, _Principles of Great Design_ WWDC26) plus the token system this fork
already established in `assets/main.css`.

**Scope:** 137 `.vue` files — 17 pages, 2 layouts, 118 components — and `assets/main.css`.
Three axes, per request: visual/material fidelity, internal **consistency**, and **UX logic**.

**Date:** 2026-08-08 · branch `dev` @ `555a5cf6`

> **Status: all 26 findings fixed.** This document is kept as the record of what
> was wrong and why each fix is what it is. Every finding below is resolved; the
> plan that follows is annotated with what landed. See "Verification" at the end.

---

## Verdict

The foundation is genuinely good and, in places, better than most commercial web apps. `main.css`
is a real design system: Apple's four fill levels at correct per-theme alphas, a shadow scale
that spends elevation only on things that float, a UISwitch rebuilt from the 51×31pt ratio, and a
derived `--color-*-text` foreground ramp solved against every surface. `SegmentedControl.vue`,
`HostTile.vue`, `ContainerTitle.vue`'s pin, and `SettingsPanels.vue`'s grouped list are
model implementations with defensible values and reduced-motion handling.

**The problem is not the system. It is adoption.** The system is correct and roughly half the
app ignores it. Concretely:

- **8 hand-rolled glass recipes**, only 3 of which use `.glass-surface` — so 5 floating surfaces
  silently ignore `prefers-reduced-transparency` and `prefers-contrast`.
- **5 menu implementations** with 3 different opening mechanisms (click, focus, **hover**) and
  5 different materials.
- **5 parallel status-chip systems** for the same job.
- **`--color-*-text` was built to fix a documented AA failure and then applied to ~30% of the
  call sites.** The remaining ones measure **1.61:1** on the light theme.
- **Zero gesture handling in the entire codebase.** No pointer capture, no velocity, no springs,
  no interruptible animation. Every transition is a fixed-duration script. Sections 2, 3, 5 and 6
  of the Apple motion doctrine — direct manipulation, interruptibility, velocity handoff,
  momentum projection — are not partially implemented; they are absent.
- **Three surfaces are effectively unusable on touch**, because they open on hover.
- Typography has **no scale at all**: 9 different treatments for "panel title", a broken heading
  outline, and 4 pixel-locked font sizes that defy the user's text-size setting.

Below, severity is by user impact, not by effort.

---

## P0 — Broken or inaccessible

### 1. Log-line actions are unreachable on touch devices

`components/LogViewer/LogActions.vue:3` opens on `dropdown-hover`, and the trigger itself is
`opacity-0 group-hover/entry:opacity-90` (`:31`, `:41`). A touch device never hovers, so on
phones and tablets **copy log, copy permalink, see-in-context, show details, and create-alert do
not exist**. `main.css:986` already establishes the fix pattern (`@media (pointer: coarse)`) for
sidebar row actions — it was never extended here.

Same defect in `ContainerViewer/ContainerActionsToolbar.vue:2`,
`LogViewer/MultiContainerActionToolbar.vue:2`, `Notification/AlertCard.vue:16`.

> Hover-to-open also violates §16 _Familiarity_ outright. iOS and macOS menus are tap/click-to-open,
> always. A menu that appears because the pointer passed over it is unpredictable, and it fires
> constantly while crossing a toolbar.

**Fix:** replace `dropdown-hover` with click/tap-to-open on a real `<button aria-haspopup="menu"
aria-expanded>`; reveal the log-row trigger unconditionally under `@media (pointer: coarse)`;
close on Escape and on outside-tap.

### 2. `/show` permalinks hang on a blank white screen

`pages/show.vue` renders `<template></template>` — literally nothing — and resolves the container
inside `watch(containers, …)` with neither `immediate` nor `deep`. `stores/container.ts:15` is a
long-lived `ref([])` shared app-wide. When the store is **already populated** (any in-app
navigation, or a permalink pasted into an open tab) the ref does not change, the watcher never
fires, and the page waits for the next arbitrary SSE container event. On a quiet fleet that is
minutes of blank page.

Even on the happy path there is no title, no spinner, no text — §16 _Feedback: expose ongoing
status_ scores zero.

**Fix:** `watch(containers, resolve, { immediate: true })`, and render a centred
"Finding _name_…" state with a spinner plus a fallback link to the dashboard after ~5s.

### 3. Level dots encode meaning in hue alone, and two of the five fail contrast

`components/LogViewer/LogLevel.vue` paints a 10px dot per level with no shape, glyph, or label
variation. Colour-blind users get no level information anywhere in the log stream — the primary
scanning affordance of the product.

Measured against the log surface (computed from the `oklch()` values in `main.css:11-15`):

| Level       | Colour                | Light theme               | Dark theme    |
| ----------- | --------------------- | ------------------------- | ------------- |
| warn        | `--color-orange` L85% | **1.81:1** ❌ (needs 3:1) | 9.51:1        |
| info        | `--color-green` L62%  | 3.15:1 ⚠️                 | 5.47:1        |
| error       | `--color-red` L64%    | 3.42:1 ⚠️                 | 5.05:1        |
| debug/trace | `--color-purple` L51% | 5.83:1                    | **2.96:1** ❌ |

The warn dot is essentially invisible on the light theme; the debug dot fails on dark. The palette
fails at **both** ends — exactly the "looks fine in whichever theme you happen to use" failure
`main.css:161-167` was written to call out.

**Fix:** give `--color-orange`/`--color-purple` per-theme lightness (as the ANSI palette already
does at `main.css:60-134`), and add a non-colour channel — a single-letter glyph at `size`
`small`, or dot shape (filled / ring / square) per level.

### 4. Timestamps fail AA on the light theme

`components/LogViewer/LogDate.vue:4` renders `text-blue` → `--color-blue` at **2.96:1** against
the light log surface. Timestamps are body text on the densest screen in the app; AA is 4.5:1.

**Fix:** `color: var(--color-info-text)`. The token exists (`main.css:268`) and is solved to
4.5:1+ in both themes.

### 5. `text-primary` as a foreground, 21 remaining sites, 1.61:1 on light

`main.css:241-291` documents at length that `--color-primary` is tuned to sit _behind_ dark text
and measures 1.3–1.8:1 as a foreground, then builds `--color-primary-text` to fix it. Measured:
raw primary on light `base-200` = **1.61:1**.

It was then applied to roughly a third of the call sites. Still raw, and all of these are text or
meaningful glyphs rather than decoration:

| File:line                                                                  | What                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| `ScrollableView.vue:132,144`                                               | scroll-to-top / scroll-to-bottom chevrons        |
| `LogViewer/SkippedEntriesLogItem.vue:9`                                    | button **label** on its own `bg-primary/12` wash |
| `ContainerViewer/HistoricalContainerLog.vue:25`                            | button label on `bg-secondary/15`                |
| `ContainerStatCell.vue:88`                                                 | a stat **value** you are meant to read           |
| `HostMenu.vue:51`, `SwarmMenu.vue:26`, `K8sMenu.vue:27`, `HostNode.vue:36` | merge-all glyphs                                 |
| `common/DataTable.vue:125`                                                 | active sort indicator                            |
| `common/ShowAllContainersToggle.vue:9`                                     | on-state glyph                                   |
| `Search.vue` (`focus-within:border-primary`)                               | field focus edge                                 |
| `pages/login.vue:11,34`                                                    | field focus glyphs                               |

Note `FuzzySearchModal.vue:151` gets this right and has the comment explaining why —
`:145,146,160,196` in the same file do not.

**Fix:** mechanical. `text-primary` → `text-primary-safe` wherever the element carries meaning;
leave it only on decorative fills (chart tones, meter bars, the toggle glyph).

### 6. Login page is untouched by the design system

`pages/login.vue` is the **first screen a user sees** and predates every rule in `main.css`:

- `input-bordered … border-2` + `has-[:focus]:input-primary` — a 2px frame and daisyUI's own
  focus system, directly contradicting `main.css:556-594` ("No ring. Focus is a shift in the
  control's own surface") and `main.css:602-644`.
- `card … shadow-2xl` instead of `.glass-surface` / `--elev-sheet`.
- `btn btn-primary uppercase` — Apple never uppercases button labels, and nothing else in this app does.
- **Nested `<label>` inside `<label>`** (`:5`→`:7`, `:27`→`:29`) — invalid HTML; the visible field
  names are `<span>`s with no `for`/`id` association, so screen readers announce placeholder only.
- `autofocus` on **both** username and password (`:20`, `:44`).
- Error state paints only the _username_ field red (`:14`, `:18`) though the failure is for the
  credential pair — §16 _Grouping & mapping_ inverted.
- Error text has no `aria-live`, so it is never announced.

### 7. The 404 page traps the user

`pages/[...all].vue` is one sentence with **no link out**. §16 _Wayfinding_ is explicit: never trap
the user. It also nests a `hero min-h-screen` inside `PageWithLinks`'s own padding (double chrome)
and uses `min-h-screen` rather than `dvh`, so it overflows under the iOS URL bar.

---

## P1 — Consistency failures

### 8. Eight glass recipes; five ignore the accessibility queries

`.glass-surface` (`main.css:1020-1031`) is the app's material, and
`main.css:1049-1062` makes it respond to `prefers-reduced-transparency` and `prefers-contrast`.
Only **three** components use it.

| Surface                              | Background                | Blur | Saturate | Radius             | Shadow                 |
| ------------------------------------ | ------------------------- | ---- | -------- | ------------------ | ---------------------- |
| `.glass-surface` **(token)**         | `base-200` 68%            | 16px | 180%     | caller             | `--elev-sheet` + inset |
| `ScrollableView.vue:38` top bar      | `base-200/72`             | 24px | 150%     | —                  | —                      |
| `ScrollableView.vue:126` scroll pill | `base-200/70`             | 24px | —        | `--control-radius` | `shadow-lg`            |
| `FuzzySearchModal.vue:5`             | `base-200/95`             | 24px | —        | `rounded-xl`       | `shadow-2xl`           |
| `SettingsModal.vue:81` subview       | `base-200/85`             | 40px | 150%     | —                  | —                      |
| `common/DropdownMenu.vue:13`         | `base-100/85`             | 24px | 150%     | `rounded-2xl`      | `shadow-xl`            |
| `common/ToastItem.vue:10`            | _(none for default type)_ | 12px | —        | `rounded-2xl`      | `shadow-xl`            |
| `LogViewer/TopBarStatWidget.vue:8`   | `base-200/85`             | 12px | —        | `--control-radius` | `shadow-lg`            |

Five blur radii, six opacities, four corner radii, saturation applied at random, and every shadow
bypassing `--elev-popover` / `--elev-sheet` for a Tailwind step. Five of the eight are invisible to
both accessibility queries.

`ToastItem.vue:10` has a further problem: only `error`/`info`/`warning` get a `bg-*` class
(`:14-16`), so a **default toast is fully transparent** over a 12px blur.

`SettingsModal.vue:81` is worse than inconsistent — it is inert. It nests
`backdrop-blur-2xl` **inside** `.glass-surface`, and `main.css:1016-1019` warns in writing that a
`backdrop-filter` ancestor is a backdrop root, so a nested filter samples nothing. The blur does
not render; the compositing pass runs anyway.

**Fix:** delete all seven hand-rolled recipes. Add `--glass-opacity` variants
(`.glass-surface-sheer` for menus, existing `-thick` for sheets) and apply `.glass-surface` +
`--control-radius` everywhere. For the settings subview, drop the filter entirely and use an
opaque `base-200` push.

### 9. Five dropdown implementations, three opening mechanisms

| Component                     | Opens on            | Trigger element         | Surface                            | Animation  |
| ----------------------------- | ------------------- | ----------------------- | ---------------------------------- | ---------- |
| `common/DropdownMenu.vue`     | click (`<details>`) | `<summary class="btn">` | `base-100/85` glass, `rounded-2xl` | enter only |
| `common/Dropdown.vue`         | **focus**           | `<label tabindex=0>`    | `base-200` opaque, `rounded-box`   | none       |
| `ContainerDropdown.vue`       | focus               | `<button role=button>`  | `base-100` opaque, `rounded-box`   | none       |
| `ContainerActionsToolbar.vue` | **hover**           | `<label tabindex=0>`    | `.glass-surface`                   | none       |
| `LogViewer/LogActions.vue`    | **hover**           | `<button>`              | `base-200` opaque, `rounded-box`   | none       |

Five materials, three mechanisms, one animation between them. §16 _Familiarity_: "things that look
the same must behave the same."

`DropdownMenu.vue` additionally:

- animates in (`:64-73`) and **hard-cuts out** — §7 requires enter and exit along the same path;
- sets `transform-origin: top` on a `dropdown-end` panel, so it grows from the wrong corner
  (§7 anchored origins — should be `top right`);
- overrides the system's own button doctrine on its trigger (`:4`): `border-base-content/15
bg-base-100 hover:border-primary/50` re-introduces the hairline `main.css:434-437` deliberately
  removed, and moves hover onto border colour where every other control uses a fill step;
- has no Escape-to-close;
- uses `<a>` without `href` for items (`:17`) — **not keyboard focusable at all**.

That last point is app-wide: **31 `<a @click>` elements with no `href`** across 17 files. None of
them can be reached by Tab.

### 10. Five parallel status-chip systems

1. `.status-pill` + 5 tones — `main.css:1095-1116`. Bordered, mono, uppercase, `tracking-wider`, `rounded` (2px).
2. `.state-chip` + `.tone-*` — `ContainerTable.vue:276-296`. Borderless, sans, capitalize, `rounded-full`.
3. daisyUI `.badge` variants — `HostNode.vue:16`, `AlertCard.vue:49`, `CloudDestinationForm.vue:56`, `LogAnalytics.vue:60,79`.
4. `.badge[data-level]` with an `!important` light-theme override — `ContainerActionsToolbar.vue:103,376-382`.
5. daisyUI `.status` dots — `ContainerDropdown.vue:29`.

Four of the five describe container/host state. There is no reason for more than one.

### 11. `.section-heading` and `.count` are copy-pasted and have already drifted

Defined twice — `pages/index.vue:101-107` and `ContainerTable.vue:268-274` — for two headings that
sit **side by side on the same screen**, and the opacities have already diverged
(`text-base-content/45` vs `/50`). This is the DRY failure predicted by duplicating rather than
promoting to `main.css`.

### 12. Two entry points to notifications with two different chromes

`pages/notifications.vue` renders `NotificationsPanel` under an `h2 text-2xl font-bold` page
header; `Settings → Notifications` renders the identical panel as a drill-in subview with an
`h2 text-base font-semibold`. Same content, two navigation models, two type treatments.

### 13. Press feedback exists on 4 surfaces out of ~20

§1 is the foundation: respond on pointer-down. `main.css:468` gives every `.btn` a
`scale(0.97)`, and `HostTile.vue:87`, `SettingsPanels.vue:399,408` do it properly. Nothing else
does. **No `:active` state** on: container table rows, log rows, sidebar rows, command-palette
rows, any dropdown menu item, toast action buttons, or the pin toggle.

`ContainerTable.vue:41-70` is the sharpest case — rows have no hover state, no press state, and
only the _name cell_ is clickable, so the row is a target that looks like one and is not.

### 14. Mobile nav height is hard-coded twice, and disagrees with itself

`main.css:212` declares `--mobile-nav-height: 57px` precisely so the bar, status row and log
padding stay locked. `common/MobileMenu.vue:33` then writes `h-[calc(100svh-55px)]` — a second,
different magic number for the same bar.

`MobileMenu` also uses an **opaque** `bg-base-200` with a hard `border-b`, where §12 wants
translucent chrome with content scrolling under it and a scroll-edge fade — which
`ScrollableView.vue` already implements correctly on desktop. And its search control is
`<a class="btn" @click>` (`:10`) with no `href`: not focusable.

### 15. Scrollbar theme uses hardcoded colours; browser chrome colour is wrong

`App.vue:34-58` hardcodes `rgba(128,128,128,.33)`, `slategrey`, `#777`, `#353535` — theme-blind,
token-blind, and `outline: 1px solid slategrey` on a thumb is wrong in both themes.
`display: content` (`:36`) is not a valid CSS value.

`App.vue:21` sets `theme-color` to `#121212` / `#F5F5F5`, but the actual top surfaces are
`--color-base-100` = `oklch(25%)` ≈ `#3B3B3B` dark and `oklch(100%)` = `#FFF` light. The iOS
status bar therefore does not match the app behind it.

### 16. `odd:bg-gray-400/[0.07]` zebra striping

`LogViewer/LogList.vue` styles alternating rows with a raw Tailwind `gray-400`, bypassing
`--fill-*` and both themes. Beyond the token bypass: zebra striping is a data-table convention.
Console.app, Xcode and Terminal all render logs on one uninterrupted surface and separate lines by
leading and the level gutter.

---

## P2 — Motion doctrine

### 17. The gesture layer does not exist

A grep for `pointerdown`, `setPointerCapture`, `touchstart`, `useSwipe`, `useDraggable`,
`velocity`, or any spring library returns **nothing** outside of `auto-imports.d.ts` (which merely
lists what VueUse _could_ provide). Splitpanes' own drag is the only 1:1 tracking in the product.

Everything else is a fixed-duration CSS transition. That means, categorically:

- **§2 direct manipulation** — nothing is draggable.
- **§3 interruptibility** — no animation can be grabbed or reversed mid-flight. Every transition
  runs to completion regardless of input. This is called out as "the single most important
  principle."
- **§5 velocity handoff** — no gesture produces a velocity, so nothing can receive one.
- **§6 momentum projection** — no flick lands anywhere.
- **§9 rubber-banding** — no soft boundaries.

Not every surface needs this; a log viewer is a reading tool. But four surfaces are conspicuous:

- `common/SideDrawer.vue` — a full-height right panel with no swipe-to-dismiss and, at
  `translate-x-24` (6rem), a 96px nudge standing in for a push.
- `common/MobileMenu.vue` — a mobile drawer opened by a checkbox, closed by a checkbox.
- The settings and command-palette sheets on mobile — no drag-down dismiss.
- `Splitpanes` pane collapse — `main.css:757` animates `width` over 300ms with no velocity from
  the drag that preceded it.

### 18. `SideDrawer` presents modally with no scrim

`common/SideDrawer.vue:2` sets `backdrop:bg-none`, and `:64` gives the panel
`shadow-none`. It is a `showModal()` dialog, so it _does_ block the page — but nothing on
screen says so. §12: "Dim to focus, separate to keep flow" — a blocking task pairs the surface
with a dimming scrim. Every other dialog in `layouts/default.vue` uses `.modal-scrim`; this one
opts out. Its `bg-base-100` opaque body is also the only sheet in the app that is not glass.

### 19. Two modals in the same layout, two opening behaviours

`layouts/default.vue:51` puts `transition-none!` on the command palette, so **Cmd+K hard-cuts
in**; `:65` leaves the settings dialog with daisyUI's default transition. Two peer sheets, one
file, different physics. §12 also asks glass to _materialize_ — animate blur radius and scale
together — rather than fade.

### 20. Unguarded animation

`prefers-reduced-motion` is handled in 17 files, which is better than most codebases, and missing
in exactly the places motion is most aggressive:

| File                            | Animation                          | Note                                                   |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `SidePanel.vue:73-85`           | `side-accent-in` keyframes         | fires on every route change                            |
| `common/DropdownMenu.vue:64-73` | `dropdown-in` keyframes            |                                                        |
| `common/ToastModal.vue:23-36`   | `transition: all` ×2               | `all` also animates `backdrop-filter` and `box-shadow` |
| `ScrollableView.vue:334-391`    | 5 transitions                      | includes a `cubic-bezier(0.34,1.56,0.64,1)` overshoot  |
| `LogViewer/LogList.vue`         | `pops`, `log-permalink-pulse 1.4s` |                                                        |
| `main.css:178-180`              | `animate-bounce-fast`              | attention bounce on new logs                           |

`ScrollableView.vue:336`'s back-out overshoot also breaks §4: bounce is earned by a gesture that
carried momentum. Clicking a collapse chevron carries none.

### 21. Tap targets

Apple's minimum is 44×44pt. Measured:

| Element                                            | Size        |
| -------------------------------------------------- | ----------- |
| `ContainerTitle.vue:9` pin toggle                  | **16px**    |
| `FuzzySearchModal.vue:126` pin-column              | **16px**    |
| `ToastItem.vue:63` dismiss                         | 24px        |
| `Search.vue` inverse / clear (`btn-circle btn-xs`) | ~24px       |
| `LogActions.vue:31,41` (`btn-xs`)                  | ~24px       |
| `ContainerActionsToolbar.vue:7` (`w-8`)            | 32px        |
| `SegmentedControl` `dense`                         | 32px        |
| `Search.vue` collapsed                             | 36px        |
| `CloudSearchInline.vue`                            | 36px        |
| `ScrollableView.vue:132,144`                       | **44px ✅** |

14 uses of `btn-xs` app-wide. The pin — the title bar's primary gesture — is 16px.

---

## P3 — Typography

### 22. There is no type scale

§15: build hierarchy from weight + size + leading _as a set_. There is no set. The same semantic
level — "title of this panel" — is rendered nine ways:

| Treatment                              | Where                                                             |
| -------------------------------------- | ----------------------------------------------------------------- |
| `text-2xl font-bold`                   | `notifications.vue:5`, `DestinationForm.vue:4`, `AlertForm.vue:4` |
| `text-2xl`                             | `Terminal.vue:5`                                                  |
| `text-xl font-semibold tracking-tight` | `SettingsPanels.vue` ×6                                           |
| `text-xl font-bold`                    | `WelcomeModal.vue:8,47`                                           |
| `text-xl leading-tight font-semibold`  | `LogAnalytics.vue:6`                                              |
| `text-lg font-semibold`                | `cloud/search.vue:6`                                              |
| `text-lg font-bold`                    | `CloudSettingsCard.vue:114`                                       |
| `text-lg`                              | `LogDetails.vue:4`, `CloudLogDetails.vue:9`                       |
| `text-base font-semibold`              | `SettingsModal.vue:19,30`                                         |
| `card-title`                           | `CloudDestinationForm.vue:87`                                     |

Uppercase micro-headers fare no better: `.section-heading` at `text-xs tracking-wider` with two
different opacities, versus `NotificationsPanel.vue:5,48` at default size, `tracking-wide`, `/60`.

### 23. Tracking is not size-specific

§15 is unambiguous: a fixed `letter-spacing` is wrong somewhere. Large display text wants negative
tracking; small text wants slightly positive. In practice `tracking-tight` is applied to exactly
one size in one file (`SettingsPanels.vue`), while every `text-2xl font-bold` heading elsewhere
runs at tracking `0` — visibly loose at that size. `tracking-wide` and `tracking-wider` are used
interchangeably for the same uppercase-label role.

### 24. The heading outline is broken

- Pages start at `<h2>` — there is no `<h1>` on the dashboard, the container view, or notifications.
- `<h1>` appears only inside drawers (`LogAnalytics.vue:6`, `LogDetails.vue:4`,
  `CloudLogDetails.vue:9`) and `Terminal.vue:5`.
- `<h2>` is used for **subtitles under an `<h1>`**: `Terminal.vue:6` is "Started 5m ago";
  `LogDetails.vue:7` is a timestamp. These are captions marked up as second-level headings.

Screen-reader heading navigation is unusable as a result.

### 25. Pixel-locked font sizes

`text-[12px]`, `text-[11.5px]`, `text-[11px]`, `text-[10.5px]` (plus `.stat-card .name` and
`.stat-caption` at `font-size: 10px` in `main.css:1080,1088`) do not scale with the user's
text-size preference. §15: spacing and type in `rem`/`em`, not fixed px.

### 26. Tooltips are mouse-only and can render off-screen

`Popup.vue` positions at `left + width + 10` with **no viewport collision handling**, so a tooltip
on any right-edge element renders past the window. It binds `mouseenter`/`mouseleave` only — never
appears on keyboard focus, never on touch. And `rounded-sm` (2px) makes it the sharpest corner in
an app whose box radius is 8px.

---

## What was done

All five phases landed. Format, typecheck, 177 frontend tests, the Go suite and
the production build are green.

### Phase 1 — Token adoption _(findings 4, 5, 11, 14, 15, 16, 25)_

- `--color-*-text` applied at all 21 remaining foreground sites; the only raw
  accents left are chart _fills_ (`tone-class`), where the vivid form is the point.
- Timestamps moved to `--color-info-text` (2.96:1 → 4.5:1+ on light).
- `.section-heading` / `.section-count` promoted to `main.css`; both drifted copies deleted.
- `MobileMenu`'s `55px` literal replaced by `--mobile-nav-height`.
- Scrollbars re-tokenised (`--fill-1/2`), invalid `display: content` removed, the
  `slategrey` outline dropped, and `theme-color` now read from `--color-base-100`
  instead of two literals that matched neither theme.
- Log zebra striping moved from a raw `gray-400` to `--fill-4`.
- Every pixel-locked font size converted to `rem`, including the two in `main.css`.

### Phase 2 — Accessibility and touch _(findings 1, 2, 3, 6, 7, 9, 21)_

- **`dropdown-hover` eliminated everywhere** (4 components). Menus are now
  press-to-open on real `<button aria-haspopup aria-expanded>`, closing on
  Escape (with focus restored to the trigger) and on outside pointerdown.
- **Log-row actions exist on touch**: new `.reveal-on-hover` utility drops to
  `opacity: 1` under `@media (pointer: coarse)`.
- **31 unfocusable `<a @click>` converted to `<button>`** with `role="menuitem"`;
  menus got `role="menu"`, the command palette got full
  combobox/listbox/`aria-activedescendant` semantics.
- **`/show` blank-page hang fixed** — `{ immediate: true }` plus a real loading
  state, a slow-path escape hatch, and a not-found screen.
- **Three dead-end screens given a way out**: the 404 and both container-not-found
  pages, all now `dvh` rather than `screen`.
- **`login.vue` rebuilt** on the design system: shared `.input`/`TextField`,
  `.glass-surface`, real `<label for>` associations, one `autofocus`, an
  `aria-live` error for the credential _pair_, no `uppercase`.
- **Level marks carry shape as well as hue** (disc / ring / squared / half) on a
  new per-theme `--level-*` ramp — worst case 4.39:1, against 1.81:1 and 2.96:1 before.
- **Tap targets**: new `.hit-44` utility overflows a 44px area around controls
  that must stay visually small (pin, toast dismiss, search buttons, palette pin);
  the rest were enlarged outright.
- `SegmentedControl` got roving tabindex + arrow/Home/End, which its
  `role="radiogroup"` had been promising and not delivering.
- Toasts: `role="alert"` for error/warning, and pause on focus and touch, not
  hover alone.
- **Destructive container actions (stop / restart / update) now arm before they
  fire**, matching the settings reset's two-step.

### Phase 3 — Material and component consolidation _(findings 8, 10, 12, 13)_

- **8 glass recipes → 1**, via new `.glass-surface-sheer` / `-popover` weights.
  All five surfaces that were invisible to `prefers-reduced-transparency` and
  `prefers-contrast` now respond to both. The inert nested blur in the settings
  drill-in is gone.
- **5 dropdowns → 1 behaviour**, one material, one radius, symmetric enter/exit,
  `transform-origin` following the alignment.
- **5 chip systems → `.status-pill`**, with a `-dot` modifier; the
  `.badge[data-level]` `!important` hack deleted in favour of a tonal pill.
- **`.row-pressable` press feedback** on every row-shaped target; container-table
  rows are now clickable along their whole length.
- Toast type became a _tint on the material_ — which also fixed the default
  toast rendering fully transparent.
- `MobileMenu` given translucent chrome with content passing under it.
- Notifications now has one presentation instead of two.

### Phase 4 — Typography _(findings 22, 23, 24)_

- A real scale in `main.css` — `type-display / title / heading / body / caption /
section` — each fixing size, weight, leading and tracking **as a set**, with
  tracking negative on the large steps and positive on the caption step.
- Applied across all 10 title treatments and all 3 micro-header treatments.
- Heading outline repaired: one `<h1>` per page, and the captions that were
  marked up as `<h2>` ("Started 5m ago", a bare timestamp) are `<p>` again.

### Phase 5 — Motion _(findings 17, 18, 19, 20, 26)_

- **A real gesture layer**: `composable/dismissGesture.ts` implements §2/§3/§5/§6
  properly — pointer capture with grab-offset-preserving 1:1 tracking, a sampled
  velocity window, rubber-banded boundaries, Apple's exponential-decay
  projection (`d = 0.998`) to decide dismiss-vs-return, and a per-frame
  critically-damped spring **handed the release velocity**. Interruptible by
  construction: a new press mid-settle picks the surface up where it is.
  Applied to `SideDrawer` (swipe right) and `MobileMenu` (swipe up).
- **`SideDrawer` got its scrim**, and the veil now lifts in step with the drag.
- **One sheet presentation** for both dialogs — they _materialise_ (blur + scale
  together) rather than fade, and the palette no longer hard-cuts in.
- Every unguarded animation guarded (11 files). One subtlety worth noting:
  `ContainerMenuItem` clears its state from `@animationend`, so reduced motion
  collapses that animation to 1ms rather than removing it — `animation: none`
  would have stranded the "new container" spinner forever.
- The unearned back-out overshoot on the stat widget removed; `transition: all`
  on toasts replaced with named properties.
- `Popup` tooltips gained viewport collision handling (they rendered off-screen
  near the right edge) and now appear on keyboard focus, not mouse only.
- `TimedButton`'s countdown fill moved off a hardcoded `bg-white/30`, which was
  invisible on the light theme. Its animation is deliberately _kept_ under
  reduced motion: it is the only signal of the deadline.

### Follow-up: the drawer panels redesigned

The right-hand drawer was outside the original audit's findings and turned out to
be the least designed surface in the app. Five panels — log details, cloud log
details, SQL analytics, the terminal, and the alert/destination forms — each
invented their own header, and the drawer positioned a close button _absolutely
over_ whatever the panel happened to put in that corner. Nothing was sticky, so
titles scrolled away; no two panels agreed on where anything lived (§16
Familiarity); and §16 Wayfinding's "where am I / how do I get out" was answered
by a floating glyph that overlapped content.

**`DrawerPanel.vue`** is now the shared chrome for all six: a sticky translucent
title bar carrying an eyebrow (the category), the title (the specific thing), a
subtitle, an actions slot, and the close control as a real row item rather than
an overlay. Its rule is a scroll edge — it draws itself only once content passes
beneath — and the body scrolls under it. `flush` hands the body over entirely for
a panel that reaches the sheet's edges and scrolls itself. `SideDrawer` gave up
its floating button and its padding; the panel owns both.

**`LogDetails` was reordered around what you actually opened it for.** It led
with a three-column grid of metadata under `font-thin` labels, then the raw JSON,
then a fields table — so the _log line_ was the third block down and the loudest
thing on screen was a container name you already knew. Now: the message first
(one surface with a Formatted/Raw segmented control instead of two always-visible
renderings of the same payload), then its fields, then provenance last.

Three smaller things fell out of that:

- The fields table carried a `<caption>` reading "Fields are sortable by dragging
  and dropping". §16 again — if you need a label to explain a control, the
  mapping is weak. Every row has a visible grip now, dragging is bound to it, and
  the caption is gone.
- The per-row visibility **switch became a checkmark**. A switch is for a setting
  you are configuring; this is a selection within a list, and eleven switches
  stacked vertically read as a settings screen that wandered into an inspector.
- The metadata grid became an **inset grouped list** — Apple's list shape,
  promoted to `main.css` from the settings sheet, which was the only place that
  had it. The label is the quiet one and the value is what you read; the grid had
  that backwards.

`CloudLogDetails` is the same screen deliberately, since it describes the same
kind of object — the only difference (the container may no longer exist) is one
pill rather than a different layout.

Two defects fixed while there: the JSON wells were bordered in a hardcoded
`border-white/20`, invisible on the light theme, and are tonal now; and the
terminal refit only on _window_ resize, which was sufficient while its height was
`calc(100svh - 50px)` but not once the height comes from the panel's flex layout
— that resolves after mount, so the initial `fit()` could size the terminal
against a zero-height box. It observes its own element now, which covers both the
first layout and later panel resizes.

One dependency added: `@types/sortablejs` (dev). `sortablejs` ships no
declarations, so VueUse's `UseSortableOptions` resolved to an error type and the
three-argument `useSortable` overload could not be satisfied — which is why the
old call passed no options and could not restrict dragging to a handle.

### Corrections after review

Three things in the first pass were wrong and were fixed on feedback. Recorded
because the reasoning matters more than the diff:

**The top bar cast a sheet shadow over the logs.** Reusing `.glass-surface` for
full-width chrome brought `--elev-sheet` with it — a 56px-blur drop shadow
raking down over the first rows of the log list, which read as a rendering
fault. The `shadow-none rounded-none border-0` written at the call site never
applied: `.glass-surface` is deliberately _unlayered_ (so the
reduced-transparency and increased-contrast queries can reach it), and unlayered
rules beat Tailwind's layered utilities regardless of source order. Fixed with a
peer variant, `.glass-surface-chrome`, which keeps the material, the blur and
the top-edge highlight and drops the border, radius and elevation. A bar is not
a card: it has nothing to cast a shadow onto. Applied to the log top bar and the
mobile nav.

**The search field stopped matching the buttons beside it.** Enlarging the
collapsed state to `size-11` to reach a 44px target made it visibly taller than
every neighbouring `btn-sm`, which breaks the one thing a control bar is for.
It is back to `w-8` with the target coming from `.hit-44`, which overflows the
hit area without changing the box — the same technique already used for the pin
and the toast controls. `overflow-hidden` moved to the expanded state only,
since it would otherwise clip that overflowing target.

**The search field flashed a scroll gutter on open.** Moving `overflow-hidden`
off the root to make room for the collapsed state's overflowing hit area, and
then failing to re-add it to the expanded state, left the field unclipped while
it animated. Its contents are `v-show`n, so they lay out at full size the
instant search opens while the box is still 32px wide — spilling past the bar
for the length of the animation, overflowing the row, and flashing a scroll
gutter. It is on the expanded state now and off the collapsed one, which is what
both states actually need.

**The level chip in the actions menu came out as a solid blob.** `[data-level]`
was a bare attribute selector that _painted_ — saturated backgrounds with
`!important`, living unscoped inside `LogLevel.vue`. That leak was load-bearing
(the detail drawer's level Tag relied on it) and also a trap: anything anywhere
carrying a `data-level` attribute inherited a background it never asked for. The
new chip hit exactly that — it took the solid fill _and_ set a matching text
colour, so the label was the same colour as the background under it.

Fixed by splitting resolution from presentation: `[data-level]` now only sets a
`--lvl` variable and paints nothing, and two named classes opt in — `.level-fill`
(solid: the log gutter's dot, the detail drawer's Tag) and `.level-pill` (tonal:
a level read as a label). Both read the same ramp, so a level is one colour
wherever it appears, and nothing is coloured by accident again.

The pill's text is derived (`oklch(from var(--lvl) …)`) rather than being `--lvl`
itself: that ramp is tuned to read as a _mark_ against the log surface, and as
12px type on a 12% wash of itself it measured 3.7–4.1:1 on light. Deriving it
holds the hue and forces the lightness — 5.43:1 light, 6.33:1 dark — and leaves
the gutter's dots untouched, which matters: a chip in a menu should not be the
reason the marks beside every log line change colour.

While there: the dot's `show-unknown` binding was `:class="{ showUnknown }"`,
which emits `showUnknown` and never matched the `.show-unknown` selector. Latent
rather than visible, since no caller sets the prop, but corrected.

**The command palette and settings sheet lost their glass.** The materialize
transition was first written as `filter: blur()` on the modal box, ramping 6px →
0 as the sheet arrived. It looked right and silently flattened every glass
surface inside it: per Filter Effects, _any_ `filter` value other than `none` —
`blur(0)` included — makes the element a **Backdrop Root**, and a
`backdrop-filter` on a descendant may not sample past its nearest backdrop root.
So both sheets were blurring an empty backdrop and rendering as flat tint. This
is the same trap `main.css` already documents for _nested_ `backdrop-filter`,
reached from the other direction — and worth the note, because `blur(0)` reads
like "no filter" and is not.

The box animates position and opacity only now. The material still materialises,
but on the surface's own `backdrop-filter` rather than a `filter` over it — which
is what §12 asks for in the first place, and what the dropdown menus already did.

**The mobile nav bar was three filled discs.** Search, settings and the menu
toggle were each a `btn btn-circle` — 48px circles filled with the grey that
every pressable button in the app wears — sitting in a row under the logo. An
iOS bar button item is a _plain glyph_: no surface at rest, tinted with the
label colour, and a fill only while pressed. Three solid discs read as three
unrelated controls competing for the same attention, which is the opposite of
what a navigation bar is for.

They are quiet glyphs now, on a `.bar-item` that is deliberately not `.btn`
(that class is what supplies the grey). Each keeps a full 44pt target around a
24px glyph, presses with a fill and a scale, and the one item that _has_ a state
— the menu toggle — is the only one that carries a fill, and only while the menu
is open. The row is 44pt, and the items sit shoulder to shoulder: the old
`gap-2` existed to keep three heavy shapes from colliding, and quiet glyphs read
as one group.

**A bright hairline appeared above the log top bar.** `.glass-surface-chrome`
kept `.glass-surface`'s inset top highlight. That highlight exists because light
catching the top edge is a real trait of a pane _floating_ in front of
something — but a bar anchored flush to the top of its pane has no top edge for
light to catch, so it was not reading as a material at all, just a bright rule
across the top of the log view. Most visible on the dark theme, where it had the
most to contrast against. Chrome drops it.

Removing it surfaced a second, quieter bug. `.glass-surface` sets `border: 1px
solid …` and `.glass-surface-chrome` sets `border: 0`, both **unlayered** — so
the `border-b` and `border-base-content/10` that the drawer panel and the mobile
nav were using for their bottom rules are Tailwind utilities that lose the
cascade to both, and neither rule had ever rendered. The bar's content-facing
edge is now an inset box-shadow driven by a `--chrome-edge` custom property:
settable from anywhere, and costing no layout, so a scroll edge can appear and
disappear without shifting the bar's contents — which was the point of a scroll
edge to begin with.

**The search field's inline buttons filled it wall to wall.** Bumping them from
`btn-xs` (24px) to `btn-sm` (32px) to chase a 44px target left no inset at all
inside a 32px field, so they read as jammed into it rather than sitting in it.
The `.hit-44` added alongside was buying nothing either — the expanded field is
`overflow-hidden`, which clips it. Back to 24px with a 4px inset, and the target
compromise stated plainly: 44px is geometrically impossible inside a 32px inline
field without making the whole toolbar taller, these two are secondary controls
with other routes (Esc clears), and the _collapsed_ search control — the primary
target, and the one with room — does take a full 44px.

**Per-level dot shapes were reverted.** Giving each level its own silhouette
(disc / ring / squared / half-pill) so that level did not rest on hue alone was
the wrong fix for a dense gutter: running down hundreds of rows the shapes did
not read as a scale, they read as damage — the ring came out as a speck with a
hole, the half-pill looked like a clipping bug, and the square broke the
column's rhythm. A signal nobody can decode is not an accessibility feature. The
mark is one uniform filled dot again. The colour-only concern is answered where
it actually helps: the mark carries its level as an accessible name, and the
per-theme `--level-*` ramp still fixes the real contrast failures (warn at
1.81:1 on light, debug at 2.96:1 on dark → 4.39:1 worst case).

### One regression caught during the work

The first cut of the shared menu composable registered its Escape and
outside-press listeners on mount. `LogActions` mounts one per log row, and the
log view holds up to 400 — roughly 800 document listeners, all firing on every
keystroke and click. Both listeners now attach only while a menu is actually open.

---

## Verification

| Check                   | Result                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `prettier --check`      | all files clean                                             |
| `pnpm typecheck`        | pass                                                        |
| `pnpm test`             | 177 passed (23 files)                                       |
| `make test` (Go)        | all packages ok                                             |
| `pnpm build`            | ✓ built                                                     |
| `make int` (Playwright) | **not run** — Docker daemon unavailable in this environment |

Three snapshots were updated, all for markup this work deliberately changed
(the level mark's `role`/shape, and the log-row action trigger).

**Outstanding:** the Playwright visual suite has not been run, and Phase 3 changes
rendered pixels across most specs. Run `make int` with Docker up, then regenerate
via the `update-int-snapshots` skill.

---

## Fix plan

Ordered so that each phase leaves the app shippable, and the cheap high-yield work lands first.

### Phase 1 — Token adoption sweep _(mechanical, ~1 day, no design decisions)_

Nothing here needs a judgement call; all of it is applying rules `main.css` already states.

1. `text-primary`/`text-secondary` → `-safe` at the 13 meaningful sites in finding #5.
2. `LogDate.vue` → `var(--color-info-text)`.
3. Promote `.section-heading` / `.count` to `main.css`; delete both copies (#11).
4. `MobileMenu.vue` → `var(--mobile-nav-height)`; delete the `55px` literal (#14).
5. `App.vue` scrollbars → `--fill-3` / `--fill-2` / `--separator`; drop `outline: slategrey`; fix
   `display: content`; drive `theme-color` from `--color-base-100` (#15).
6. `LogList.vue` zebra → `--fill-4`, or remove (#16).
7. Replace the four `text-[Npx]` sizes and the two 10px `main.css` declarations with `rem` (#25).

**Verify:** `pnpm typecheck && pnpm test && pnpm build`, then a light-theme pass with a contrast
checker on the log view and dashboard.

### Phase 2 — Accessibility and touch _(high user impact)_

8. Kill `dropdown-hover` in all four components; convert triggers to
   `<button aria-haspopup="menu" aria-expanded>`; add Escape and outside-tap close (#1).
9. `@media (pointer: coarse) { [data-logs] .dropdown > button { opacity: 1 } }` so log actions
   exist on touch (#1).
10. Convert the 31 `<a @click>` with no `href` to `<button>` (or add `href` where they navigate).
    Add `role="menu"`/`role="menuitem"` to menu panels, and `role="listbox"`/`role="option"` +
    `aria-activedescendant` to the command palette (#9).
11. Fix `pages/show.vue`: `{ immediate: true }` plus a real loading state (#2).
12. Fix `pages/[...all].vue`: add a dashboard link, drop the nested hero, `dvh` not `screen` (#7).
13. Rewrite `pages/login.vue` against the system: `.input` + `.focus-fill`, `.glass-surface`,
    un-nest the labels with real `for`/`id`, one `autofocus`, error on the form not the username
    field, `aria-live="polite"` on the message, drop `uppercase` (#6).
14. Give `LogLevel` per-theme lightness and a non-colour channel (#3).
15. Raise tap targets to 44px — pin toggle, toast dismiss, search buttons, the 14 `btn-xs` uses,
    the actions-toolbar trigger (#21). Where the visual must stay small, expand the hit area with a
    pseudo-element rather than the drawn box.
16. Add `role="alert"` to error toasts; pause the dismiss timer on focus and on touch, not only on
    `mouseenter` (#8).
17. Add roving-tabindex arrow-key navigation to `SegmentedControl`'s radiogroup.

**Verify:** full keyboard-only pass (Tab through every menu, palette, and settings screen); a
touch pass in device emulation on the log view; axe-core over the dashboard, container view, and
settings.

### Phase 3 — Material and component consolidation _(the consistency work)_

18. Add `.glass-surface-sheer` (menus, ~72%) alongside `-thick` (sheets, 92%). Convert all seven
    hand-rolled recipes to `.glass-surface` + a variant + `--control-radius`. Replace
    `shadow-lg/xl/2xl` with `--elev-popover` / `--elev-sheet`. Give `ToastItem` a default
    background. Remove the inert nested blur in `SettingsModal.vue:81` (#8).
19. Collapse the five dropdowns to **one** `DropdownMenu`: click-to-open, `.glass-surface-sheer`,
    `--control-radius`, `transform-origin` matching the alignment, symmetric enter/exit,
    Escape-to-close, real button semantics. Delete `Dropdown.vue`; reduce `ContainerDropdown` and
    the two action toolbars to content slots (#9).
20. Collapse the five chip systems to `.status-pill` + tones; delete `.state-chip`, the
    `.badge[data-level]` override and its `!important`, and the daisyUI `.badge` uses (#10).
21. Add `:active` press feedback to every row-shaped target — table rows, log rows, sidebar rows,
    palette rows, menu items — reusing `HostTile`'s values (`scale(0.985)` + a fill step). Make the
    whole container-table row a link (#13).
22. Give `MobileMenu` the translucent chrome + scroll-edge treatment `ScrollableView` already uses (#14).
23. Route notifications through one presentation; make `pages/notifications.vue` a thin route onto
    the settings subview, or drop the standalone page (#12).

**Verify:** `make int` (Playwright), then regenerate visual snapshots via the
`update-int-snapshots` skill — phase 3 changes rendered pixels across most specs.

### Phase 4 — Typography system

24. Define a scale in `main.css` as utilities (`.type-title`, `.type-section`, `.type-label`,
    `.type-body`, `.type-caption`), each fixing size + weight + leading + tracking as a set, with
    tracking negative on the large steps and slightly positive on the caption step (#22, #23).
25. Apply across the 10 title treatments and the 3 micro-header treatments.
26. Fix the heading outline: one `<h1>` per page, captions as `<p>`/`<span>` not `<h2>` (#24).

### Phase 5 — Motion _(scoped; do not gesture-ify everything)_

27. Guard the six unguarded animations; replace `transition: all` in `ToastModal`; drop the
    back-out overshoot in `ScrollableView` (#20).
28. Give `SideDrawer` a scrim and the shared sheet material (#18).
29. Unify the two dialog presentations in `layouts/default.vue` — one materialize transition
    (blur + scale together), applied to both (#19).
30. Introduce **one** gesture, properly, as the reference implementation: swipe-to-dismiss on
    `SideDrawer`. Pointer Events with `setPointerCapture`, 1:1 tracking honouring the grab offset,
    a short velocity history, rubber-band resistance past the closed edge, momentum projection
    (`d = 0.998`) to decide dismiss-vs-return, and velocity handed to the settling spring. Once
    that exists as a composable (`useDismissGesture`), extend it to `MobileMenu` and the mobile
    sheets (#17).

Adding a spring library is worth it only at step 30; steps 27–29 are pure CSS. If step 30 is out of
scope, say so explicitly in `EXP_FEATURES.md` rather than leaving §2/§3/§5/§6 silently unmet.

---

## What already meets the bar

Worth stating, so the fix plan does not disturb it:

- `main.css` fill/elevation/focus/switch systems — correct Apple values with reasoning recorded.
- The derived `--color-*-text` ramp — solved across all nine accents against every surface.
- `SegmentedControl.vue` — concentric geometry from one padding token, `--control-thumb`,
  `--elev-thumb`, reduced-motion handled.
- `HostTile.vue` — tonal not outlined, press feedback before navigation, chevron leaning into the
  transition, `prefers-contrast` and `prefers-reduced-motion` both handled.
- `ContainerTitle.vue`'s pin — real rotation semantics on both layers, symmetric in both directions.
- `SettingsPanels.vue` — inset separators, whole-row press states, two-step destructive confirm
  with a stated reason for not using an undo toast.
- `layouts/default.vue`'s splitter — visible-at-rest grabber, hit area overflowing both panes
  without taking layout width.
- `ScrollableView.vue`'s scroll-edge header and measured content inset.
- `index.vue`'s continuous `edge-fade` mask.
