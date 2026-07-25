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

    <!-- Drop the carousel's "Hosts and Containers" title when the search bar
         takes the bottom slot, so the sidebar foot isn't cluttered. -->
    <SideMenu class="flex-1" :hide-title="!hasInlineSearch" />

    <!-- Sits at the sidebar foot, roughly where the carousel title shows on the
         dashboard. The collapse toggle is lifted above it (see default.vue). -->
    <CloudSearchInline v-if="!hasInlineSearch" class="shrink-0" />
  </aside>
</template>

<script lang="ts" setup>
import Logo from "@/logo.svg";
import { hasInlineSearch } from "@/composable/inlineSearch";
import { useSettingsModal } from "@/composable/settingsModal";

const { hostname } = config;
const { openSettings } = useSettingsModal();
</script>

<style scoped>
@reference "@/main.css";

/* Sidebar interaction polish, applied to every menu the carousel renders.
   Rows lift slightly and reveal an accent bar on hover/active; group summaries
   animate their disclosure chevron. Kept here (not per-menu) so all menus share
   one source of truth. */
:deep([data-testid="side-menu"] .menu :where(li > a, li > details > summary)) {
  position: relative;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    transform 150ms cubic-bezier(0.32, 0.72, 0, 1);
}

:deep([data-testid="side-menu"] .menu :where(li > a, li > details > summary):hover) {
  transform: translateX(3px);
}

:deep([data-testid="side-menu"] .menu :where(li > a, li > details > summary):active) {
  transform: translateX(3px) scale(0.99);
}

/* Accent bar that grows in on the active route. */
:deep([data-testid="side-menu"] .menu li > a.menu-active) {
  position: relative;
}
:deep([data-testid="side-menu"] .menu li > a.menu-active::before) {
  content: "";
  position: absolute;
  inset-block: 15%;
  inset-inline-start: -0.35rem;
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

/* Smooth the daisyUI disclosure chevron on group summaries. */
:deep([data-testid="side-menu"] .menu details > summary::after) {
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
