<template>
  <Tag :std="std" class="h-[var(--log-line,1.45em)] py-0!">
    {{ std }}
  </Tag>
</template>

<script lang="ts" setup>
import { Std } from "@/models/LogEntry";

defineProps<{
  std: Std;
}>();
</script>

<style scoped>
@reference "@/main.css";
[std="stdout"] {
  @apply text-blue;
}

[std="stderr"] {
  @apply text-red;
}
</style>
