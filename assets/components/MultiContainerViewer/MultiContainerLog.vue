<template>
  <ScrollableView :scrollable="scrollable" v-if="containers.length && ready">
    <template #header>
      <octicon:container-24 />
      <ContainerDropdown :containers="containers">{{ $t("label.container", containers.length) }}</ContainerDropdown>
      <MultiContainerStat class="ml-auto" :containers="containers" />
    </template>
    <template #actions>
      <MultiContainerActionToolbar @clear="viewer?.clear()" />
    </template>
    <template #default>
      <ViewerWithSource
        ref="viewer"
        :stream-source="useMergedStream"
        :entity="containers"
        :visible-keys="new Map<string[], boolean>()"
      />
    </template>
  </ScrollableView>
</template>

<script lang="ts" setup>
import ViewerWithSource from "@/components/LogViewer/ViewerWithSource.vue";
import { ComponentExposed } from "vue-component-type-helpers";

const { ids = [], scrollable = false } = defineProps<{
  ids?: string[];
  scrollable?: boolean;
}>();

const containerStore = useContainerStore();
const viewer = ref<ComponentExposed<typeof ViewerWithSource>>();
const { allContainersById, ready } = storeToRefs(containerStore);
const containers = computed(() => ids.map((id) => allContainersById.value[id]));

provideLoggingContext(containers, { showContainerName: true, showHostname: false });
</script>
