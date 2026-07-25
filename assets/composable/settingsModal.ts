// Shared open state for the in-place settings popup, mirroring useFuzzySearch.
// Any surface (sidebar gear, command palette, mobile menu) can open it without
// prop-drilling, and it can target a specific view (visual form or JSON editor)
// and optionally scroll to a specific section (e.g. the cloud settings).
export type SettingsView = "visual" | "json";
export type SettingsSection = "cloud";
// Secondary drill-in screens pushed on top of the main settings list (iOS
// settings style — a back button returns to the list).
export type SettingsSubview = "whats-new" | "notifications";

const open = ref(false);
const view = ref<SettingsView>("visual");
const section = ref<SettingsSection | null>(null);
const subview = ref<SettingsSubview | null>(null);

export function useSettingsModal() {
  return {
    open,
    view,
    section,
    subview,
    openSettings: (target: SettingsView = "visual", targetSection: SettingsSection | null = null) => {
      // A section only exists in the visual form, so honor it there.
      view.value = targetSection ? "visual" : target;
      section.value = targetSection;
      subview.value = null; // always start on the main list
      open.value = true;
    },
    closeSettings: () => {
      open.value = false;
      section.value = null;
      subview.value = null;
    },
    openSubview: (target: SettingsSubview) => {
      subview.value = target;
    },
    closeSubview: () => {
      subview.value = null;
    },
  };
}
