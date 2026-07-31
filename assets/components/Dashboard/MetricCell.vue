<template>
  <!-- One figure in the fleet summary. Deliberately not a card: it carries no
       border, no radius and no shadow of its own, because it is a cell inside a
       single grouped surface. Four bordered cards side by side is four objects
       to parse before you read a number; one surface with hairlines between its
       cells is one object with four facts in it.

       Nothing here is tinted either. The figure stays in the text colour and
       the accent is spent on the graphic below it — colour is how the data is
       distinguished, not how the furniture is decorated. -->
  <div class="bg-base-100 flex flex-col overflow-hidden p-3.5">
    <span class="label">{{ label }}</span>

    <div class="mt-1 flex items-baseline gap-1.5">
      <span class="value">{{ value }}</span>
      <span v-if="unit" class="unit min-w-0 truncate">{{ unit }}</span>
    </div>

    <span class="sub mt-0.5 truncate">{{ sub }}</span>

    <!-- The visual bleeds to the cell's edges. Inset inside the padding it
         reads as a second object sitting in the cell; bled, it reads as the
         cell's own texture, which is what a sparkline is for. -->
    <div class="-mx-3.5 mt-2.5 -mb-3.5 flex h-8 items-end max-sm:hidden">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  label,
  value,
  unit = "",
  sub = "",
} = defineProps<{
  label: string;
  /** The figure. Large, tabular, and the only thing at size in the cell. */
  value: string;
  /** Rides the figure's baseline — a unit, or the scale it is out of. */
  unit?: string;
  /** One line of context under the figure. */
  sub?: string;
}>();
</script>

<style scoped>
@reference "@/main.css";

/* Tracking is size-specific: small uppercase text reads cramped and wants its
   letters opened up, the figure at 24px reads slack at the same setting and
   pulls its own back in. */
.label {
  @apply text-base-content/45 truncate text-[0.65rem] font-semibold tracking-wider uppercase;
}

.value {
  @apply text-2xl leading-none font-semibold tabular-nums;
  letter-spacing: -0.02em;
}

.unit,
.sub {
  @apply text-base-content/45 text-xs leading-tight tabular-nums;
}

@media (prefers-contrast: more) {
  .label,
  .unit,
  .sub {
    @apply text-base-content/75;
  }
}
</style>
