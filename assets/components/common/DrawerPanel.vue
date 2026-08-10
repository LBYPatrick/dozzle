<template>
  <!-- The shared chrome for everything the right-hand drawer shows.
       Before this, all five panels invented their own: a bare `<header>` in a
       flow-scrolling page, no sticky title, and a close button positioned
       absolutely by the drawer *over* whatever the panel happened to put in
       that corner. So the title scrolled away, the close control overlapped
       content, and no two panels agreed on where anything was — §16
       Familiarity, and §16 Wayfinding's "where am I / how do I get out".

       One shape now: a title bar that stays put, a body that scrolls under it,
       and a scroll edge that draws itself only once there is something passing
       beneath. -->
  <div class="flex h-full min-h-0 flex-col">
    <header
      class="glass-surface glass-surface-sheer glass-surface-chrome sticky top-0 z-20 flex shrink-0 items-center gap-3 px-4 py-3 md:px-6"
      :style="{
        '--chrome-edge': scrolled ? 'color-mix(in oklab, var(--color-base-content) 12%, transparent)' : 'transparent',
      }"
    >
      <slot name="leading" />

      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Eyebrow first, title second. The eyebrow is the category ("Log
             entry", "Terminal"); the title is the specific thing. Reading order
             follows §16 Wayfinding: what kind of screen, then which one. -->
        <p v-if="eyebrow" class="type-section truncate">{{ eyebrow }}</p>
        <h1 class="type-heading truncate">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="$slots.subtitle" class="type-caption text-base-content/60 mt-0.5 truncate">
          <slot name="subtitle" />
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <slot name="actions" />
        <!-- The close control belongs to the panel's title bar, not floating in
             the sheet's corner. `hit-44` keeps a full target on a control drawn
             at toolbar size. -->
        <form method="dialog" class="flex">
          <button
            class="btn btn-sm btn-square hit-44 group relative"
            :aria-label="$t('button.cancel')"
            :title="$t('button.cancel')"
          >
            <mdi:close class="size-4 transition-transform duration-200 group-hover:rotate-90" />
          </button>
        </form>
      </div>
    </header>

    <!-- `flush` hands the body over entirely: no padding and no scrolling of
         our own, for a panel that reaches the sheet's edges and does its own
         scrolling (the terminal, which has a scrollback of its own — nesting it
         inside a second scroller gives you two scrollbars and a viewport that
         never fits). -->
    <div
      ref="body"
      class="min-h-0 flex-1"
      :class="flush ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain px-4 py-5 md:px-6'"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const { flush = false } = defineProps<{
  /** Quiet category label above the title. */
  eyebrow?: string;
  /** Plain-text title; use the `title` slot for anything richer. */
  title?: string;
  /** Body gets no padding — for panels that fill to the sheet's edges. */
  flush?: boolean;
}>();

// The header's rule is a scroll edge, not a decoration: it appears only once
// content is actually passing under the bar, so a short panel reads as one
// uninterrupted surface. The border is always in the box model and only changes
// colour, so nothing shifts when it appears.
const body = useTemplateRef<HTMLElement>("body");
const scrolled = ref(false);
useEventListener(body, "scroll", () => (scrolled.value = (body.value?.scrollTop ?? 0) > 0), { passive: true });
</script>
