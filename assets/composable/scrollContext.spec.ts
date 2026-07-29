import { describe, expect, test } from "vitest";
import { hasTimestamp, scrollProgress } from "./scrollContext";

const at = (iso: string) => new Date(iso);

describe("scrollProgress", () => {
  const created = at("2026-07-01T00:00:00Z");
  const now = at("2026-07-11T00:00:00Z"); // a ten-day span

  test("reports where the line falls in the span", () => {
    expect(scrollProgress(at("2026-07-06T00:00:00Z"), created, now)).toBe(0.5);
    expect(scrollProgress(at("2026-07-03T00:00:00Z"), created, now)).toBeCloseTo(0.2);
  });

  test("the oldest line is 0, not 1 — the bug this replaces", () => {
    expect(scrollProgress(created, created, now)).toBe(0);
  });

  test("clamps a line older than the span to 0", () => {
    // Logs can predate the container record, e.g. a recreated container.
    expect(scrollProgress(at("2026-06-01T00:00:00Z"), created, now)).toBe(0);
  });

  test("clamps a line stamped after now to 1", () => {
    // Host clocks run ahead of the browser's; the caller should not have to.
    expect(scrollProgress(at("2026-07-20T00:00:00Z"), created, now)).toBe(1);
  });

  describe("returns undefined rather than a plausible number when the span is unusable", () => {
    test("span start unset (the epoch), which used to read as ~100%", () => {
      const epoch = new Date(0);
      // The old arithmetic: (line - 0) / (now - 0), both "roughly now", so every
      // line — including the oldest — landed at essentially 1.
      const old = (at("2026-07-06T00:00:00Z").getTime() - epoch.getTime()) / (now.getTime() - epoch.getTime());
      expect(old).toBeGreaterThan(0.99);
      expect(scrollProgress(at("2026-07-06T00:00:00Z"), epoch, now)).toBeUndefined();
    });

    test("span start equal to now, which used to divide by zero", () => {
      expect(scrollProgress(now, now, now)).toBeUndefined();
    });

    test("span start in the future", () => {
      expect(scrollProgress(now, at("2026-08-01T00:00:00Z"), now)).toBeUndefined();
    });

    test("an invalid date on either end", () => {
      expect(scrollProgress(new Date(NaN), created, now)).toBeUndefined();
      expect(scrollProgress(now, new Date(NaN), now)).toBeUndefined();
      expect(scrollProgress(now, created, new Date(NaN))).toBeUndefined();
    });
  });
});

describe("hasTimestamp", () => {
  test("treats the epoch as unset", () => {
    expect(hasTimestamp(new Date(0))).toBe(false);
    expect(hasTimestamp(new Date("2026-07-01T00:00:00Z"))).toBe(true);
  });
});
