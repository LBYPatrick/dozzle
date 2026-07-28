<template>
  <!-- Same hierarchy as the container dropdown: the field name is quiet
       metadata, the value is the primary content. Values are right-aligned and
       tabular so the numbers form a column instead of drifting row to row. -->
  <div class="min-w-52">
    <div class="mb-2 flex items-center gap-2">
      <div
        class="status data-[state=exited]:status-error data-[state=running]:status-success data-[state=paused]:status-warning"
        :data-state="container.state"
      ></div>
      <span class="text-base-content truncate text-[0.95rem] font-semibold">{{ container.name }}</span>
    </div>
    <dl class="grid grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1">
      <dt>{{ $t("label.status") }}</dt>
      <dd class="capitalize" :data-state="container.state">{{ container.state }}</dd>

      <template v-if="container.startedAt.getFullYear() > 0">
        <dt>{{ $t("label.started") }}</dt>
        <dd><RelativeTime :date="container.startedAt" /></dd>
      </template>

      <template v-if="container.state != 'running' && container.finishedAt.getFullYear() > 0">
        <dt>{{ $t("label.finished") }}</dt>
        <dd><RelativeTime :date="container.finishedAt" /></dd>
      </template>

      <template v-if="container.state == 'running'">
        <dt>{{ $t("label.cpu") }}</dt>
        <dd class="tabular-nums">{{ container.stat.cpu.toFixed(2) }}%</dd>

        <dt>{{ $t("label.mem") }}</dt>
        <dd class="tabular-nums">{{ formatBytes(container.stat.memoryUsage) }}</dd>
      </template>
    </dl>
  </div>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";

const { container } = defineProps<{
  container: Container;
}>();
</script>

<style scoped>
@reference "@/main.css";

dt {
  @apply text-base-content/55 text-xs font-normal tracking-wide uppercase;
}

dd {
  @apply text-base-content text-right text-sm font-medium;
}

dd[data-state="running"] {
  @apply text-success;
}

dd[data-state="paused"] {
  @apply text-warning;
}

dd[data-state="exited"],
dd[data-state="dead"] {
  @apply text-error;
}
</style>
