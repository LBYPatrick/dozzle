<template>
  <!-- The fill is not decoration, it is the deadline: this button fires on its
       own unless you stop it, and the sweep is the only thing saying how long
       is left. So it survives `prefers-reduced-motion` deliberately — §14 keeps
       what aids comprehension — and it is a one-shot linear fill on a small
       control, not a loop or a moving background. -->
  <button class="btn relative overflow-hidden" @click="cancel()">
    <!-- `currentColor`, not `bg-white/30`. A white wash is invisible on a light
         button, so on the light theme the countdown could not be seen at all. -->
    <div class="absolute inset-0 origin-left bg-current/25" ref="progress"></div>
    <div>
      <slot></slot>
    </div>
  </button>
</template>

<script lang="ts" setup>
const progress = ref<HTMLElement>();
const finished = defineEmit();
const cancelled = defineEmit();
let animation: Animation | undefined;

const { duration = 4000 } = defineProps<{
  duration?: number;
}>();

onMounted(async () => {
  animation = progress.value?.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
    duration: duration,
    easing: "linear",
    fill: "forwards",
  });
  try {
    await animation?.finished;
    finished();
  } catch (e) {
    progress.value?.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], {
      duration: 0,
      fill: "forwards",
    });
    cancelled();
  }
});

const cancel = () => {
  animation?.cancel();
};
</script>

<style scoped></style>
