<template>
  <!-- Horizontal padding gives the menu rows' hover shift (translateX) and the
       active accent bar room to render without being clipped by the carousel's
       overflow-x (which is there for snap-scrolling between menus). -->
  <div class="w-full min-w-full shrink-0 snap-start snap-always px-1.5 py-0.5">
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
