<template>
  <ScrollableView :scrollable="scrollable" v-if="ready">
    <template #header>
      <!-- Row 1. The host filter leads because on a fleet view "which machines"
           is the question you adjust; the container count is the answer to it,
           so it follows rather than leads.
           It only appears with more than one host — on a single-host install a
           filter with one option is a control that cannot do anything. -->
      <HostFilterMenu v-if="hostCount > 1" v-model="selectedHosts" :containers="visibleContainers" />

      <!-- Guarded, unlike before: with nothing running this rendered a bare
           "No containers" floating in the bar, which read as a broken label
           rather than a state. -->
      <ContainerDropdown v-if="visibleContainers.length" :containers="visibleContainers">
        {{ $t("label.container", visibleContainers.length) }}
      </ContainerDropdown>
      <span v-else class="text-base-content/50 text-sm">{{ $t("label.container", 0) }}</span>

      <!-- Same control as the sidebar's, so running-vs-all is one setting. It
           changes what the server streams and scans, not just what is drawn. -->
      <ShowAllContainersToggle class="ml-auto" />
      <MultiContainerStat :containers="visibleContainers" />
    </template>
    <template #default>
      <ViewerWithSource
        :stream-source="useAllContainersStream"
        :entity="selectedHosts"
        :visible-keys="new Map<string[], boolean>()"
      />
    </template>
  </ScrollableView>
</template>

<script lang="ts" setup>
import ViewerWithSource from "@/components/LogViewer/ViewerWithSource.vue";
import { Container } from "@/models/Container";

const { scrollable = false } = defineProps<{ scrollable?: boolean }>();

const containerStore = useContainerStore();
const { ready, containers: allContainers } = storeToRefs(containerStore) as unknown as {
  ready: Ref<boolean>;
  containers: Ref<Container[]>;
};

const { hosts } = useHosts();
const hostCount = computed(() => Object.keys(hosts.value).length);

// Empty means every host, matching what the server treats as no filter. Handed
// to the stream as its entity, so changing it rebuilds the URL and reconnects —
// the filter narrows what the server scans rather than what we hide afterwards.
const selectedHosts = ref<string[]>([]);

const running = computed(() => allContainers.value.filter((c) => c.state === "running"));

// The header has to describe the same set the log body draws from, so it obeys
// the filter too.
const visibleContainers = computed(() =>
  selectedHosts.value.length === 0 ? running.value : running.value.filter((c) => selectedHosts.value.includes(c.host)),
);

// Hostnames only earn their line when there is more than one host: a fleet view
// is where two containers can share a name and mean different machines, but on a
// single-host install the same word on every row is repetition, and it was
// costing the column the width the container name needed.
provideLoggingContext(visibleContainers, { showContainerName: true, showHostname: hostCount.value > 1 });
</script>
