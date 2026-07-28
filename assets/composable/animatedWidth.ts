/**
 * Animates an element's width across a content change.
 *
 * CSS cannot transition `width: auto` to `auto`, and these widgets are sized by
 * whichever form they are showing — so the width is measured either side of the
 * change and driven explicitly for the duration, then handed back to the
 * layout. Nothing is left pinned: an inline width would stop the widget
 * responding to the bar resizing afterwards.
 *
 * The source must be watched before the DOM updates (`flush: "pre"`) so the
 * "from" measurement is still the outgoing layout.
 */
export function useAnimatedWidth(element: Ref<HTMLElement | null | undefined>, source: () => unknown, duration = 260) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  let cleanup: (() => void) | undefined;

  const release = (node: HTMLElement) => {
    node.style.width = "";
    node.style.transition = "";
    cleanup = undefined;
  };

  watch(
    source,
    async () => {
      const node = element.value;
      if (!node || reduced.value) return;

      // A change arriving mid-animation: finish the previous one first, so the
      // "from" width is a real layout rather than an interpolated frame.
      cleanup?.();

      const from = node.getBoundingClientRect().width;
      await nextTick();
      if (!element.value) return;

      const to = node.getBoundingClientRect().width;
      if (Math.abs(to - from) < 1) return;

      node.style.transition = "none";
      node.style.width = `${from}px`;
      node.getBoundingClientRect(); // flush the start width before transitioning
      node.style.transition = `width ${duration}ms cubic-bezier(0.32, 0.72, 0, 1)`;
      node.style.width = `${to}px`;

      const done = (event: TransitionEvent) => {
        if (event.propertyName !== "width") return;
        node.removeEventListener("transitionend", done);
        release(node);
      };
      node.addEventListener("transitionend", done);
      cleanup = () => {
        node.removeEventListener("transitionend", done);
        release(node);
      };
    },
    { flush: "pre" },
  );

  onScopeDispose(() => cleanup?.());
}
