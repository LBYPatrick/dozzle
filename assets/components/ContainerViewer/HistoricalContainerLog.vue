<template>
  <ScrollableView :scrollable="scrollable" v-if="container">
    <template #header v-if="showTitle">
      <ContainerTitle :container="container" />
      <!-- Close sits at the pane's top-right corner, alongside the identity,
           rather than among the log controls in the row below. -->
      <button
        v-if="closable"
        type="button"
        class="btn btn-ghost btn-sm btn-square ml-auto shrink-0 transition-transform hover:-translate-y-px"
        @click="close()"
        :title="$t('button.close')"
        :aria-label="$t('button.close')"
      >
        <mdi:close class="size-5" />
      </button>
    </template>
    <template #actions v-if="showTitle">
      <!-- "Jump back to the live tail". A tonal capsule rather than a solid
           filled button: this is a lateral move, not the page's primary action.
           The breathing dot is the live signal, so the label can stay one short
           word. -->
      <router-link
        :to="{ name: '/container/[id]', params: { id: container.id } }"
        class="btn btn-sm border-secondary/25 bg-secondary/15 text-secondary hover:bg-secondary/25 gap-2 font-medium"
        v-if="container.state === 'running'"
        :title="$t('label.live-logs')"
      >
        <span class="live-dot"></span>
        {{ $t("label.live-logs") }}
      </router-link>
      <ContainerActionsToolbar class="max-md:hidden" :container="container" historical />
    </template>
    <template #default>
      <ViewerWithSource
        ref="viewer"
        :stream-source="useHistoricalContainerLog"
        :entity="historicalContainer"
        :visible-keys="visibleKeys"
      />
    </template>
  </ScrollableView>
</template>

<script lang="ts" setup>
import ViewerWithSource from "@/components/LogViewer/ViewerWithSource.vue";
import { HistoricalContainer } from "@/models/Container";
import { ComponentExposed } from "vue-component-type-helpers";

const {
  id,
  showTitle = false,
  scrollable = false,
  closable = false,
  date,
} = defineProps<{
  id: string;
  showTitle?: boolean;
  scrollable?: boolean;
  closable?: boolean;
  date: Date;
}>();

const close = defineEmit();

const store = useContainerStore();
const container = store.currentContainer(toRef(() => id));
const historicalContainer = toRef(() => new HistoricalContainer(container.value, date));
const visibleKeys = persistentVisibleKeysForContainer(container);
useTemplateRef<ComponentExposed<typeof ViewerWithSource>>("viewer");

provideLoggingContext(
  toRef(() => [container.value]),
  { showContainerName: false, showHostname: false, historical: true },
);
</script>

<style scoped>
.live-dot {
  position: relative;
  width: 0.5rem;
  height: 0.5rem;
  flex: none;
  border-radius: 999px;
  background-color: currentColor;
}

/* A halo that expands and fades, so the badge reads as "streaming" without a
   spinner competing with the log view's own loading indicators. */
.live-dot::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background-color: currentColor;
  animation: live-pulse 1.8s ease-out infinite;
}

@keyframes live-pulse {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  70%,
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-dot::after {
    animation: none;
  }
}
</style>
