<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { applyPrimaryColor } from "@/composable/primaryColor";
import { primaryColor } from "@/stores/settings";

const mode = useColorMode();
watchEffect(() => {
  if (smallerScrollbars.value) {
    document.documentElement.classList.add("has-custom-scrollbars");
  } else {
    document.documentElement.classList.remove("has-custom-scrollbars");
  }

  let theme = lightTheme.value;
  if (theme === "auto") {
    theme = mode.value;
  }
  document.documentElement.setAttribute("data-theme", theme);
  // Read the resolved surface rather than restating it. The two literals this
  // replaces (#121212 / #F5F5F5) matched neither theme's base-100 — oklch(25%)
  // and oklch(100%) — so the iOS status bar never matched the app under it.
  // Set after data-theme, so the computed value is the theme just applied.
  const surface = getComputedStyle(document.documentElement).getPropertyValue("--color-base-100").trim();
  if (surface) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", surface);
  // Re-applies whenever the theme or the chosen accent changes.
  applyPrimaryColor(primaryColor.value, theme as "light" | "dark");
});
</script>
<style>
/* Scrollbars, in the app's own tokens.
 *
 * These were four hardcoded colours — rgba(128,128,128,.33), `slategrey`, #777
 * and #353535 — which is theme-blind in both directions: the same grey thumb on
 * a white page and on a near-black one, and an outline in a named CSS colour
 * belonging to neither. The fill ramp already solves "a neutral tint that
 * darkens on light and lightens on dark", so it is used here too.
 *
 * The outline is gone rather than recoloured. A 1px ring around an 8px thumb is
 * a quarter of the thumb; the fill separates it from the track on its own.
 *
 * `display: content` on ::-webkit-scrollbar is also gone — not a valid value
 * (the keyword is `contents`, and it means nothing on a scrollbar pseudo). */
html.has-custom-scrollbars {
  /* Both axes: setting only `width` left the horizontal scrollbar without a
     size of its own, so it rendered inconsistently against the vertical one. */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--fill-2);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover,
  ::-webkit-scrollbar-thumb:active {
    background-color: var(--fill-1);
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  section main {
    scrollbar-color: var(--fill-2) transparent;
    scrollbar-width: thin;
  }
}
</style>
