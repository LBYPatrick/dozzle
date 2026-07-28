<template>
  <!-- The two panes cross over each other rather than taking turns. The old
       `mode="out-in"` emptied the viewport between the leave and the enter, so a
       drill-down read as two unrelated flashes; running them together (with the
       outgoing pane lifted out of flow) makes it one continuous push. -->
  <div class="relative">
    <transition :name="!slideRight ? 'slide-left' : 'slide-right'">
      <div v-if="!slideRight" key="left">
        <slot name="left" />
      </div>
      <div v-else key="right">
        <slot name="right" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
const { slideRight } = defineProps<{ slideRight: boolean }>();
</script>
<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    opacity 180ms ease,
    transform 260ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* The outgoing pane leaves the flow so the incoming one owns the height for the
   whole transition — no collapse-then-grow jump between the two. */
.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: opacity 120ms ease;
    transform: none;
  }
}
</style>
