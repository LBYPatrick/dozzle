<template>
  <ScrollableView :scrollable="scrollable" v-if="container">
    <template #header v-if="showTitle">
      <ContainerTitle :container="container" />
      <!-- Rendered for stopped containers too: the cards report N/A rather
           than vanishing, so the bar keeps its shape and the reason for the
           missing numbers is stated. -->
      <MultiContainerStat class="ml-auto lg:hidden lg:@3xl:flex" :containers="[container]" />
    </template>
    <template #actions v-if="showTitle">
      <ContainerActionsToolbar @clear="viewer?.clear()" :container="container" />
      <a class="btn btn-circle btn-xs" @click="close()" v-if="closable">
        <mdi:close />
      </a>
    </template>
    <template #default>
      <ViewerWithSource
        ref="viewer"
        :stream-source="useContainerStream"
        :entity="container"
        :visible-keys="visibleKeys"
      />
    </template>
  </ScrollableView>
</template>

<script lang="ts" setup>
import ViewerWithSource from "@/components/LogViewer/ViewerWithSource.vue";
import { ComponentExposed } from "vue-component-type-helpers";

const {
  id,
  showTitle = false,
  scrollable = false,
  closable = false,
} = defineProps<{
  id: string;
  showTitle?: boolean;
  scrollable?: boolean;
  closable?: boolean;
}>();

const close = defineEmit();

const store = useContainerStore();
const container = store.currentContainer(toRef(() => id));
const visibleKeys = persistentVisibleKeysForContainer(container);
const viewer = useTemplateRef<ComponentExposed<typeof ViewerWithSource>>("viewer");

provideLoggingContext(
  toRef(() => [container.value]),
  { showContainerName: false, showHostname: false },
);
</script>
