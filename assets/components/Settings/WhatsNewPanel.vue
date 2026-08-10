<template>
  <!-- Secondary "What's New" screen of the settings popup: the release list the
       top-right announcements bell used to show. -->
  <div class="flex flex-col gap-4">
    <ul v-if="announcements.length" class="flex flex-col gap-5">
      <li v-for="release in announcements" :key="release.tag" class="flex flex-col gap-1.5">
        <div class="flex items-baseline gap-2">
          <carbon:warning v-if="release.breaking > 0" class="stroke-orange self-center" />
          <carbon:information v-else class="text-info self-center" />
          <a :href="release.htmlUrl" target="_blank" rel="noopener noreferrer" class="link-primary type-heading">
            {{ release.name }}
          </a>
          <span v-if="release.latest" class="status-pill status-pill-primary ml-1">{{ $t("releases.latest") }}</span>
          <span class="text-base-content/50 ml-auto text-xs whitespace-nowrap">
            <RelativeTime :date="release.createdAt" />
          </span>
        </div>
        <p class="text-base-content/70 text-sm whitespace-pre-line">
          {{ release.announcement ? release.body : summary(release) }}
        </p>
      </li>
    </ul>

    <div v-else class="text-base-content/60 flex flex-col items-center gap-2 py-10 text-center">
      <mdi:party-popper class="text-base-content/40 size-8" />
      <p class="text-sm">{{ $t("releases.no_releases") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnnouncements } from "@/stores/announcements";

const { announcements, fetchReleases } = useAnnouncements();
const { t } = useI18n();

// The store only auto-fetches in 'automatic' release-check mode; ensure the list
// is populated when this screen opens. fetchReleases is idempotent.
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
