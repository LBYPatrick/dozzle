<template>
  <div
    class="group border-base-content/10 relative flex max-w-sm items-start gap-3 overflow-hidden rounded-2xl border p-3.5 pr-2.5 shadow-xl backdrop-blur-md max-md:w-full"
    :class="{
      'bg-error/90 text-error-content': toast.type === 'error',
      'bg-info/90 text-info-content': toast.type === 'info',
      'bg-warning/90 text-warning-content': toast.type === 'warning',
    }"
    role="status"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <carbon:information class="mt-0.5 size-5 shrink-0" v-if="toast.type === 'info'" />
    <carbon:warning-alt class="mt-0.5 size-5 shrink-0" v-else />

    <div class="min-w-0 flex-1 pt-0.5">
      <h3 class="text-sm leading-tight font-semibold" v-if="toast.title">{{ toast.title }}</h3>
      <div
        v-if="toast.message"
        v-html="toast.message"
        class="mt-0.5 text-sm leading-snug opacity-90 [&>a]:underline"
      ></div>
    </div>

    <div class="shrink-0">
      <TimedButton
        v-if="timed"
        class="btn-sm border-current/30 bg-current/15 text-current hover:bg-current/25"
        :duration="timed"
        @finished="
          $emit('dismiss');
          toast.action?.handler();
        "
        @cancelled="$emit('dismiss')"
      >
        {{ toast.action?.label }}
      </TimedButton>
      <button
        v-else
        class="flex size-6 items-center justify-center rounded-full transition-colors hover:bg-current/15"
        :aria-label="$t('button.cancel')"
        @click="$emit('dismiss')"
      >
        <mdi:close class="size-4" />
      </button>
    </div>

    <!-- Dismiss progress bar: depletes over the expire window and pauses while
         hovered (both the bar and the actual dismissal). -->
    <div
      v-if="showBar"
      class="absolute inset-x-0 bottom-0 h-1 origin-left bg-current/40"
      :style="{ transform: `scaleX(${fraction})` }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
const { expire = -1, timed } = defineProps<{
  // Toast payload; kept loosely typed to avoid importing the internal type.
  toast: { id: string; title?: string; message: string; type: string; action?: { label: string; handler: () => void } };
  expire?: number;
  timed?: number;
}>();

const emit = defineEmits<{ dismiss: [] }>();

// Only self-dismissing (expire) toasts get the bar; `timed` toasts count down on
// their own button, and expire<=0 toasts stay until closed.
const showBar = computed(() => !timed && expire > 0);

const fraction = ref(1);
let remaining = expire;
let startedAt = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let raf = 0;

function tick() {
  const elapsed = Date.now() - startedAt;
  fraction.value = Math.max(0, (remaining - elapsed) / expire);
  raf = requestAnimationFrame(tick);
}

function start() {
  if (!showBar.value) return;
  startedAt = Date.now();
  timer = setTimeout(() => emit("dismiss"), remaining);
  raf = requestAnimationFrame(tick);
}

function pause() {
  if (!showBar.value || timer === undefined) return;
  clearTimeout(timer);
  timer = undefined;
  cancelAnimationFrame(raf);
  remaining = Math.max(0, remaining - (Date.now() - startedAt));
}

function resume() {
  if (!showBar.value || timer !== undefined) return;
  start();
}

onMounted(start);
onBeforeUnmount(() => {
  clearTimeout(timer);
  cancelAnimationFrame(raf);
});
</script>
