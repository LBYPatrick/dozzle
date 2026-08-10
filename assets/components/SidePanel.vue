<template>
  <aside class="fixed flex h-screen w-[inherit] flex-col gap-4 p-3" data-testid="navigation">
    <div class="flex items-start justify-between gap-2">
      <router-link
        :to="{ name: '/' }"
        class="group/logo flex min-w-0 items-center gap-2.5 overflow-hidden text-4xl font-thin"
      >
        <Logo class="h-11 w-11 shrink-0 transition-transform duration-300 group-hover/logo:scale-105" />
        <span class="truncate">Dozzle</span>
      </router-link>

      <!-- Opens the settings popup in place (near the top, per request). -->
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square group/gear mt-1 shrink-0"
        :title="$t('button.settings')"
        :aria-label="$t('button.settings')"
        data-testid="settings"
        @click="openSettings()"
      >
        <mdi:cog-outline class="size-5 transition-transform duration-500 group-hover/gear:rotate-90" />
      </button>
    </div>

    <small class="text-base-content/70 -mt-2 truncate text-sm font-light" v-if="hostname">{{ hostname }}</small>

    <!-- Search sits at the head of the pane, directly under the identity and
         above the navigation it searches. Gated on !collapseNav so it can never
         linger when the sidebar collapses to zero width — the fixed aside does
         not clip its own overflow. -->
    <CloudSearchInline v-if="!collapseNav" class="min-w-0 shrink-0" />

    <SideMenu class="flex-1" />
  </aside>
</template>

<script lang="ts" setup>
import Logo from "@/logo.svg";
import { useSettingsModal } from "@/composable/settingsModal";
import { collapseNav } from "@/stores/settings";

const { hostname } = config;
const { openSettings } = useSettingsModal();
</script>

<style scoped>
@reference "@/main.css";

/* Sidebar interaction polish, applied to every menu the carousel renders.
   Rows tint on hover and reveal an accent bar on the active route; group
   summaries animate their disclosure chevron. Kept here (not per-menu) so all
   menus share one source of truth. Hover does not shift the row sideways: with
   a dense outline that reads as the list jittering under the pointer. */
:deep([data-testid="side-menu"] .menu :where(li > a, li > details > summary)) {
  position: relative;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

/* Accent bar that grows in on the active route. */
:deep([data-testid="side-menu"] .menu li > a.menu-active) {
  position: relative;
}
:deep([data-testid="side-menu"] .menu li > a.menu-active::before) {
  content: "";
  position: absolute;
  inset-block: 15%;
  inset-inline-start: -0.25rem;
  width: 3px;
  border-radius: 9999px;
  background: var(--color-primary);
  animation: side-accent-in 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

@keyframes side-accent-in {
  from {
    opacity: 0;
    transform: scaleY(0.2);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

/* The bar still has to appear — it is what says "you are here" — so reduced
   motion keeps the fade and drops the sweep. */
@media (prefers-reduced-motion: reduce) {
  :deep([data-testid="side-menu"] .menu li > a.menu-active::before) {
    animation: none;
  }

  :deep([data-testid="side-menu"] .menu details > summary::after),
  :deep([data-testid="side-menu"] .menu :where(li > a, li > details > summary)) {
    transition: none;
  }
}

/* Smooth the daisyUI disclosure chevron on group summaries. */
:deep([data-testid="side-menu"] .menu details > summary::after) {
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
