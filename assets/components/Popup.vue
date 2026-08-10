<template>
  <slot></slot>
  <teleport to="body">
    <transition name="fade">
      <div
        v-show="show && (delayedShow || globalShow)"
        class="glass-surface glass-surface-sheer glass-surface-popover fixed z-50 rounded-[var(--control-radius)] p-3"
        role="tooltip"
        ref="content"
      >
        <slot name="content"></slot>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { globalShowPopup } from "@/composable/popup";

const globalShow = globalShowPopup();
const show = ref(globalShow.value);
const delayedShow = refDebounced(show, 1000);
const content = ref<HTMLElement>();

/**
 * Place the tooltip beside its anchor, then pull it back inside the viewport.
 *
 * It used to write `left + width + 10` and `top` straight out with no collision
 * handling at all, so a tooltip on anything near the right edge — which, in a
 * sidebar-plus-log layout, is most things — rendered partly or entirely off
 * screen. Now it flips to the other side when there is no room, and clamps on
 * both axes as a backstop.
 */
function place(anchor: HTMLElement) {
  const el = content.value;
  if (!el) return;

  const GAP = 10;
  const MARGIN = 8;
  const rect = anchor.getBoundingClientRect();
  // Measured after it is laid out but before it is positioned, so the size is
  // the real one rather than whatever it was the last time it was shown.
  const { offsetWidth: w, offsetHeight: h } = el;

  // Prefer the trailing side; flip to the leading side if it will not fit.
  let x = rect.right + GAP;
  if (x + w > window.innerWidth - MARGIN) x = rect.left - GAP - w;
  x = Math.min(Math.max(MARGIN, x), window.innerWidth - w - MARGIN);

  const y = Math.min(Math.max(MARGIN, rect.top), window.innerHeight - h - MARGIN);

  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

const open = (e: Event) => {
  show.value = true;
  globalShow.value = true;
  if (e.target instanceof HTMLElement) nextTick(() => place(e.target as HTMLElement));
};

const dismiss = () => {
  show.value = false;
  globalShow.value = false;
};

const el: Ref<HTMLElement> = useCurrentElement();
const anchor = () => el.value?.nextElementSibling;
useEventListener(anchor, "mouseenter", open);
useEventListener(anchor, "mouseleave", dismiss);
// Keyboard reaches this too. A tooltip bound to mouseenter alone is invisible
// to anyone tabbing through the interface, which is the group most likely to
// need the label it carries.
useEventListener(anchor, "focusin", open);
useEventListener(anchor, "focusout", dismiss);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}
</style>
