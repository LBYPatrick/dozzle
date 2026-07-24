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
.toast-enter-active {
  transition: all 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
.toast-leave-active {
  transition: all 220ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.96);
}
.toast-move {
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
