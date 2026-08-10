<template>
  <TransitionGroup
    tag="div"
    name="toast"
    class="toast toast-end max-md:toast-center max-md:toast-bottom z-100 gap-2 whitespace-normal max-md:w-full max-md:px-2"
  >
    <ToastItem
      v-for="{ toast, options } in toasts"
      :key="toast.id"
      :toast="toast"
      :expire="options.expire ?? -1"
      :timed="options.timed"
      @dismiss="removeToast(toast.id)"
    />
  </TransitionGroup>
</template>

<script lang="ts" setup>
const { toasts, removeToast } = useToast();
</script>

<style scoped>
/* Named properties, not `all`. A toast is a glass surface, and `transition:
   all` swept its backdrop-filter and box-shadow into the animation as well —
   two of the most expensive things on the compositor, animated on every toast
   for no reason anyone asked for. */
.toast-enter-active {
  transition:
    opacity 300ms cubic-bezier(0.32, 0.72, 0, 1),
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
.toast-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.96);
}
.toast-move {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 160ms ease;
  }
  .toast-move {
    transition: none;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
