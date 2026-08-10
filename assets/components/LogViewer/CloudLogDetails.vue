<template>
  <!-- Same shape as LogDetails, deliberately: the two are the same screen for
       the same kind of object, and the only real difference is that this one's
       container may no longer exist locally. That difference is stated once, as
       a pill next to the message, rather than changing the layout. -->
  <DrawerPanel :eyebrow="$t('drawer.log-entry')">
    <template #leading>
      <span v-if="hit.level" class="status-pill level-pill" :data-level="hit.level">{{ hit.level }}</span>
    </template>

    <template #title><DateTime :date="date" /></template>
    <template #subtitle> <RelativeTime :date="date" /> · {{ hit.stream }} </template>

    <template #actions>
      <RouterLink
        v-if="isLive"
        :to="liveLink"
        @click="close?.()"
        class="btn btn-sm gap-1.5"
        :title="$t('action.see-in-context')"
      >
        <material-symbols:eye-tracking class="size-4" />
        <span class="max-md:hidden">{{ $t("action.see-in-context") }}</span>
      </RouterLink>
    </template>

    <div class="flex flex-col gap-7">
      <section class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="type-section">{{ $t("drawer.message") }}</h2>

          <span v-if="!isLive" class="status-pill status-pill-neutral">
            <mdi:cloud-off-outline class="size-3.5" />
            {{ $t("cloud-search.container-removed") }}
          </span>

          <UseClipboard v-slot="{ copy, copied }" :source="hit.message">
            <button
              class="btn btn-sm btn-square hit-44 relative ml-auto"
              @click="copy()"
              :title="$t('action.copy-log')"
              :aria-label="$t('action.copy-log')"
            >
              <mdi:check v-if="copied" class="text-success size-4" />
              <material-symbols:content-copy v-else class="size-4" />
            </button>
          </UseClipboard>
        </div>

        <!-- dvh, and a tonal well rather than the `border-white/20` hairline
             that was invisible on the light theme. -->
        <div class="bg-base-content/4 h-[46dvh] overflow-hidden rounded-[var(--control-radius)]">
          <JsonEditor :model-value="displayMessage" read-only />
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="type-section">{{ $t("drawer.source") }}</h2>
        <div class="inset-group">
          <div class="inset-row">
            <span class="inset-label">{{ $t("label.container-name") }}</span>
            <span class="inset-value truncate">{{ hit.containerName }}</span>
          </div>
          <div class="inset-row">
            <span class="inset-label">{{ $t("label.host") }}</span>
            <span class="inset-value truncate">{{ hostName }}</span>
          </div>
          <div class="inset-row">
            <span class="inset-label">{{ image ? $t("drawer.image") : $t("drawer.container-id") }}</span>
            <span class="inset-value truncate font-mono">{{ image ?? shortId }}</span>
          </div>
        </div>
      </section>
    </div>
  </DrawerPanel>
</template>

<script setup lang="ts">
import type { CloudLogHit } from "@/composable/cloudLogSearch";
import { UseClipboard } from "@vueuse/components";
import DrawerPanel from "@/components/common/DrawerPanel.vue";

const { hit, close } = defineProps<{ hit: CloudLogHit; query?: string; close?: () => void }>();

// hit.ts is unix nanoseconds (see internal/cloud/search.go: TimestampNs).
const date = computed(() => new Date(hit.ts / 1e6));
const shortId = computed(() => hit.containerId.slice(0, 12));

const { hosts } = useHosts();
const hostName = computed(() => hosts.value[hit.hostId]?.name ?? hit.hostId);

// Resolve the hit against the live container store: if the container still
// exists we can show its image and offer a jump into its live logs.
const containerStore = useContainerStore();
const liveContainer = computed(() => containerStore.allContainersById[hit.containerId]);
const isLive = computed(() => !!liveContainer.value);
const image = computed(() => liveContainer.value?.image);

const liveLink = computed(() => ({
  name: "/container/[id].time.[datetime]" as const,
  params: { id: hit.containerId, datetime: date.value.toISOString() },
  query: hit.logId ? { logId: String(hit.logId) } : {},
}));

// Pretty-print JSON payloads; leave everything else verbatim.
const displayMessage = computed(() => {
  const trimmed = hit.message.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      /* not valid JSON, fall through */
    }
  }
  return hit.message;
});
</script>
