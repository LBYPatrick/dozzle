/**
 * Drag-to-dismiss, done properly.
 *
 * The app had no gesture layer at all: a grep for pointer capture, velocity,
 * springs or swipe handling returned nothing outside the auto-import manifest,
 * and Splitpanes' own drag was the only 1:1 tracking in the product. Every
 * other "animation" was a fixed-duration CSS transition, which means four of
 * the doctrine's core sections were not partially met but absent —
 *
 *   §2 direct manipulation — nothing was draggable
 *   §3 interruptibility    — no animation could be grabbed or reversed mid-flight
 *   §5 velocity handoff    — no gesture produced a velocity to hand off
 *   §6 momentum projection — no flick landed anywhere
 *
 * This is the reference implementation of all four for one interaction, so the
 * next surface that needs a gesture inherits the physics rather than inventing
 * them. It is deliberately one composable and not a framework: a log viewer is
 * a reading tool, and most of it should not be draggable.
 *
 * What it does, in order:
 *
 *   1. Tracks 1:1 from the pointer, honouring where the panel was grabbed
 *      (§2). Pointer capture, so the drag survives the pointer leaving the
 *      element.
 *   2. Keeps a short position/time history so release velocity is real rather
 *      than inferred from the last two events (§5).
 *   3. Rubber-bands past the closed edge instead of stopping dead (§9).
 *   4. On release, projects where the momentum would carry the panel using
 *      Apple's own decay function, and decides dismiss-vs-return from that
 *      projection — not from where the finger happened to let go (§6).
 *   5. Hands the release velocity to the settling animation, so there is no
 *      seam between dragging and animating (§5).
 *
 * Interruptibility (§3) falls out of the design: the transform is a plain
 * reactive value driven from rAF, so a new pointerdown mid-settle simply reads
 * the current on-screen offset and starts tracking from there. There is no
 * CSS transition to fight, and nothing to wait for.
 */

/** Which way the surface leaves. */
export type DismissAxis = "x" | "y";

export interface DismissGestureOptions {
  /** Which edge the surface travels toward to leave. */
  axis?: DismissAxis;
  /** +1 = dismisses toward positive offset (right / down), -1 = the other way. */
  direction?: 1 | -1;
  /** Called once the surface has travelled far enough to be gone. */
  onDismiss: () => void;
  /** Travel available before the surface is off-screen. Measured, not guessed. */
  extent: () => number;
  /**
   * Fraction of `extent` past which a *slow* release still dismisses. A fast
   * flick dismisses from anywhere — that is what the projection is for.
   */
  threshold?: number;
  /** Skip the gesture entirely (reduced motion, or a pointer device). */
  enabled?: () => boolean;
}

/**
 * Apple's projection function, verbatim from the Designing Fluid Interfaces
 * sample code. NOT the physics-textbook v²/2a — this is the exponential-decay
 * form that matches how iOS scroll views actually come to rest.
 */
export function project(initialVelocity: number, decelerationRate = 0.998) {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. The further you pull, the less the
 * surface follows — real things slow before they stop, and a hard clamp reads
 * as "frozen" rather than "there is nothing more here".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

const SAMPLE_WINDOW_MS = 100;

export function useDismissGesture(options: DismissGestureOptions) {
  const { axis = "x", direction = 1, onDismiss, extent, threshold = 0.4, enabled = () => true } = options;

  /** Live offset along the axis, in px, always in the dismissing direction. */
  const offset = ref(0);
  const dragging = ref(false);

  let pointerId: number | null = null;
  let grabOffset = 0;
  /** Recent (position, timestamp) samples, for a real release velocity. */
  let samples: { at: number; time: number }[] = [];
  let raf = 0;

  const coord = (event: PointerEvent) => (axis === "x" ? event.clientX : event.clientY);

  /** Velocity in px/s from the sample window, not from the last two events —
   *  a single pair is dominated by whatever jitter the last frame had. */
  function releaseVelocity() {
    if (samples.length < 2) return 0;
    const last = samples[samples.length - 1];
    const first = samples.find((s) => last.time - s.time <= SAMPLE_WINDOW_MS) ?? samples[0];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    return ((last.at - first.at) / dt) * 1000;
  }

  function onPointerDown(event: PointerEvent) {
    // Mouse drags on a panel are text selection, not a dismiss gesture; and a
    // press that started on a control belongs to that control.
    if (event.pointerType === "mouse" || !enabled()) return;
    if ((event.target as HTMLElement | null)?.closest("button, a, input, textarea, select, [role='button']")) return;

    cancelAnimationFrame(raf);
    pointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging.value = true;
    // Interruption: start from where the surface *is*, not from zero. Grabbing
    // a settling panel picks it up mid-flight rather than snapping it back.
    grabOffset = coord(event) - offset.value * direction;
    samples = [{ at: coord(event), time: event.timeStamp }];
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging.value || event.pointerId !== pointerId) return;

    samples.push({ at: coord(event), time: event.timeStamp });
    // Only the recent window matters; anything older is a different gesture.
    samples = samples.filter((s) => event.timeStamp - s.time <= SAMPLE_WINDOW_MS * 3);

    const raw = (coord(event) - grabOffset) * direction;
    const size = extent();
    // Past the open position there is nothing to reveal, so resist rather than
    // stop: the surface still moves, just less and less.
    offset.value = raw >= 0 ? raw : -rubberband(-raw, size);
  }

  function settle(to: number, velocity: number, done?: () => void) {
    // A critically-damped spring integrated per frame. Not a CSS transition,
    // because a transition cannot be handed an initial velocity and cannot be
    // grabbed mid-flight — which is the entire point (§3, §5).
    //
    // response 0.35s / damping 1.0 is the doctrine's default for a
    // reposition; the gesture supplies the energy, so no bounce is added.
    const stiffness = (2 * Math.PI) / 0.35;
    let value = offset.value;
    let v = velocity;
    let last = performance.now();

    const step = (now: number) => {
      // Clamped: a backgrounded tab returns one enormous dt, which would
      // integrate the spring straight through its target.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const displacement = value - to;
      const accel = -stiffness * stiffness * displacement - 2 * stiffness * v;
      v += accel * dt;
      value += v * dt;
      offset.value = value;

      if (Math.abs(value - to) < 0.5 && Math.abs(v) < 20) {
        offset.value = to;
        done?.();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function onPointerUp(event: PointerEvent) {
    if (!dragging.value || event.pointerId !== pointerId) return;
    dragging.value = false;
    pointerId = null;

    const size = extent();
    const velocity = releaseVelocity() * direction;
    // Where the momentum would actually carry it — §6. Deciding from the
    // release *position* alone is what makes a flick feel like it was ignored.
    const projected = offset.value + project(velocity);

    if (projected > size * threshold) {
      // Hand the finger's own velocity to the animation so there is no seam
      // between the drag and the dismissal (§5).
      settle(size, velocity, onDismiss);
    } else {
      settle(0, velocity);
    }
  }

  function onPointerCancel() {
    if (!dragging.value) return;
    dragging.value = false;
    pointerId = null;
    settle(0, 0);
  }

  /** Put the surface back at rest without animating (on open/close). */
  function reset() {
    cancelAnimationFrame(raf);
    dragging.value = false;
    pointerId = null;
    samples = [];
    offset.value = 0;
  }

  onScopeDispose(() => cancelAnimationFrame(raf));

  /** How far along the dismissal we are, 0..1 — for dimming the scrim with it. */
  const progress = computed(() => {
    const size = extent();
    return size > 0 ? Math.min(1, Math.max(0, offset.value / size)) : 0;
  });

  return {
    offset,
    progress,
    dragging,
    reset,
    /** Spread onto the draggable element. */
    handlers: {
      onPointerdown: onPointerDown,
      onPointermove: onPointerMove,
      onPointerup: onPointerUp,
      onPointercancel: onPointerCancel,
    },
  };
}
