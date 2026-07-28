<template>
  <!-- One log line tall with its content centred, so the timestamp sits on the
       same line as the message rather than a fraction of a line below it. -->
  <Tag class="h-[var(--log-line,1.45em)] py-0!">
    <DateTime :date="date" class="text-blue whitespace-nowrap tabular-nums" />
  </Tag>
</template>
<script lang="ts" setup>
defineProps<{
  date: Date;
}>();
</script>
