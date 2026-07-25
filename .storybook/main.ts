import type { StorybookConfig } from "@storybook/vue3-vite";

// @storybook/vue3-vite auto-loads the project's vite.config.ts, so all the app
// plugins (unplugin-vue-macros → vue, auto-import, components, icons, i18n,
// tailwind, svg-loader) are already applied. Re-adding them here would create a
// second vue pipeline that double-transforms every .vue file, so keep this lean.
const config: StorybookConfig = {
  stories: ["../assets/**/*.stories.@(ts|js)"],
  addons: ["@storybook/addon-themes"],
  framework: { name: "@storybook/vue3-vite", options: {} },
  core: { disableTelemetry: true },
  docs: { defaultName: "Docs" },
};

export default config;
