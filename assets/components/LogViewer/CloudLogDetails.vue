<template>
  <!-- Matches LogDetails' layout so the cloud-search drawer feels identical to
       the normal log-details panel: level tag + timestamp header, a 3-up meta
       grid, then the raw message. The message is a cloud-indexed line (possibly
       from a container that no longer exists locally), so it's rendered in a
       read-only CodeMirror instead of the live-only fields table. -->
  <header class="flex items-center gap-4">
    <Tag v-if="hit.level" :data-level="hit.level" class="show-unknown text-white uppercase">{{ hit.level }}</Tag>
    <h1 class="text-lg max-md:hidden">
      <DateTime :date="date" />
    </h1>
    <h2 class="text-sm"><RelativeTime :date="date" /> on {{ hit.stream }}</h2>
    <RouterLink
      v-if="isLive"
      :to="liveLink"
      @click="close?.()"
      class="btn btn-ghost btn-xs ml-auto gap-1.5"
      :title="$t('action.see-in-context')"
    >
      <material-symbols:eye-tracking />
      <span class="max-md:hidden">{{ $t("action.see-in-context") }}</span>
    </RouterLink>
  </header>

  <div class="mt-8 flex flex-col gap-10">
    <section class="grid grid-cols-3 gap-2">
      <div>
        <div class="font-thin">Container Name</div>
        <div class="truncate text-lg font-bold">{{ hit.containerName }}</div>
      </div>
      <div>
        <div class="font-thin">Host</div>
        <div class="truncate text-lg font-bold">{{ hostName }}</div>
      </div>
      <div>
        <div class="font-thin">{{ image ? "Image" : "Container ID" }}</div>
        <div class="truncate text-lg font-bold">{{ image ?? shortId }}</div>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        Message

        <UseClipboard v-slot="{ copy, copied }" :source="hit.message">
          <button class="swap outline-hidden" @click="copy()" :class="{ 'swap-active': copied }">
            <mdi:check class="swap-on" />
            <material-symbols:content-copy class="swap-off" />
          </button>
        </UseClipboard>

        <span
          v-if="!isLive"
          class="bg-base-content/10 text-base-content/60 ml-auto inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs"
        >
          <mdi:cloud-off-outline class="size-3.5" />
          {{ $t("cloud-search.container-removed") }}
        </span>
      </div>
      <div class="bg-base-200 h-[55vh] overflow-hidden rounded-sm border border-white/20">
        <JsonEditor :model-value="displayMessage" read-only />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CloudLogHit } from "@/composable/cloudLogSearch";
import { UseClipboard } from "@vueuse/components";

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
