<template>
  <div class="flex flex-wrap items-center gap-2">
    <button
      v-for="color in PRIMARY_COLORS"
      :key="color.id"
      type="button"
      class="ring-base-content/40 focus-visible:ring-primary relative size-7 rounded-full ring-1 ring-black/10 transition-transform duration-150 ring-inset hover:scale-110 focus:outline-none focus-visible:ring-2"
      :class="{ 'ring-base-content/50! ring-2! ring-offset-2': primaryColor === color.id }"
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
