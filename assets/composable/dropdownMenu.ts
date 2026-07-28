/**
 * Shared behaviour for the log toolbars' overflow menus.
 *
 * daisyUI dropdowns are CSS-driven — they stay open while hovered or focused
 * within — so anything stateful inside them has to be reset by hand when they
 * close. Both toolbars need exactly this, so it lives here rather than being
 * written out twice.
 */
export function useDropdownMenu() {
  /**
   * Clicking an item leaves it focused, which keeps the menu open behind
   * whatever the click did. Dropping focus closes it.
   */
  const hideMenu = (event: MouseEvent) => {
    if (!(event.target instanceof HTMLAnchorElement)) return;
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 50);
  };

  /**
   * A <details> submenu remembers it was expanded, so reopening the menu later
   * would show it still open — and a menu that reopens taller than it closed is
   * disorienting. Collapse them once the menu is really closed.
   *
   * Guarded on focus: the pointer leaving a keyboard-opened menu does not close
   * it, and collapsing under the user in that case would be worse.
   */
  const collapse = (el: HTMLElement) =>
    el.querySelectorAll<HTMLDetailsElement>("details[open]").forEach((details) => (details.open = false));

  const collapseSubmenus = (event: Event) => {
    const el = event.currentTarget as HTMLElement | null;
    if (!el || el.contains(document.activeElement)) return;
    collapse(el);
  };

  /** Focus moving out of the menu entirely closes it, so reset then too. */
  const onFocusOut = (event: FocusEvent) => {
    const el = event.currentTarget as HTMLElement | null;
    if (!el || el.contains(event.relatedTarget as Node | null)) return;
    collapse(el);
  };

  return { hideMenu, collapseSubmenus, onFocusOut };
}
