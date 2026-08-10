<template>
  <div class="animate-background h-1 w-1/2 bg-radial to-transparent to-75%" :class="colorClass"></div>
</template>
<script setup lang="ts">
const { color = "primary" } = defineProps<{ color: "primary" | "error" | "secondary" }>();

const colorClass = computed(() => {
  switch (color) {
    case "primary":
      return "from-primary";
    case "error":
      return "from-error";
    case "secondary":
      return "from-secondary";
  }
});
</script>

<style scoped>
.animate-background {
  animation: gradient-animation 3s ease-out infinite;
}

@keyframes gradient-animation {
  0%,
  100% {
    transform: translateX(0%);
  }
  50% {
    transform: translateX(100%);
  }
}

/* An infinite sweep is the textbook case for reduced motion: it never stops,
   it is large, and it is purely decorative once the bar itself is visible. The
   bar stays — it is what says "working" — and holds still. */
@media (prefers-reduced-motion: reduce) {
  .animate-background {
    animation: none;
  }
}
</style>
