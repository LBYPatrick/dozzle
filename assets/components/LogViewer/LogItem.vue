<template>
  <!-- --log-line is the row's first-line box height. Every leading element (the
       level dot, the std/host/container tags, the timestamp) sizes itself to it
       and centres its content, so they all land on the same horizontal line as
       the message text instead of each sitting at its own offset. It is an em,
       so it tracks the small/medium/large log size setting. -->
  <div
    class="relative flex w-full items-start gap-x-2 leading-[1.45] [--log-line:1.45em] group-[.compact]:items-stretch"
  >
    <LogActions :logEntry :container />

    <LogStd :std="logEntry.std" class="shrink-0 select-none" v-if="showStd" />

    <div class="flex gap-x-2 gap-y-1 group-[.compact]:gap-y-0 md:flex-row!">
      <!-- No width class: the cell sizes itself from --log-source-chars, which
           LogList derives from the longest name on screen. Uniform down the
           column, so the timestamps stay flush, without reserving room for
           names nobody has. -->
      <LogSource
        v-if="showHostname || showContainerName"
        class="shrink-0 select-none"
        :host="showHostname ? host.name : undefined"
        :container-name="showContainerName ? container.name : undefined"
        :color-key="container.id"
      />
      <LogDate v-if="showTimestamp" :date="logEntry.date" class="shrink-0 select-none" />
    </div>
    <slot />
  </div>
</template>
<script lang="ts" setup>
import { LogEntry } from "@/models/LogEntry";

const { logEntry } = defineProps<{
  logEntry: LogEntry<any>;
}>();
const { showHostname, showContainerName } = useLoggingContext();

const { currentContainer } = useContainerStore();
const { hosts } = useHosts();

const container = currentContainer(toRef(() => logEntry.containerID));
const host = computed(() => hosts.value[container.value.host]);
</script>
