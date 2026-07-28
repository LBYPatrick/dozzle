/**
 * Max/average over a tracked series, for the log view's compact stat readouts.
 *
 * Kept separate from the chart path so the summary cards and the sparkline
 * cards agree on exactly which samples they describe: both read the same
 * rolling history window.
 */
export type StatSummary = {
  max: number;
  avg: number;
};

export const EMPTY_SUMMARY: StatSummary = { max: 0, avg: 0 };

export function summarize(values: number[]): StatSummary {
  if (values.length === 0) return EMPTY_SUMMARY;

  let max = values[0];
  let total = 0;
  for (const value of values) {
    if (value > max) max = value;
    total += value;
  }
  return { max, avg: total / values.length };
}

/**
 * Per-sample deltas of a cumulative counter (bytes transferred, bytes written).
 * The history holds running totals, so the rate series is the difference
 * between neighbours; a counter reset (container switch, restart) shows up as a
 * negative step and is clamped away rather than plotted as a spike.
 */
export function ratesFromTotals<T>(history: T[], total: (sample: T) => number): number[] {
  const rates: number[] = [];
  for (let i = 1; i < history.length; i++) {
    rates.push(Math.max(0, total(history[i]) - total(history[i - 1])));
  }
  return rates;
}
