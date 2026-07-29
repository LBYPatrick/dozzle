<template>
  <ScrollableView :scrollable="scrollable" v-if="container">
    <template #header v-if="showTitle">
      <ContainerTitle :container="container" />
      <!-- Trailing edge of the identity row, i.e. the pane's top-right corner.
           One ml-auto on the wrapper, so the group stays pinned right whether or
           not the stats are wide enough to render. -->
      <div class="ml-auto flex shrink-0 items-center gap-1">
        <!-- Rendered for stopped containers too: the cards report N/A rather
             than vanishing, so the bar keeps its shape and the reason for the
             missing numbers is stated. -->
        <MultiContainerStat class="lg:hidden lg:@3xl:flex" :containers="[container]" />
        <!-- Closing a pinned pane belongs with the pane's identity, not among
             the log controls in the row below. -->
        <button
          v-if="closable"
          type="button"
          class="btn btn-ghost btn-sm btn-square transition-transform hover:-translate-y-px"
          @click="close()"
          :title="$t('button.close')"
          :aria-label="$t('button.close')"
        >
          <mdi:close class="size-5" />
        </button>
      </div>
    </template>
    <template #actions v-if="showTitle">
      <ContainerActionsToolbar @clear="viewer?.clear()" :container="container" />
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
