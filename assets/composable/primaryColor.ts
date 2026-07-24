// Accent (daisyUI primary) color options. Selecting one overrides the theme's
// --color-primary at runtime; the empty id keeps the built-in teal. Lightness is
// kept close to the shipped theme (lighter primary on light, slightly darker on
// dark) so contrast behaves the same as the default across both schemes.
export type PrimaryColor = {
  id: string; // stored in settings; "" == theme default (teal)
  name: string;
  light: string; // --color-primary for the light theme
  dark: string; // --color-primary for the dark theme
  content: string; // --color-primary-content (button/label text)
  swatch: string; // vivid representative shown in the picker
};

const CONTENT = "oklch(98% 0.01 240)";

export const PRIMARY_COLORS: PrimaryColor[] = [
  {
    id: "",
    name: "Teal",
    light: "oklch(79.96% 0.143 176.65)",
    dark: "oklch(70.96% 0.143 176.65)",
    content: CONTENT,
    swatch: "oklch(74% 0.143 176.65)",
  },
  {
    id: "blue",
    name: "Blue",
    light: "oklch(74% 0.13 248)",
    dark: "oklch(72% 0.14 248)",
    content: CONTENT,
    swatch: "oklch(70% 0.15 248)",
  },
  {
    id: "indigo",
    name: "Indigo",
    light: "oklch(72% 0.13 272)",
    dark: "oklch(70% 0.15 272)",
    content: CONTENT,
    swatch: "oklch(66% 0.16 272)",
  },
  {
    id: "violet",
    name: "Violet",
    light: "oklch(72% 0.15 300)",
    dark: "oklch(71% 0.16 300)",
    content: CONTENT,
    swatch: "oklch(68% 0.17 300)",
  },
  {
    id: "magenta",
    name: "Magenta",
    light: "oklch(72% 0.16 328)",
    dark: "oklch(71% 0.17 328)",
    content: CONTENT,
    swatch: "oklch(70% 0.18 328)",
  },
  {
    id: "rose",
    name: "Rose",
    light: "oklch(74% 0.15 12)",
    dark: "oklch(72% 0.16 12)",
    content: CONTENT,
    swatch: "oklch(70% 0.18 12)",
  },
  {
    id: "red",
    name: "Red",
    light: "oklch(70% 0.17 28)",
    dark: "oklch(69% 0.18 28)",
    content: CONTENT,
    swatch: "oklch(66% 0.2 28)",
  },
  {
    id: "orange",
    name: "Orange",
    light: "oklch(76% 0.15 58)",
    dark: "oklch(74% 0.16 58)",
    content: CONTENT,
    swatch: "oklch(72% 0.17 58)",
  },
  {
    id: "green",
    name: "Green",
    light: "oklch(78% 0.15 150)",
    dark: "oklch(72% 0.16 150)",
    content: CONTENT,
    swatch: "oklch(72% 0.17 150)",
  },
];

export function resolvePrimaryColor(id: string): PrimaryColor | undefined {
  const found = PRIMARY_COLORS.find((c) => c.id === id);
  // The default (empty id) needs no override — return undefined so callers clear
  // the inline variables and fall back to the CSS theme.
  return found && found.id !== "" ? found : undefined;
}

// Applies (or clears) the primary color override for the active theme. Called
// from the theme watcher so it re-runs on both color and theme changes.
export function applyPrimaryColor(id: string, theme: "light" | "dark") {
  const root = document.documentElement;
  const color = resolvePrimaryColor(id);
  if (!color) {
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-primary-content");
    return;
  }
  root.style.setProperty("--color-primary", theme === "dark" ? color.dark : color.light);
  root.style.setProperty("--color-primary-content", color.content);
}
