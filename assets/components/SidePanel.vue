<template>
  <aside class="fixed flex h-screen w-[inherit] flex-col gap-4 p-3" data-testid="navigation">
    <h1>
      <router-link :to="{ name: '/' }" class="flex w-full items-center gap-2.5 overflow-hidden text-4xl font-thin">
        <Logo class="h-11 w-11 shrink-0" />
        Dozzle
      </router-link>

      <div class="mt-4 flex items-center gap-2" v-if="hostname || canResetMenuWidth">
        <small class="truncate text-sm font-light" v-if="hostname">{{ hostname }}</small>

        <!-- Only rendered once the sidebar has been dragged off its default
             width, so the control stays out of the way until it can do something. -->
        <button
          v-if="canResetMenuWidth"
          type="button"
          class="btn btn-ghost btn-xs btn-square ml-auto shrink-0"
          :title="$t('toolbar.reset-sidebar-width')"
          :aria-label="$t('toolbar.reset-sidebar-width')"
          @click="resetMenuWidth"
        >
          <mdi:arrow-collapse-horizontal class="size-4" />
        </button>
      </div>
    </h1>

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

const { hostname } = config;
</script>

<style scoped></style>
