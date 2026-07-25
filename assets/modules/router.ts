import { type App } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import { setupLayouts } from "virtual:generated-layouts";
import { useSettingsModal } from "@/composable/settingsModal";

export const router = createRouter({
  history: createWebHistory(withBase("/")),
  routes: setupLayouts([...routes]),
});

export const install = (app: App) => {
  // Settings live in an in-place popup, not a route. Any lingering /settings
  // link or bookmark (the old route, or /settings/cloud deep links) opens the
  // popup instead of 404ing. Cancel in-app navigations so the current page
  // stays put; send a cold URL load to the dashboard, where the popup surfaces.
  // Registered here (not at module load) so tests that mock vue-router don't
  // trip over an undefined router.
  router.beforeEach((to, from) => {
    if (to.path === "/settings" || to.path.startsWith("/settings/")) {
      useSettingsModal().openSettings("visual", to.path.startsWith("/settings/cloud") ? "cloud" : null);
      return from.matched.length > 0 ? false : { path: "/" };
    }
  });

  app.use(router);
};
