// Shared open state for the in-place settings popup, mirroring useFuzzySearch.
// Any surface (sidebar gear, command palette, mobile menu) can open it without
// prop-drilling, and it can target a specific view (visual form or JSON editor)
// and optionally scroll to a specific section (e.g. the cloud settings).
export type SettingsView = "visual" | "json";
export type SettingsSection = "cloud";

const open = ref(false);
const view = ref<SettingsView>("visual");
const section = ref<SettingsSection | null>(null);

export function useSettingsModal() {
  return {
    open,
    view,
    section,
    openSettings: (target: SettingsView = "visual", targetSection: SettingsSection | null = null) => {
      // A section only exists in the visual form, so honor it there.
      view.value = targetSection ? "visual" : target;
      section.value = targetSection;
      open.value = true;
    },
    closeSettings: () => {
      open.value = false;
      section.value = null;
    },
  };
}
