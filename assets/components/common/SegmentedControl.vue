<template>
  <!-- Segmented control, current Apple styling: a recessed translucent track
       carrying one raised capsule that slides between options. The selected
       capsule is a full-contrast surface with a hairline edge and a lift shadow
       (not a faint tint), so the choice reads at a glance in both themes.
       Single-select (radio semantics). -->
  <div ref="root" class="track relative inline-flex rounded-[10px] p-[3px]" role="radiogroup">
    <div
      class="indicator pointer-events-none absolute top-[3px] bottom-[3px] left-0 rounded-[7px]"
      :style="indicatorStyle"
    ></div>
    <button
      v-for="(opt, i) in options"
      :key="String(opt.value)"
      :ref="(el) => setBtn(el, i)"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      class="relative z-10 rounded-[7px] px-3 py-1 text-sm whitespace-nowrap transition-[color,transform] duration-150 focus-visible:outline-none active:scale-[0.96]"
      :class="
        model === opt.value
          ? 'text-base-content font-semibold'
          : 'text-base-content/55 hover:text-base-content/85 font-medium'
      "
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script lang="ts" setup generic="T">
const model = defineModel<T>();
const { options } = defineProps<{ options: { label: string; value: T }[] }>();

const select = (value: T) => {
  model.value = value;
};

const root = ref<HTMLElement>();
const btns = ref<(HTMLElement | null)[]>([]);
const setBtn = (el: unknown, index: number) => {
  btns.value[index] = (el as HTMLElement) ?? null;
};

// Position the raised capsule over the selected segment. Uses transform + width
// so the move animates; hidden until measured to avoid a flash from left:0.
const indicatorStyle = ref<Record<string, string>>({ opacity: "0" });

function update() {
  const index = options.findIndex((o) => o.value === model.value);
  const el = btns.value[index];
  if (!el || el.offsetWidth === 0) {
    indicatorStyle.value = { opacity: "0" };
    return;
  }
  indicatorStyle.value = {
    transform: `translateX(${el.offsetLeft}px)`,
    width: `${el.offsetWidth}px`,
    opacity: "1",
  };
}

watch(
  () => [model.value, options.length],
  () => nextTick(update),
  { immediate: true },
);
onMounted(() => nextTick(update));
// Re-measure when the control resizes or becomes visible (e.g. tab switch).
useResizeObserver(root, () => update());
</script>

<style scoped>
.track {
  background-color: color-mix(in oklab, var(--color-base-content) 11%, transparent);
  box-shadow: inset 0 1px 2px rgb(var(--shadow-ink) / 0.14);
}

/* The whole track tints, not the focused segment: the segment already carries the
   raised indicator when it is the selected one, so tinting it would conflate
   "chosen" with "focused". The segments suppress their own outline so this is the
   single indicator. */
.track:has(:focus-visible) {
  background-image: linear-gradient(var(--focus-fill), var(--focus-fill));
}

.indicator {
  background-color: var(--color-base-100);
  border: 1px solid color-mix(in oklab, var(--color-base-content) 12%, transparent);
  box-shadow:
    0 1px 1px rgb(var(--shadow-ink) / 0.12),
    0 2px 6px rgb(var(--shadow-ink) / 0.22);
  transition:
    transform 260ms cubic-bezier(0.32, 0.72, 0, 1),
    width 260ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 140ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .indicator {
    transition: opacity 140ms ease;
  }
}
</style>
