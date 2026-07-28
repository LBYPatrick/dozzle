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
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme == "dark" ? "#121212" : "#F5F5F5");
  document.documentElement.setAttribute("data-theme", theme);
  // Re-applies whenever the theme or the chosen accent changes.
  applyPrimaryColor(primaryColor.value, theme as "light" | "dark");
});
</script>
<style>
html.has-custom-scrollbars {
  /* Both axes: setting only `width` left the horizontal scrollbar without a
     size of its own, so it rendered inconsistently against the vertical one. */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    display: content;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(128, 128, 128, 0.33);
    outline: 1px solid slategrey;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:active {
    background-color: #777;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-track:hover {
    background-color: rgba(64, 64, 64, 0.33);
  }

  section main {
    scrollbar-color: #353535 transparent;
    scrollbar-width: thin;
  }
}
</style>
