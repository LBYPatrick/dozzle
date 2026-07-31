<template>
  <!-- Alignment follows the content. A two-line toast hangs its icon and close
       button off the first line (top-aligned, nudged onto the title's optical
       centre); a one-line toast centres all three. The old markup did the
       former unconditionally with hand-tuned `mt-0.5`/`pt-0.5` offsets, so a
       single-line toast — which is most of them, every setting confirmation
       included — sat its text about a pixel above the icon and the close
       button, and the row read as slightly crooked. -->
  <div
    class="group border-base-content/10 relative flex max-w-sm gap-3 overflow-hidden rounded-2xl border p-3.5 pr-2.5 shadow-xl backdrop-blur-md max-md:w-full"
    :class="[
      multiline ? 'items-start' : 'items-center',
      {
        'bg-error/90 text-error-content': toast.type === 'error',
        'bg-info/90 text-info-content': toast.type === 'info',
        'bg-warning/90 text-warning-content': toast.type === 'warning',
      },
    ]"
    role="status"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <component
      :is="toast.type === 'info' ? CarbonInformation : CarbonWarningAlt"
      class="size-5 shrink-0"
      :class="{ 'mt-0.5': multiline }"
    />

    <div class="min-w-0 flex-1">
      <h3 class="text-sm leading-tight font-semibold" v-if="toast.title">{{ toast.title }}</h3>
      <div
        v-if="toast.message"
        v-html="toast.message"
        class="text-sm leading-snug opacity-90 [&>a]:underline"
        :class="{ 'mt-0.5': toast.title }"
      ></div>
    </div>

    <div class="shrink-0" :class="{ 'mt-0.5': multiline }">
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
import CarbonInformation from "~icons/carbon/information";
import CarbonWarningAlt from "~icons/carbon/warning-alt";

const {
  toast,
  expire = -1,
  timed,
} = defineProps<{
  // Toast payload; kept loosely typed to avoid importing the internal type.
  toast: { id: string; title?: string; message: string; type: string; action?: { label: string; handler: () => void } };
  expire?: number;
  timed?: number;
}>();

const emit = defineEmits<{ dismiss: [] }>();

// Two lines only when there is genuinely a second line to hang off. A toast
// carrying just a message (the setting confirmations) is one line, same as one
// carrying just a title.
const multiline = computed(() => Boolean(toast.title && toast.message));

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
