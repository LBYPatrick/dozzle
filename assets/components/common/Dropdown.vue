<template>
  <!-- A pull-down whose panel is arbitrary content rather than a list of
       options (the account menu). Same opening behaviour and same material as
       DropdownMenu — it used to open on *focus*, via a `<label tabindex=0>`
       with a blur-on-mousedown dance to fake a toggle, and wore an opaque
       `bg-base-200` panel that matched none of the app's other menus. -->
  <div class="dropdown" :class="{ 'dropdown-open': open }" ref="root">
    <button
      type="button"
      ref="trigger"
      class="btn btn-circle btn-sm"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <slot name="trigger"></slot>
    </button>
    <transition name="menu-pop">
      <div
        v-if="open"
        class="dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 mt-1 min-w-52 origin-top-right rounded-[var(--control-radius)] p-2"
        @click="onItemClick"
      >
        <slot name="content"></slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);
</script>

<style scoped>
/* Same enter/exit as DropdownMenu — one menu language, so a panel that opens
   from a trigger behaves identically wherever it appears. */
.menu-pop-enter-active {
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-pop-leave-active {
  transition:
    opacity 120ms ease,
    transform 160ms cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .menu-pop-enter-active,
  .menu-pop-leave-active {
    transition: opacity 120ms ease;
  }

  .menu-pop-enter-from,
  .menu-pop-leave-to {
    transform: none;
  }
}
</style>
