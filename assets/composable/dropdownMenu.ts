/**
 * Shared behaviour for the app's overflow menus.
 *
 * These used daisyUI's `dropdown-hover`, which opens a menu because the pointer
 * passed over it. Two problems, and the second is the serious one:
 *
 *  - A touch device never hovers. The log row's menu — copy log, copy
 *    permalink, see-in-context, show details, create alert — simply did not
 *    exist on a phone, and neither did the container actions menu.
 *  - iOS and macOS menus are tap/click-to-open, always. A menu that appears
 *    under a passing pointer fires constantly while crossing a toolbar, and
 *    gives the user no way to *not* open it.
 *
 * So the menus are stateful now: a real button toggles them, Escape and an
 * outside press close them, and focus returns to the trigger on Escape (a menu
 * that closes and drops you at the top of the document is a dead end).
 */
type ElementRef = Readonly<Ref<HTMLElement | null>> | Ref<HTMLElement | null | undefined>;

/**
 * @param root    the menu's outer element, for outside-press detection
 * @param trigger the button that opens it, so Escape can hand focus back
 *
 * Both are passed in rather than created here: `ref="root"` in a template binds
 * to a `const` the compiler can see, and a ref destructured out of a function
 * call is not one — so the components own them via `useTemplateRef` and lend
 * them to this.
 */
export function useDropdownMenu(root: ElementRef, trigger?: ElementRef) {
  const open = ref(false);

  /**
   * A <details> submenu remembers it was expanded, so reopening the menu later
   * would show it still open — and a menu that reopens taller than it closed is
   * disorienting.
   */
  const collapseSubmenus = () =>
    root.value?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => (details.open = false));

  function close({ restoreFocus = false } = {}) {
    if (!open.value) return;
    open.value = false;
    collapseSubmenus();
    // Only when the user asked to leave (Escape). After choosing an item the
    // focus belongs wherever that item took them.
    if (restoreFocus) trigger?.value?.focus();
  }

  const toggle = () => (open.value ? close() : (open.value = true));

  /** Choosing an item always closes the menu; the action has been taken. */
  const onItemClick = (event: MouseEvent) => {
    // Submenu disclosures live inside the menu and must not close it.
    if ((event.target as HTMLElement | null)?.closest("summary")) return;
    close();
  };

  // Both document-level listeners attach ONLY while the menu is actually open.
  //
  // This matters far more than it looks: LogActions mounts one of these per log
  // row, and the log view holds up to 400 rows. Registering unconditionally
  // would put ~800 document listeners on the page and run every one of them on
  // every keystroke and every click — for menus that are, at most, one open at
  // a time. A null target means useEventListener attaches nothing.
  const whileOpen = computed(() => (open.value ? document : null));

  // Escape closes the menu before anything above it (a dialog, the log view)
  // sees the key.
  useEventListener(whileOpen, "keydown", (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close({ restoreFocus: true });
  });

  // Not `onClickOutside`, for the same reason: it attaches on setup and stays.
  // Pointerdown rather than click, so a press that starts outside dismisses
  // before the click lands on whatever is underneath.
  useEventListener(whileOpen, "pointerdown", (event: PointerEvent) => {
    if (root.value?.contains(event.target as Node)) return;
    close();
  });

  return { open, toggle, close, onItemClick, collapseSubmenus };
}
