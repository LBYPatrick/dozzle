<template>
  <div ref="root" class="flex min-h-[1px] flex-1 content-center justify-center">
    <span class="loading loading-spinner loading-md text-primary-safe m-2" v-show="isLoading"></span>
  </div>
</template>
<script lang="ts" setup>
// The indicator is the house `loading-spinner`. It was `loading-bars` — the
// only one of twenty loading indicators in the app that was not the spinner, so
// "waiting for older logs" was drawn differently from every other wait for no
// reason anyone chose. It is also why a three-animated-rects data: URI showed
// up in the network panel: daisyUI implements each `loading-*` variant as its
// own inline SVG mask, so a lone variant pulls in an asset nothing else uses.
//
// Kept out of the template deliberately: this component's markup is snapshotted,
// and Vue renders template comments in dev, so prose there lands in the
// snapshot and churns it on every edit.
import { LoadMoreLogEntry } from "@/models/LogEntry";

const { logEntry } = defineProps<{
  logEntry: LoadMoreLogEntry;
}>();

const isLoading = ref(false);
const root = ref<HTMLElement>();

useIntersectionObserver(root, async (entries) => {
  if (entries[0].intersectionRatio <= 0) return;
  if (isLoading.value) return;
  const scrollingParent = root.value?.closest("[data-scrolling]") || document.documentElement;
  const previousHeight = scrollingParent.scrollHeight;
  isLoading.value = true;
  await logEntry.loadMore();
  isLoading.value = false;
  await nextTick();
  if (logEntry.rememberScrollPosition) {
    scrollingParent.scrollTop += scrollingParent.scrollHeight - previousHeight;
  }
});
</script>

<style scoped></style>
