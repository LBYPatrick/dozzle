type ScrollContext = {
  paused: boolean;
  /**
   * How far back through the container's lifetime the visible line sits, 0..1 —
   * or undefined while that is genuinely unknown, which is the case until the
   * first line has been measured. It must not default to a number: 1 used to be
   * the default, and since the readout appears the moment you scroll away from
   * the tail, anything that never measured (every multi-container view) reported
   * a confident "100%" while you were sitting at the oldest line.
   */
  progress: number | undefined;
  currentDate: Date;
};

// export for testing
export const scrollContextKey = Symbol("scrollContext") as InjectionKey<ScrollContext>;

export const provideScrollContext = () => {
  const context = defaultValue();
  provide(scrollContextKey, context);
  return context;
};

export const useScrollContext = () => {
  const context = inject(scrollContextKey, defaultValue());
  return toRefs(context);
};

function defaultValue() {
  return reactive<ScrollContext>({
    paused: false,
    progress: undefined,
    currentDate: new Date(),
  });
}

/** Treats the epoch as "unset", which is how a missing timestamp arrives. */
export const hasTimestamp = (date: Date) => date.getTime() > 0;

/**
 * Where `at` falls in the span from `spanStart` to `now`, as 0..1.
 *
 * Pure, and deliberately not inlined into the observer that calls it: every way
 * this can fail is a bad span rather than a bad line, and each one used to
 * surface as a plausible-looking percentage.
 *
 * Returns undefined when the span cannot be measured — `spanStart` unset (the
 * backend reports the Unix epoch, which made every line land at ~100% because
 * the numerator and denominator were both "roughly now"), in the future, or
 * equal to `now` (a container created this instant, which divided by zero).
 */
export function scrollProgress(at: Date, spanStart: Date, now: Date): number | undefined {
  // Guarded here and not only at the call site: the whole failure mode was a
  // plausible number getting through, so the function that returns the number
  // refuses the spans it cannot measure.
  if (!hasTimestamp(spanStart)) return undefined;
  const span = now.getTime() - spanStart.getTime();
  // Also rejects NaN, which an invalid Date yields and which no comparison catches.
  if (!(span > 0)) return undefined;
  const elapsed = at.getTime() - spanStart.getTime();
  if (Number.isNaN(elapsed)) return undefined;
  // Clamped at the source: host clocks run ahead of the browser's, so a line can
  // legitimately be stamped after `now`, and callers should not each re-clamp.
  return Math.min(1, Math.max(0, elapsed / span));
}
