<template>
  <!-- One widget for a pair of related metrics (CPU + memory, network + disk),
       in two forms. The card is its own control: clicking cycles the form.

       Compact — the two metrics stack, each on one line: name, a meter reading
       the value against its ceiling (ticked where the window peaked), and the
       two figures that matter at a glance, written as one fraction. The peak is
       on the meter already, so it is not repeated as a number here; the expanded
       form spells it out.

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
          <template v-for="row in rows" :key="row.label">
            <component :is="row.icon" class="size-3.5" :class="`tone-${row.tone}`" />
            <span class="name">{{ row.label }}</span>
            <span class="meter">
              <span
                v-if="!unavailable"
                class="fill"
                :class="`tone-${row.tone}`"
                :style="{ width: `${fraction(row.value, row.total)}%` }"
              ></span>
              <span
                v-if="!unavailable && row.total > 0 && row.peak > row.value"
                class="peak-tick"
                :style="{ left: `${fraction(row.peak, row.total)}%` }"
              ></span>
            </span>
            <!-- No captions here: the figures carry their own units, and
                 "5.2 MB / 7.7 GB" reads as used-of-available on its own. The
                 words cost more width than they explain, and the expanded form
                 spells them out. They stay for screen readers, which get no
                 help from the slash. -->
            <span class="figures">
              <span class="current">
                <span class="sr-only">{{ $t("label.now") }}</span
                >{{ row.currentLabel }}
              </span>
              <template v-if="row.totalLabel">
                <span class="sep" aria-hidden="true">/</span>
                <span class="muted">
                  <span class="sr-only">{{ $t("label.avail") }}</span
                  >{{ row.totalLabel }}
                </span>
              </template>
            </span>
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
  /** Raw counterparts, used only to size the meter and place the peak tick. */
  value: number;
  peak: number;
  total: number;
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
   * No running container: the meter stays empty and the trend flat. The figures
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

// An unknown or zero ceiling leaves the track empty rather than dividing by zero
// and filling it completely.
const fraction = (value: number, total: number) => (total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0);

// Throughput reports no ceiling, so its compact form is one figure narrower.
const hasCeiling = computed(() => rows.some((row) => row.totalLabel !== undefined));
</script>

<style scoped>
@reference "@/main.css";

.stat-card {
  position: relative;
  display: block;
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

/* Compact: one line per metric. Fixed tracks are what keep this card aligned
   with its neighbour rather than each sizing to its own text. */
.summary-card .forms {
  display: grid;
  align-items: center;
  column-gap: 0.7rem;
  row-gap: 0.25rem;
}

.summary-card .forms.has-ceiling,
.summary-card .forms.no-ceiling {
  grid-template-columns: auto 2.1rem minmax(2.5rem, 1fr) auto;
}

/* The figures are their own grid so the slash can sit tight between them —
   0.3rem either side — while the outer gap stays wide enough to separate the
   name and meter groups.

   The tracks are fixed rather than content-sized, and that is the point: an
   auto track is re-measured every tick, so "1MB" ticking over to "708KB" would
   resize the column, the card, and the toolbar around it. Fixed tracks also
   mean both rows compute identical widths, which is what lines the two slashes
   up even though each row is a separate grid. The values are right-aligned and
   the ceilings left-aligned, so both close on the slash.

   The widths are the longest figure each track can hold, measured rendered
   rather than guessed — these are tabular figures, which run wider than the
   proportional ones a canvas would report. Utilization tops out at "1800.0%"
   (55.4px) on an 18-core host and bytes at "999.9MB" (54.5px), so a 3.5rem
   track cleared the worst case by half a pixel. Throughput carries a "/s" and
   needs more again: "999.9MB/s" is 65px. */
.figures {
  display: grid;
  align-items: baseline;
  column-gap: 0.3rem;
  justify-self: end;
}

.has-ceiling .figures {
  grid-template-columns: 3.75rem auto 3.75rem;
}

.no-ceiling .figures {
  grid-template-columns: 4.25rem;
}

.figures .current {
  justify-self: end;
}

.sep {
  font-size: 12px;
  color: color-mix(in oklab, var(--color-base-content) 30%, transparent);
}

.chart-card {
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

.meter {
  position: relative;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background-color: color-mix(in oklab, var(--color-base-content) 12%, transparent);
}

.fill {
  position: absolute;
  inset-block: 0;
  left: 0;
  border-radius: 999px;
  /* The value slides toward its new position each tick instead of jumping. */
  transition: width 600ms cubic-bezier(0.32, 0.72, 0, 1);
}

/* Where the window peaked, so the headroom reads at a glance. */
.peak-tick {
  position: absolute;
  inset-block: 0;
  width: 2px;
  border-radius: 999px;
  background-color: color-mix(in oklab, var(--color-base-content) 55%, transparent);
  transition: left 600ms cubic-bezier(0.32, 0.72, 0, 1);
}

.tone-primary {
  color: var(--color-primary);
}
.tone-secondary {
  color: var(--color-secondary);
}
.fill.tone-primary {
  background-color: var(--color-primary);
}
.fill.tone-secondary {
  background-color: var(--color-secondary);
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

.current {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--color-base-content);
}

.muted {
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
  .fill,
  .peak-tick,
  .stat-form-enter-active,
  .stat-form-leave-active {
    transition: none;
  }
}
</style>
