<template>
  <div class="border-base-content/15 bg-base-200/40 divide-base-content/10 divide-y rounded-lg border">
    <!-- Version + update status (was the top-right announcements bell) -->
    <div class="flex flex-wrap items-center gap-3 p-4">
      <span class="text-2xl font-semibold tracking-tight">Dozzle</span>
      <span class="status-pill status-pill-neutral font-mono">{{ config.version }}</span>
      <a
        v-if="hasRelease"
        :href="latestRelease?.htmlUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="status-pill status-pill-warning hover:bg-warning/15 ml-auto"
      >
        <span class="size-1.5 rounded-full bg-current"></span>
        {{ latestRelease?.name }}
      </a>
      <span v-else class="status-pill status-pill-success ml-auto">
        <mdi:check class="size-3.5" /> {{ $t("releases.no_releases") }}
      </span>
    </div>

    <!-- What's new — drills into the secondary screen with the full release list -->
    <button
      type="button"
      class="hover:bg-base-content/5 flex w-full items-center gap-3 p-4 text-left transition-colors"
      @click="openSubview('whats-new')"
    >
      <mdi:party-popper class="text-base-content/60 size-5 shrink-0" />
      <span class="flex-1 text-sm font-medium">{{ $t("settings.whats-new") }}</span>
      <span v-if="hasRelease" class="bg-warning size-2 shrink-0 rounded-full"></span>
      <mdi:chevron-right class="text-base-content/40 size-5 shrink-0" />
    </button>

    <!-- Support -->
    <div class="flex flex-col gap-3 p-4">
      <div>
        <div class="text-sm font-medium">{{ $t("settings.support-title") }}</div>
        <div class="text-base-content/60 text-xs">{{ $t("settings.help-support") }}</div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="https://github.com/amir20/dozzle" target="_blank" rel="noopener noreferrer" class="btn btn-sm">
          <mdi:github /> amir20/dozzle
        </a>
        <a
          href="https://github.com/sponsors/amir20"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm"
        >
          <mdi:heart /> Sponsor on GitHub
        </a>
        <a href="https://buymeacoffee.com/amirraminfar" target="_blank" rel="noopener noreferrer" class="btn btn-sm">
          <mdi:beer /> Buy me a beer
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnnouncements } from "@/stores/announcements";
import { useSettingsModal } from "@/composable/settingsModal";

const { latestRelease, hasRelease, fetchReleases } = useAnnouncements();
const { openSubview } = useSettingsModal();

// Fetch so the update pill / dot reflect reality before the user drills in.
// fetchReleases is idempotent (no-op once loaded).
onMounted(() => fetchReleases());
</script>
