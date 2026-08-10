<template>
  <!-- A gap in the stream. The old zig-zag saw-tooth read as decoration; what
       this actually needs to say is "the timeline is cut here". A hairline rule
       that fades out towards both ends, broken in the middle by the button that
       fills the gap back in, says that directly. -->
  <div class="my-3 flex flex-1 items-center gap-3 px-2">
    <span class="rule rule-start flex-1"></span>
    <button
      class="btn btn-xs border-primary/25 bg-primary/12 text-primary-safe hover:bg-primary/20 shrink-0 whitespace-pre-wrap"
      @click="logEntry.loadSkippedEntries()"
    >
      <mdi:unfold-more-horizontal class="size-3.5 shrink-0" />
      {{ $t("error.logs-skipped", { total: logEntry.totalSkipped }) }}
    </button>
    <span class="rule rule-end flex-1"></span>
  </div>
</template>
<script lang="ts" setup>
import { SkippedLogsEntry } from "@/models/LogEntry";

const { logEntry } = defineProps<{
  logEntry: SkippedLogsEntry;
}>();
</script>

<style scoped>
.rule {
  height: 1px;
}

.rule-start {
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-primary) 45%, transparent));
}

.rule-end {
  background: linear-gradient(270deg, transparent, color-mix(in oklab, var(--color-primary) 45%, transparent));
}
</style>
