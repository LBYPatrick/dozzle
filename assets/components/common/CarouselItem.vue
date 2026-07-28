<template>
  <div class="w-full min-w-full shrink-0 snap-start snap-always px-1.5 py-0.5">
    <!-- Horizontal padding (px) gives the active accent bar, which sits outside
         the row's own box, room to render without being clipped by the
         carousel's overflow-x (there for snap-scrolling between menus). Keep
         this the single root element — the carousel reads $el for scroll/
         IntersectionObserver, and a top-level comment would break that. -->
    <slot />
  </div>
</template>

<script lang="ts" setup>
const { id, title } = defineProps<{ id: string; title?: string }>();

defineExpose({
  id,
  title,
});
</script>

<style scoped></style>
