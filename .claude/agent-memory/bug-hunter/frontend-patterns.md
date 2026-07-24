---
name: frontend-patterns
description: Vue frontend reactivity, module-singleton, and settings patterns confirmed in the assets/ codebase (bug-prone areas)
metadata:
  type: project
---

# Frontend bug-prone patterns (assets/)

## Module-level singleton state shared across component instances

- `composable/search.ts`: `searchQueryFilter/showSearch/inverseFilter` are module-level refs (one global). `Search.vue` calls `onUnmounted(() => resetSearch())`, so ANY ScrollableView unmount (pinned column close, page nav) wipes the shared search for all views. Column/pinned mode mounts multiple `Search.vue` (one per ScrollableView header) → cross-column interference + focus fight (immediate watch).
- `composable/scrollControls.ts`: single-slot `handlers = ref(...)` (NOT a counter). Multiple ScrollableViews overwrite it (last-mount wins); unmounting the last clears it even while others remain → palette scroll cmds target wrong view / `canScroll` wrongly false. Contrast `composable/inlineSearch.ts` which correctly uses a `count` ref. Prefer the counter/stack pattern for multi-instance providers.

## Reactivity facts (confirmed)

- `Container.movingAverage` = `unref(Ref<Stat>)` getter → reactive when read in computeds (dep tracked; EMA reassigns `.value`).
- `Container.state` is a plain (non-ref) constructor property; state-based `.filter(c=>c.state==='running')` recompute relies on the containing array/store being reactive, not on `state` itself.
- `useLoggingContext()` returns `toRefs(reactive(...))`; `jumpToOldest`/`reconnect` are set on the raw reactive obj by `useLogStream` and read as refs (`.value`) in ScrollableView — consistent.
- Settings store uses `useStorage(..., {mergeDefaults:true})` so new keys (e.g. topBarCollapsed/primaryColor) are back-filled for old localStorage; `toRefs(settings.value)` at module load is safe.

## settings.applySettings (stores/settings.ts)

- Only checks `typeof incoming[key] === typeof DEFAULT`. Enum-string settings (lightTheme, size, hourStyle, groupContainers, cpuDisplayMode, locale) accept ANY string; number settings (menuWidth) accept any number (no range clamp). Invalid `lightTheme` → `data-theme` garbage breaks theming. Import path even fetches arbitrary URLs. Comment overstates the protection (it stops type mismatch, not invalid enum values).

## ScrollableView layout (major rewrite)

- Fixed-height internal scroller: `main` overflow-auto, floating `absolute` header, `main` padding-top = measured `barHeight` (default 48, never reset to 0). IntersectionObservers use viewport root (no `root`), but `main`'s overflow clip is an intermediate clip so paused/atTop detection still works — however `rootMargin:"40px"` is nullified by that clip (buffer lost; paused flips at exact edge).
- Scroll progress (`scrollContext.progress/currentDate`) is written ONLY by `LogViewer/LogList.vue` and ONLY when `containers.length === 1`; multi-container views leave progress at default 1.
