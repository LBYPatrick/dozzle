<template>
  <!-- Translucent chrome with the content passing under it, which is what §12
       asks of a nav bar and what ScrollableView already does on desktop. This
       was an opaque `bg-base-200` with a hard 1px rule under it — a strip the
       page ends at rather than a layer it floats beneath. The bottom edge is a
       scroll-edge hairline, not a permanent divider. -->
  <nav
    class="glass-surface glass-surface-sheer glass-surface-chrome pt-safe fixed top-0 z-30 w-full"
    style="--chrome-edge: color-mix(in oklab, var(--color-base-content) 12%, transparent)"
    data-testid="navigation"
  >
    <div class="px-2">
      <!-- A navigation bar, not a toolbar of buttons.
           These were three `btn btn-circle` — 48px discs filled with the grey a
           pressable button wears — sitting in a row. iOS bar button items are
           plain glyphs: no background at rest, tinted with the label colour, and
           a fill only while pressed. Three solid discs read as three unrelated
           controls shouting for the same attention, which is the opposite of
           what a nav bar is for.

           The row is 44pt, each item is a 44pt target, and state is carried by
           tint rather than by a permanent disc. -->
      <div class="flex h-14 items-center">
        <router-link :to="{ name: '/' }" class="bar-item" :aria-label="$t('title.dashboard', 0)">
          <Logo class="h-7 w-7" />
        </router-link>

        <!-- Bar items sit shoulder to shoulder. The `gap-2` between discs was
             there to keep three heavy shapes from colliding; quiet glyphs read
             as one group and want to be close. -->
        <div class="ml-auto flex items-center">
          <!-- A button, not an <a> with a click handler: without an href an
               anchor is not focusable, so this was unreachable by keyboard. -->
          <button
            type="button"
            class="bar-item"
            @click="$emit('search')"
            :title="$t('tooltip.search')"
            :aria-label="$t('tooltip.search')"
          >
            <mdi:magnify class="size-6" />
          </button>
          <!-- Settings lives in the sidebar on desktop, which is hidden here, so
               keep an entry to the popup on mobile. -->
          <button
            type="button"
            class="bar-item"
            :title="$t('button.settings')"
            :aria-label="$t('button.settings')"
            @click="openSettings()"
          >
            <mdi:cog-outline class="size-6" />
          </button>
          <!-- The menu is the bar's primary item, and the only one with an open
               state — so it is the only one that gets a fill, and only while it
               is actually open. -->
          <label
            class="bar-item swap swap-rotate"
            :class="{ 'is-open': show }"
            data-testid="hamburger"
            :title="$t(show ? 'button.cancel' : 'label.host-menu')"
          >
            <input type="checkbox" v-model="show" :aria-label="$t('label.host-menu')" :aria-expanded="show" />
            <mdi:close class="swap-on size-6" />
            <mdi:hamburger-menu class="swap-off size-6" />
          </label>
        </div>
      </div>

      <transition name="fade">
        <!-- The bar's height is declared once, in main.css, precisely so the
             bar, the status row below it and the log padding stay locked
             together. This was a second, different magic number (55 against
             57) for the same measurement.

             Swipe up to dismiss, along the same axis the drawer arrives on —
             the gesture and the transition describe the same movement, so
             putting it away by hand and by button feel like one thing. -->
        <div
          v-show="show"
          ref="sheet"
          class="drawer-sheet flex h-[calc(100svh-var(--mobile-nav-height))] px-2"
          :class="{ 'is-dragging': gesture.dragging.value }"
          :style="{ transform: gesture.offset.value ? `translateY(${-gesture.offset.value}px)` : '' }"
          v-bind="gesture.handlers"
        >
          <SideMenu class="flex-1" />
        </div>
      </transition>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import Logo from "@/logo.svg";
import { useSettingsModal } from "@/composable/settingsModal";
import { useDismissGesture } from "@/composable/dismissGesture";
const route = useRoute();
const { openSettings } = useSettingsModal();

const show = ref(false);
watch(route, () => {
  show.value = false;
});

// Swipe up to put the drawer away — the direction it already leaves in.
const sheet = useTemplateRef<HTMLElement>("sheet");
const reduceMotion = usePreferredReducedMotion();
const gesture = useDismissGesture({
  axis: "y",
  // Dragging *up* is the dismissal, so positive offset is negative clientY.
  direction: -1,
  onDismiss: () => (show.value = false),
  extent: () => sheet.value?.clientHeight ?? 0,
  enabled: () => reduceMotion.value !== "reduce",
});

// The transition takes over once it is closed; the drag offset must not still
// be applied when it next opens.
watch(show, () => gesture.reset());
</script>
<style scoped>
@reference "@/main.css";

/* An iOS bar button item: a glyph with a 44pt target around it, no surface of
   its own until you touch it. Deliberately not `.btn` — that carries the grey
   tertiary fill every pressable button in the app wears, which is exactly the
   look a nav bar should not have. */
.bar-item {
  display: inline-grid;
  place-content: center;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  border-radius: 999px;
  color: var(--color-base-content);
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 120ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Feedback on the press, not on the release. */
.bar-item:active {
  background-color: var(--fill-3);
  transform: scale(0.9);
}

.bar-item:focus-visible {
  outline: none;
  background-color: var(--focus-fill);
}

@media (hover: hover) {
  .bar-item:hover {
    background-color: var(--fill-4);
  }
}

/* Open is a state worth showing, so the one item that has one takes the accent
   — a tonal wash plus the readable foreground, the same language the sidebar
   uses for the current route. */
.bar-item.is-open {
  background-color: color-mix(in oklab, var(--color-primary) 16%, transparent);
  color: var(--color-primary-text);
}

@media (prefers-reduced-motion: reduce) {
  .bar-item {
    transition:
      background-color 150ms ease,
      color 150ms ease;
  }

  .bar-item:active {
    transform: none;
  }
}

/* The drawer comes down out of the bar and goes back up into it — one path,
   both directions (§7). It was Tailwind's bare `transition-opacity` /
   `transition-transform` at their default 150ms linear-ish curve; this is the
   app's own timing so the sheet moves like everything else does. */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-active > div,
.fade-leave-active > div {
  transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

.fade-enter-from > div,
.fade-leave-to > div {
  @apply -translate-y-10;
}

/* Nothing between the finger and the sheet while it is being dragged. */
.is-dragging {
  transition: none !important;
}

/* The drawer scrolls its own list vertically, so the browser has to be told the
   vertical drag may be ours; without this the gesture is cancelled the moment
   it starts. (`ref` is a compile-time binding, not a rendered attribute — it
   cannot be selected on.) */
.drawer-sheet {
  touch-action: pan-y;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active > div,
  .fade-leave-active > div {
    transition: none;
  }

  .fade-enter-from > div,
  .fade-leave-to > div {
    @apply translate-y-0;
  }
}
</style>
