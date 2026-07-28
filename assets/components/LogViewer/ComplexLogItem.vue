<template>
  <DefineTemplate v-slot="{ data }">
    <!-- gap, not space-x: `space-x-*` puts a left margin on every child except
         the first, so once the pairs wrap the second row starts indented by one
         gap and the columns stop lining up. -->
    <ul class="inline-flex flex-wrap gap-x-4 gap-y-0.5" @click="preventDefaultOnLinks">
      <li v-for="(value, name) in data" :key="name" v-if="isObject(data)">
        <span class="key">{{ name }}=</span>
        <span class="value" v-if="value === null">&lt;null&gt;</span>
        <ReuseTemplate :data="value" v-else-if="isObject(value) || Array.isArray(value)" />
        <span v-else class="value" :class="typeof value" v-html="stripAnsi(String(value))"></span>
      </li>
      <li v-else-if="Array.isArray(data)">
        <ul class="array inline-flex flex-wrap gap-x-1">
          <li
            v-for="(item, index) in data"
            :key="index"
            class="after:text-base-content/70 not-last:after:content-[',']"
          >
            <ReuseTemplate :data="item" v-if="isObject(item) || Array.isArray(item)" />
            <span v-else class="value" :class="typeof item" v-html="stripAnsi(String(item))"></span>
          </li>
        </ul>
      </li>
      <li class="key" v-if="Object.keys(validValues).length === 0">all values are hidden</li>
    </ul>
  </DefineTemplate>
  <LogItem :logEntry>
    <LogLevel class="flex select-none" :level="logEntry.level" />
    <!-- flex, so the inline-flex list below is a flex item and not an inline box
         sitting on a text baseline — the baseline's descender space is what
         pushed complex entries a couple of pixels below the level dot and the
         timestamp on the same row. -->
    <div
      @click="containers.length > 0 && showDrawer(LogDetails, { entry: logEntry })"
      class="flex min-w-0 cursor-pointer"
    >
      <ReuseTemplate :data="validValues" />
    </div>
  </LogItem>
</template>
<script lang="ts" setup>
import stripAnsi from "strip-ansi";
import { type ComplexLogEntry } from "@/models/LogEntry";
import LogDetails from "./LogDetails.vue";

const { logEntry } = defineProps<{
  logEntry: ComplexLogEntry;
  showContainerName?: boolean;
}>();

const { containers } = useLoggingContext();

const [DefineTemplate, ReuseTemplate] = createReusableTemplate();

const validValues = computed(() => {
  return Object.fromEntries(Object.entries(logEntry.message).filter(([_, value]) => value !== undefined));
});

const showDrawer = useDrawer();
function preventDefaultOnLinks(event: MouseEvent) {
  if (event.target instanceof HTMLAnchorElement && event.target.rel?.includes("external")) {
    event.stopImmediatePropagation();
  }
}
</script>

<style scoped>
@reference "@/main.css";
.key {
  @apply text-base-content/70 font-light;
}

.value {
  @apply text-base-content font-bold;
}

.array {
  @apply before:text-base-content/80 after:text-base-content/80 before:content-['['] after:content-[']'];
}

.string {
  @apply before:content-['"'] after:content-['"'];
}
</style>
