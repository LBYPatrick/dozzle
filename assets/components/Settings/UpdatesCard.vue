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

    <!-- What's new: the release list the announcements dropdown used to show -->
    <div v-if="announcements.length" class="flex flex-col gap-4 p-4">
      <div class="text-base-content/50 text-xs font-semibold tracking-wide uppercase">
        {{ $t("settings.whats-new") }}
      </div>
      <ul class="flex max-h-64 flex-col gap-4 overflow-y-auto">
        <li v-for="release in announcements" :key="release.tag" class="flex flex-col gap-1">
          <div class="flex items-baseline gap-2">
            <carbon:warning v-if="release.breaking > 0" class="stroke-orange self-center" />
            <carbon:information v-else class="text-info self-center" />
            <a :href="release.htmlUrl" target="_blank" rel="noopener noreferrer" class="link-primary font-bold">
              {{ release.name }}
            </a>
            <span class="text-base-content/50 ml-auto text-xs whitespace-nowrap">
              <RelativeTime :date="release.createdAt" />
            </span>
          </div>
          <p class="text-base-content/70 text-sm">{{ release.announcement ? release.body : summary(release) }}</p>
        </li>
      </ul>
    </div>

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

const { announcements, latestRelease, hasRelease, fetchReleases } = useAnnouncements();
const { t } = useI18n();

// The store only auto-fetches in 'automatic' release-check mode; make sure the
// list is populated whenever this card mounts. fetchReleases is idempotent.
onMounted(() => fetchReleases());

// Same wording the announcements dropdown used to summarize a release.
function summary(release: { features: number; bugFixes: number; breaking: number }) {
  if (release.features > 0 && release.bugFixes > 0 && release.breaking > 0) {
    return t("releases.three_parts", {
      first: t("releases.breaking", { count: release.breaking }),
      second: t("releases.features", { count: release.features }),
      third: t("releases.bugFixes", { count: release.bugFixes }),
    });
  }
  if (release.features > 0 && release.bugFixes > 0) {
    return t("releases.two_parts", {
      first: t("releases.features", { count: release.features }),
      second: t("releases.bugFixes", { count: release.bugFixes }),
    });
  }
  if (release.features > 0 && release.breaking > 0) {
    return t("releases.two_parts", {
      first: t("releases.features", { count: release.features }),
      second: t("releases.breaking", { count: release.breaking }),
    });
  }
  if (release.bugFixes > 0 && release.breaking > 0) {
    return t("releases.two_parts", {
      first: t("releases.bugFixes", { count: release.bugFixes }),
      second: t("releases.breaking", { count: release.breaking }),
    });
  }
  if (release.features > 0) return t("releases.features", { count: release.features });
  if (release.bugFixes > 0) return t("releases.bugFixes", { count: release.bugFixes });
  if (release.breaking > 0) return t("releases.breaking", { count: release.breaking });
}
</script>
