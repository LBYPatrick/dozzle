<template>
  <!-- Tonal health chip: a tinted square carrying a colored glyph, no outline.
       The tint is derived from the glyph color, so one rule covers every state. -->
  <div
    class="health inline-flex size-4 items-center justify-center rounded-[5px]"
    :health
    v-if="health"
    :title="health"
  >
    <cil:check-circle class="size-3" v-if="health == 'healthy'" />
    <cil:x-circle class="size-3" v-else-if="health == 'unhealthy'" />
    <cil:circle class="size-3" v-else />
  </div>
</template>

<script lang="ts" setup>
import { ContainerHealth } from "@/types/Container";

defineProps<{
  health: ContainerHealth | undefined;
}>();
</script>

<style scoped>
@reference "@/main.css";

.health {
  @apply text-base-content/60;
  background-color: color-mix(in oklab, currentColor 18%, transparent);
}

[health="unhealthy"] {
  @apply text-red;
}

[health="healthy"] {
  @apply text-green;
}

[health="starting"] {
  @apply text-orange;
}
</style>
