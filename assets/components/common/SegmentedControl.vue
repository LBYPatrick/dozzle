<template>
  <!-- iOS-style segmented control: a recessed track with a single raised pill
       that slides between options. Single-select (radio semantics). -->
  <div ref="root" class="bg-base-300/70 relative inline-flex rounded-lg p-0.5" role="radiogroup">
    <div
      class="bg-base-100 pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-md shadow-sm transition-[transform,width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :style="indicatorStyle"
    ></div>
    <button
      v-for="(opt, i) in options"
      :key="String(opt.value)"
      :ref="(el) => setBtn(el, i)"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      class="focus-visible:ring-primary/60 relative z-10 rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors duration-150 focus:outline-none focus-visible:ring-2"
      :class="model === opt.value ? 'text-base-content font-medium' : 'text-base-content/60 hover:text-base-content'"
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

// Position the raised pill over the selected segment. Uses transform + width so
// the move animates; hidden until measured to avoid a flash from left:0.
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
