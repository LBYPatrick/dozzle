<template>
  <!-- One widget for a pair of related metrics (CPU + memory, network + disk),
       in two forms. The card is its own control: clicking cycles the form.

       Compact — a small table, nothing drawn. Two rows, one per metric, sharing
       one grid so their columns line up: name, the live figure, and what it is
       measured against. Every column is sized by what is actually on screen —
       reserving room for the widest figure the card could ever show is how this
       design kept growing dead space (a hole mid-card when the tracks were
       fixed, a dead right edge when the card was). Tabular numerals keep the
       common tick (31.7 → 32.1) from moving anything; a figure crossing a digit
       boundary shifts the card by a few pixels, which is the honest cost of
       holding no space for digits that are not there.

       Expanded — the metrics sit side by side so each trend gets the card's
       full height, with all three figures under one set of column headings. -->
  <button
    type="button"
    class="stat-card group/stat"
    :class="[variant === 'chart' ? 'chart-card' : 'summary-card', { unavailable }]"
    :title="`${title ? `${title}\n\n` : ''}${$t('toolbar.stat-cycle')}`"
    @click="$emit('cycle')"
  >
    <Transition name="stat-form">
      <div :key="variant" class="forms" :class="hasCeiling ? 'has-ceiling' : 'no-ceiling'">
        <!-- Compact -->
        <template v-if="variant !== 'chart'">
          <!-- The value column is shared and content-sized: it measures the
               widest figure currently shown, so both rows close on one slash
               axis, an "N/A" card collapses to N/A's width, and no track holds
               room for a figure that is not on screen. The value right-aligns
               onto the slash and the ceiling opens from it, so the pair reads
               as one fraction.

               No captions: the figures carry their own units and "5.2MB /
               7.7GB" reads as used-of-available on its own. The words cost more
               width than they explain, and the expanded form spells them out.
               They stay for screen readers, which get no help from a slash. -->
          <template v-for="row in rows" :key="row.label">
            <component :is="row.icon" class="size-3.5" :class="`tone-${row.tone}`" />
            <span class="name">{{ row.label }}</span>
            <span class="value">
              <span class="sr-only">{{ $t("label.now") }}</span
              >{{ row.currentLabel }}
            </span>
            <template v-if="hasCeiling">
              <span class="sep" aria-hidden="true">{{ row.totalLabel ? "/" : "" }}</span>
              <span class="total">
                <template v-if="row.totalLabel">
                  <span class="sr-only">{{ $t("label.avail") }}</span
                  >{{ row.totalLabel }}
                </template>
              </span>
            </template>
          </template>
        </template>

        <!-- Expanded -->
        <template v-else>
          <!-- Every column, the metric's name included, is the same two-line
               shape: a caption over a value. Nothing is positioned against
               anything else — the heading is centred on its number because they
               are the same element, and the name sits on the value line because
               it occupies the same slot in an identical stack. The name's
               caption line is deliberately empty. -->
          <div v-for="row in rows" :key="row.label" class="trend" :class="row.totalLabel ? 'three' : 'two'">
            <span class="metric metric-label">
              <span class="caption" aria-hidden="true"></span>
              <span class="name-row">
                <component :is="row.icon" class="size-3.5 shrink-0" :class="`tone-${row.tone}`" />
                <span class="name">{{ row.label }}</span>
              </span>
            </span>

            <span class="metric">
              <span class="caption">{{ $t("label.now") }}</span>
              <span class="current">{{ row.currentLabel }}</span>
            </span>
            <span class="metric">
              <span class="caption">{{ $t("label.max") }}</span>
              <span class="muted">{{ row.peakLabel }}</span>
            </span>
            <span class="metric" v-if="row.totalLabel">
              <span class="caption">{{ $t("label.avail") }}</span>
              <span class="muted">{{ row.totalLabel }}</span>
            </span>

            <BarChart
              :ref="(el) => setChart(el as ChartInstance | null)"
              :chart-data="unavailable ? FLATLINE : (row.series ?? [])"
              :shape="trendShape"
              :bar-class="row.tone === 'primary' ? 'bg-primary opacity-80' : 'bg-secondary opacity-80'"
              :tone-class="row.tone === 'primary' ? 'text-primary' : 'text-secondary'"
              class="trend-chart"
            />
          </div>
        </template>
      </div>
    </Transition>
  </button>
</template>

<script lang="ts" setup>
import type { Component } from "vue";
import BarChart, { type BarDataPoint } from "@/components/BarChart.vue";

export type StatSummaryRow = {
  icon: Component;
  /** Short all-caps metric name (CPU, MEM, NET, DISK). */
  label: string;
  /** The live value — the figure in full contrast. */
  currentLabel: string;
  /** The window's peak. */
  peakLabel: string;
  /** What is available. Omitted for throughput, which has no ceiling. */
  totalLabel?: string;
  /** Trend over the tracked window; only read by the expanded form. */
  series?: BarDataPoint[];
  tone: "primary" | "secondary";
};

type ChartInstance = { recalculate: () => void };

const {
  rows,
  variant = "meter",
  unavailable = false,
} = defineProps<{
  rows: StatSummaryRow[];
  title?: string;
  variant?: "meter" | "chart";
  /**
   * No running container: the name dims and the trend goes flat. The figures
   * themselves are whatever the caller passed, so there is no second layout to
   * keep in sync with this one.
   */
  unavailable?: boolean;
}>();
defineEmits<{ cycle: [] }>();

// The charts cache their downsampled bars and only patch the last one per tick,
// so a wholesale series replacement (switching containers) needs a full
// recalculate. Collected here and forwarded, since the parent owns that switch.
let charts: ChartInstance[] = [];
const setChart = (el: ChartInstance | null) => {
  if (el) charts.push(el);
};
onBeforeUpdate(() => (charts = []));
defineExpose({ recalculate: () => charts.forEach((chart) => chart.recalculate()) });

// A stopped container still gets a trend, drawn flat at zero, so the expanded
// card keeps its shape instead of showing a hole where the chart was.
const FLATLINE: BarDataPoint[] = Array.from({ length: 120 }, () => ({ percent: 0, value: 0 }));

// Throughput reports no ceiling, so its compact form is one figure narrower.
const hasCeiling = computed(() => rows.some((row) => row.totalLabel !== undefined));
</script>

<style scoped>
@reference "@/main.css";

.stat-card {
  position: relative;
  height: 100%;
  /* The outgoing form is taken out of flow but keeps its own intrinsic width —
     a grid with fixed value tracks will not squeeze into a narrower box, so it
     juts out of the card, past the viewport, and the page grows a scrollbar for
     the length of the transition. The card clips its own contents instead. */
  overflow: hidden;
  /* Sized by its content, and allowed to shrink with the bar. */
  min-width: 0;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.18s ease;
}

.stat-card:hover {
  background-color: color-mix(in oklab, var(--color-base-content) 10%, transparent);
}

.stat-card:focus {
  outline: none;
}

.stat-card:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--color-primary) 60%, transparent);
  outline-offset: 1px;
}

/* Compact: a two-row table, no drawing. Every cell is a column of the one grid,
   so the two rows align by construction — there is no second grid whose widths
   have to be made to agree with this one.

   align-content centres the block in the card whether it is in flow or lifted
   out of it by the form transition, which is what stops the outgoing form from
   snapping to the top mid-fade. */
.summary-card {
  display: flex;
  align-items: center;
}

/* Every track is content-sized. The card has had a hole punched through its
   middle (fixed value tracks cut for the widest possible figure) and a dead
   right edge (a min-width floor pooling its slack at the trailing side); both
   were the same mistake of reserving space for figures that are not on screen.
   Auto tracks measure what is actually rendered, so an N/A card is exactly as
   wide as "N/A / 18 CPU" and a live one exactly as wide as its figures.
   Tabular numerals make the per-tick case stable; only a digit-count change
   (9.8% -> 10.2%, 912.4MB -> 1.1GB) moves anything, and then by one glyph. */
.summary-card {
  display: flex;
  align-items: center;
}

.summary-card .forms {
  display: grid;
  width: 100%;
  align-items: center;
  align-content: center;
  justify-content: start;
  column-gap: 0.4rem;
  row-gap: 0.3rem;
}

.summary-card .forms.has-ceiling {
  grid-template-columns: repeat(5, auto);
}

.summary-card .forms.no-ceiling {
  grid-template-columns: repeat(3, auto);
}

/* Right-aligned onto the slash; the padding is the gutter between the name and
   figure groups, carried by the value so it needs no track of its own. */
.value {
  justify-self: end;
  padding-left: 0.5rem;
  text-align: right;
}

.total {
  justify-self: start;
}

/* Throughput figures swing across magnitudes ("999.9KB/s" -> "1.0MB/s") every
   second, so their column alone gets a floor sized to the common form — the
   card must not tick side to side with the rate. Right-aligned, so the rare
   slack sits by the name, not at the card's edge. */
.no-ceiling .value {
  min-width: 4.25rem;
}

.sep {
  font-size: 12px;
  color: color-mix(in oklab, var(--color-base-content) 30%, transparent);
}

.chart-card {
  display: block;
  padding-block: 0.2rem;
}

.chart-card .forms {
  display: flex;
  height: 100%;
  align-items: stretch;
  gap: 0.875rem;
}

/* Side by side, so each trend gets the card's whole height. */
.trend {
  display: grid;
  min-width: 0;
  flex: 1;
  /* Stretch, not centre: every column is the same two-line stack, so letting
     them share a height is what puts their lines on the same rows. */
  align-items: stretch;
  column-gap: 0.5rem;
  row-gap: 0.15rem;
  grid-template-rows: auto 1fr;
}

/* One column, one caption-over-value pair. Named `metric` rather than `stack`:
   daisyUI owns `.stack` and forces its children to full width, which stretched
   the captions and left-aligned their text. */
.metric {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.05rem;
}

/* The name column shares the shape but reads left to right. */
.metric-label {
  align-items: flex-start;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

/* The label track is a fixed width rather than sized to its own text: "CPU" and
   "MEM" measure differently, and with an auto track that pushed each metric's
   value columns to a different offset, so the two halves of the card no longer
   mirrored each other. */
.trend.three {
  grid-template-columns: 3.5rem minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
}

.trend.two {
  grid-template-columns: 3.5rem minmax(0, 1fr) minmax(0, 1fr);
}

.trend-chart {
  min-height: 0.875rem;
  width: 100%;
  align-self: stretch;
  grid-column: 1 / -1;
  grid-row: 2;
}

.tone-primary {
  color: var(--color-primary);
}
.tone-secondary {
  color: var(--color-secondary);
}

/* Column labels, inline in the compact form and as headings in the expanded
   one. Deliberately quieter than the values they name. */
.caption {
  /* A fixed line box, so the name column's deliberately empty caption still
     occupies a line and its name lands on the value row rather than collapsing
     upward. */
  display: block;
  height: 0.7rem;
  line-height: 0.7rem;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-base-content) 38%, transparent);
}

/* The live figure and the quiet one it is measured against. Shared by both
   forms — the compact row and the expanded column say the same two things. */
.current,
.value {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-base-content);
}

.muted,
.total {
  font-size: 12px;
  white-space: nowrap;
  color: color-mix(in oklab, var(--color-base-content) 45%, transparent);
}

.unavailable .name,
.unavailable svg {
  opacity: 0.55;
}

/* The forms cross-fade in place. The outgoing one is lifted out of flow so the
   card never empties (that gap was the flicker) and never resizes: the incoming
   form owns the box for the whole transition. Opacity only — a transform would
   move the figures, which is exactly what should not happen. */
.stat-form-enter-active,
.stat-form-leave-active {
  transition: opacity 180ms ease;
}

/* inset:0 resolves against the card's padding box, which is exactly where the
   in-flow form sits, so the two overlap precisely. */
.stat-form-leave-active {
  position: absolute;
  inset: 0;
}

.stat-form-enter-from,
.stat-form-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .stat-form-enter-active,
  .stat-form-leave-active {
    transition: none;
  }
}
</style>
