<template>
  <!-- Swatches carry the shared ring language: the same 2px/2px geometry marks
       the chosen colour (neutral hue) and keyboard focus (accent). The selected
       state used to be 2px of ring plus 2px of offset drawn *inset*, which ate
       4px into a 28px swatch and left the colour itself as a small disc in the
       middle — the check glyph already says "chosen", so the ring only has to
       separate the swatch from the panel. -->
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="color in PRIMARY_COLORS"
      :key="color.id"
      type="button"
      class="focus-ring relative size-7 rounded-full ring-1 ring-black/10 transition-transform duration-150 ring-inset hover:scale-110"
      :class="{ 'selected-ring': primaryColor === color.id }"
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
