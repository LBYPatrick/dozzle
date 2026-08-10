<template>
  <HistoricalContainerLog :id :date show-title :scrollable="pinnedLogs.length > 0" v-if="currentContainer" />
  <!-- A dead end with no way out, same as the 404 was: one sentence, no link.
       §16 Wayfinding — every screen has to answer "how do I get out of here".
       `dvh` rather than `screen` so it does not run under the iOS URL bar. -->
  <div v-else-if="ready" class="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-4 text-center">
    <ph:magnifying-glass class="text-base-content/30 size-8" />
    <div class="flex flex-col gap-1">
      <h1 class="type-title">{{ $t("error.container-not-found") }}</h1>
      <p class="type-caption text-base-content/60">{{ $t("error.page-not-found-hint") }}</p>
    </div>
    <router-link :to="{ name: '/' }" class="btn btn-sm btn-primary">
      {{ $t("button.back-to-dashboard") }}
    </router-link>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute("/container/[id].time.[datetime]");
const id = toRef(() => route.params.id);
const date = toRef(() => new Date(route.params.datetime));
const containerStore = useContainerStore();
const currentContainer = containerStore.currentContainer(id);
const { ready } = storeToRefs(containerStore);
const pinnedLogsStore = usePinnedLogsStore();
const { pinnedLogs } = storeToRefs(pinnedLogsStore);

watchEffect(() => {
  if (ready.value) {
    if (currentContainer.value) {
      setTitle(currentContainer.value.name);
    } else {
      setTitle("Not Found");
    }
  }
});
</script>
<route lang="yaml">
meta:
  menu: host
</route>
