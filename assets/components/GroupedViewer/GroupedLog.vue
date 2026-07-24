<template>
  <ScrollableView :scrollable="scrollable" v-if="group.containers.length && ready">
    <template #header>
      <ContainerDropdown :containers="group.containers">
        {{ $t("label.container", group.containers.length) }}
      </ContainerDropdown>
      <MultiContainerStat class="ml-auto" :containers="group.containers" />
    </template>
    <template #actions>
      <MultiContainerActionToolbar class="max-md:hidden" :name="group.name" @clear="viewer?.clear()" />
    </template>
    <template #default>
      <ViewerWithSource
        ref="viewer"
        :stream-source="useGroupedStream"
        :entity="group"
        :visible-keys="new Map<string[], boolean>()"
      />
    </template>
  </ScrollableView>
</template>

<script lang="ts" setup>
import ViewerWithSource from "@/components/LogViewer/ViewerWithSource.vue";
import { GroupedContainers } from "@/models/Container";
import { ComponentExposed } from "vue-component-type-helpers";

const { name, scrollable = false } = defineProps<{
  name: string;
  scrollable?: boolean;
}>();

const containerStore = useContainerStore();
const viewer = ref<ComponentExposed<typeof ViewerWithSource>>();

const { ready } = storeToRefs(containerStore);

const swarmStore = useSwarmStore();
const { customGroups } = storeToRefs(swarmStore);

const group = computed(() => customGroups.value.find((g) => g.name === name) ?? new GroupedContainers("", []));

provideLoggingContext(
  toRef(() => group.value.containers),
  { showContainerName: true, showHostname: false },
);
</script>
