<template>
  <!-- Segmented control, current Apple styling: a recessed translucent track
       carrying one raised capsule that slides between options. The selected
       capsule is a full-contrast surface with a hairline edge and a lift shadow
       (not a faint tint), so the choice reads at a glance in both themes.
       Single-select (radio semantics). -->
  <div ref="root" class="track relative inline-flex" :class="{ dense }" role="radiogroup">
    <div class="indicator pointer-events-none absolute left-0" :style="indicatorStyle"></div>
    <button
      v-for="(opt, i) in options"
      :key="String(opt.value)"
      :ref="(el) => setBtn(el, i)"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      :aria-label="opt.title"
      :title="opt.title"
      :tabindex="model === opt.value || (!hasSelection && i === 0) ? 0 : -1"
      @keydown="onKeydown"
      class="segment relative z-10 inline-flex items-center justify-center text-sm whitespace-nowrap transition-[color,transform] duration-150 focus-visible:outline-none active:scale-[0.96]"
      :class="
        model === opt.value
          ? 'text-base-content font-semibold'
          : 'text-base-content/55 hover:text-base-content/85 font-medium'
      "
      @click="select(opt.value)"
    >
      <!-- Defaults to the label, so a plain text control needs no slot. Icon
           segments override it and lean on `title` to stay named. -->
      <slot name="option" :option="opt" :selected="model === opt.value">{{ opt.label }}</slot>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T">
export type SegmentedOption<T> = {
  label: string;
  value: T;
  /** Tooltip and accessible name. Required for icon-only segments, whose slot
      content carries no text of its own. */
  title?: string;
};

const model = defineModel<T>();
const { options, dense = false } = defineProps<{
  options: SegmentedOption<T>[];
  /** Toolbar height (exactly as tall as a `btn-sm`), for control bars where the
      segments sit shoulder to shoulder with buttons. */
  dense?: boolean;
}>();

const select = (value: T) => {
  model.value = value;
};

const hasSelection = computed(() => options.some((o) => o.value === model.value));

// Roving tabindex + arrow keys, which is what `role="radiogroup"` promises and
// this control did not deliver: every segment was separately tabbable, and the
// arrow keys did nothing. A three-segment control was therefore three tab stops
// that all had to be found and pressed, rather than one stop you steer.
function onKeydown(event: KeyboardEvent) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  const jump = { Home: 0, End: options.length - 1 }[event.key];

  let next: number;
  if (step !== undefined) {
    const current = options.findIndex((o) => o.value === model.value);
    // Wraps, as a radio group does — running off the end of a segmented control
    // and stopping there makes the last segment feel like a wall.
    next = ((((current === -1 ? 0 : current) + step) % options.length) + options.length) % options.length;
  } else if (jump !== undefined) {
    next = jump;
  } else {
    return;
  }

  event.preventDefault();
  select(options[next].value);
  // Selection follows focus in a radio group, so focus has to follow it back.
  nextTick(() => btns.value[next]?.focus());
}

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
/* One padding token drives the track's inset, the capsule's inset, and the
   inner radius, so the two sizes stay concentric instead of each hard-coding a
   set of pixels that has to be kept in sync by hand. */
.track {
  --seg-pad: 3px;
  --seg-radius: 10px;
  padding: var(--seg-pad);
  border-radius: var(--seg-radius);
  /* tertiarySystemFill, the same token a grey button wears — a segmented track
     and a button beside it on the same bar are the same material in iOS, and
     hand-picked percentages are why they used to disagree. The inset shadow is
     gone: iOS recesses the track by tone alone, and the inner shading was
     reading as a second, competing edge under the thumb. */
  background-color: var(--fill-3);
}

/* Fixed height rather than padding, so an icon segment and a text segment in
   the same control bar come out the same size. */
.track.dense {
  --seg-pad: 2px;
  --seg-radius: 9px;
  height: 2rem; /* h-8, daisyUI's btn-sm */
}

.segment {
  border-radius: calc(var(--seg-radius) - var(--seg-pad));
  padding: 0.25rem 0.75rem;
}

.track.dense .segment {
  padding: 0 0.625rem;
}

/* The whole track tints, not the focused segment: the segment already carries the
   raised indicator when it is the selected one, so tinting it would conflate
   "chosen" with "focused". The segments suppress their own outline so this is the
   single indicator. */
.track:has(:focus-visible) {
  background-image: linear-gradient(var(--focus-fill), var(--focus-fill));
}

.indicator {
  top: var(--seg-pad);
  bottom: var(--seg-pad);
  border-radius: calc(var(--seg-radius) - var(--seg-pad));
  /* White in light, a grey *lighter than its track* in dark — Apple never puts
     a white capsule on a dark track, it reads as a headlight. */
  background-color: var(--control-thumb);
  /* No border. iOS lifts the thumb with shadow alone; the hairline was doing
     the same job twice and thickening the capsule by 2px. */
  box-shadow: var(--elev-thumb);
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
