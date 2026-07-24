// Shared open state for the in-place settings popup, mirroring useFuzzySearch.
// Any surface (sidebar gear, command palette, mobile menu) can open it without
// prop-drilling, and it can target a specific view (visual form or JSON editor).
export type SettingsView = "visual" | "json";

const open = ref(false);
const view = ref<SettingsView>("visual");

export function useSettingsModal() {
  return {
    open,
    view,
    openSettings: (target: SettingsView = "visual") => {
      view.value = target;
      open.value = true;
    },
    closeSettings: () => {
      open.value = false;
    },
  };
}
