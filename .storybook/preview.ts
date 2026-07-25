import type { Preview } from "@storybook/vue3-vite";
import { setup } from "@storybook/vue3-vite";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import i18n from "@/modules/i18n";
import "@/main.css";

// Stub routes mirroring the app's file-based route names so that
// <RouterLink :to="{ name: '/host/[id]', params }" /> resolves inside stories.
const routeNames: [string, string][] = [
  ["/", "/"],
  ["/login", "/login"],
  ["/show", "/show"],
  ["/notifications", "/notifications"],
  ["/cloud/search", "/cloud/search"],
  ["/container/[id]", "/container/:id"],
  ["/container/[id].time.[datetime]", "/container/:id/time/:datetime"],
  ["/host/[id]", "/host/:id"],
  ["/host-group/[name]", "/host-group/:name"],
  ["/group/[name]", "/group/:name"],
  ["/service/[name]", "/service/:name"],
  ["/stack/[name]", "/stack/:name"],
  ["/namespace/[name]", "/namespace/:name"],
  ["/owner/[name]", "/owner/:name"],
  ["/merged/[ids]", "/merged/:ids"],
];

const Empty = { template: "<div />" };
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    ...routeNames.map(([name, path]) => ({ name, path, component: Empty })),
    { path: "/:pathMatch(.*)*", name: "__catchall__", component: Empty },
  ],
});

const pinia = createPinia();

setup((app) => {
  app.use(pinia);
  app.use(i18n);
  app.use(router);
});

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { dark: "dark", light: "light" },
      defaultTheme: "dark",
      attributeName: "data-theme",
    }),
    // Paint the app's themed background/text behind every story.
    () => ({
      template: `<div class="bg-base-100 text-base-content" style="padding:1.5rem;min-width:14rem"><story /></div>`,
    }),
  ],
};

export default preview;
