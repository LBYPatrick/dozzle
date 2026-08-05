<template>
  <AllLogs :scrollable="pinnedLogs.length > 0" />
</template>

<script lang="ts" setup>
import AllLogs from "@/components/SearchViewer/AllLogs.vue";

const pinnedLogsStore = usePinnedLogsStore();
const { pinnedLogs } = storeToRefs(pinnedLogsStore);

// `?search=` is picked up by useSearchFilter, which seeds the first view that
// asks for it — so arriving here from the palette lands with the query already
// applied and the server's backward scan already running.
const { t } = useI18n();
watchEffect(() => setTitle(t("label.all-logs")));
</script>
