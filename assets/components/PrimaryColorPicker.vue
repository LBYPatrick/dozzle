<template>
  <!-- The one control a fill shift cannot mark, because the fill *is* the value.
       So the shared `.focus-fill` tint is joined by a lift, and selection is the
       check glyph over a hairline inside the swatch's own edge. The selected state
       used to be 2px of ring plus 2px of offset drawn *inset*, which ate 4px into
       a 28px swatch and left the colour as a small disc behind a heavy band. -->
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="color in PRIMARY_COLORS"
      :key="color.id"
      type="button"
      class="focus-fill swatch relative size-7 rounded-full ring-1 ring-black/10 transition-transform duration-150 ring-inset hover:scale-110"
      :class="{ selected: primaryColor === color.id }"
      :style="{ backgroundColor: color.swatch }"
      :title="color.name"
      :aria-label="color.name"
      :aria-pressed="primaryColor === color.id"
      @click="primaryColor = color.id"
    >
      <mdi:check v-if="primaryColor === color.id" class="absolute inset-0 m-auto size-4 text-white drop-shadow" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { PRIMARY_COLORS } from "@/composable/primaryColor";
import { primaryColor } from "@/stores/settings";
</script>

<style scoped>
/* A hairline just inside the swatch's edge, in the panel's own colour, so the
   chosen swatch reads as ringed without any of its colour being given up. 1.5px
   inset, against the 4px the old treatment took. */
.swatch.selected {
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--color-base-100) 90%, transparent);
}

/* Focus also lifts, since a 16% tint over a saturated swatch is a small change
   and this is the one control whose surface cannot carry the whole signal. */
.swatch:focus-visible {
  transform: scale(1.12);
}

@media (prefers-reduced-motion: reduce) {
  .swatch:focus-visible {
    transform: none;
  }
}
</style>
