<template>
  <!-- Alignment follows the content. A two-line toast hangs its icon and close
       button off the first line (top-aligned, nudged onto the title's optical
       centre); a one-line toast centres all three. The old markup did the
       former unconditionally with hand-tuned `mt-0.5`/`pt-0.5` offsets, so a
       single-line toast — which is most of them, every setting confirmation
       included — sat its text about a pixel above the icon and the close
       button, and the row read as slightly crooked. -->
  <div
    class="group glass-surface glass-surface-popover relative flex max-w-sm gap-3 overflow-hidden rounded-2xl p-3.5 pr-2.5 max-md:w-full"
    :class="[
      multiline ? 'items-start' : 'items-center',
      // Tonal over the material, not a 90%-opaque colour laid on top of it.
      // The flat fills defeated the blur they sat on, and a toast with no type
      // matched none of them at all — so a default toast was fully transparent
      // with only a border and a 12px blur to it.
      `tone-${toast.type}`,
    ]"
    :role="toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
    @pointerdown="pause"
  >
    <component
      :is="toast.type === 'info' ? CarbonInformation : CarbonWarningAlt"
      class="size-5 shrink-0"
      :class="{ 'mt-0.5': multiline }"
    />

    <div class="min-w-0 flex-1">
      <p class="text-sm leading-tight font-semibold" v-if="toast.title">{{ toast.title }}</p>
      <div
        v-if="toast.message"
        v-html="toast.message"
        class="text-sm leading-snug opacity-90 [&>a]:underline"
        :class="{ 'mt-0.5': toast.title }"
      ></div>
    </div>

    <div class="flex shrink-0 items-center gap-1" :class="{ 'mt-0.5': multiline }">
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
      <template v-else>
        <!-- A plain action, not a countdown: TimedButton is for something about
             to happen unless you stop it, whereas this is for something already
             done that you can take back. -->
        <!-- Both of these were well under a 44px target — the dismiss was 24px.
             `.hit-44` overflows a full-size hit area around the drawn control
             rather than inflating the toast, which has to stay compact. -->
        <button
          v-if="toast.action"
          class="hit-44 relative min-h-8 rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-current/15"
          @click="runAction"
        >
          {{ toast.action.label }}
        </button>
        <button
          class="hit-44 relative flex size-8 items-center justify-center rounded-full transition-colors hover:bg-current/15"
          :aria-label="$t('button.cancel')"
          @click="$emit('dismiss')"
        >
          <mdi:close class="size-4" />
        </button>
      </template>
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

// The action always closes the toast: it has been taken, so the offer is spent.
function runAction() {
  toast.action?.handler();
  emit("dismiss");
}

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

<style scoped>
/* Type as a tint on the shared material. `--tone` is set once per type and
   feeds the wash, the leading edge and the icon; the body text stays
   base-content, which is the readable colour on this surface in both themes —
   the `*-content` colours it replaces were chosen to sit on a *saturated*
   fill, and there is no longer one. */
.tone-info,
.tone-error,
.tone-warning {
  background-image: linear-gradient(
    color-mix(in oklab, var(--tone) 16%, transparent),
    color-mix(in oklab, var(--tone) 16%, transparent)
  );
  border-color: color-mix(in oklab, var(--tone) 40%, transparent);
}

.tone-info {
  --tone: var(--color-info);
}
.tone-error {
  --tone: var(--color-error);
}
.tone-warning {
  --tone: var(--color-warning);
}

/* The icon and the progress bar carry the tone; the copy does not need to. */
.tone-info :deep(svg:first-of-type),
.tone-error :deep(svg:first-of-type),
.tone-warning :deep(svg:first-of-type) {
  color: var(--tone-text);
}

.tone-info {
  --tone-text: var(--color-info-text);
}
.tone-error {
  --tone-text: var(--color-error-text);
}
.tone-warning {
  --tone-text: var(--color-warning-text);
}
</style>
