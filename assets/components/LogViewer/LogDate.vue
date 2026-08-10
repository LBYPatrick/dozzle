<template>
  <!-- One log line tall with its content centred, so the timestamp sits on the
       same line as the message rather than a fraction of a line below it. -->
  <Tag class="h-[var(--log-line,1.45em)] py-0!">
    <!-- The readable form of `info`, not the raw `--color-blue`: that measured
         2.96:1 against the light log surface, and a timestamp is body text on
         the densest screen in the app. -->
    <DateTime :date="date" class="log-date whitespace-nowrap tabular-nums" />
  </Tag>
</template>
<script lang="ts" setup>
defineProps<{
  date: Date;
}>();
</script>

<style scoped>
.log-date {
  color: var(--color-info-text);
}
</style>
