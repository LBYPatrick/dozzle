<template>
  <div class="dropdown">
    <button tabindex="0" role="button" class="btn btn-xs md:btn-sm gap-1.5">
      <span class="truncate"><slot /></span>
      <carbon:caret-down class="size-3 shrink-0 opacity-55" />
    </button>
    <!-- Apple-style list row: one line, three columns. A tonal status dot leads,
         the identity is the primary label (full contrast, medium weight, and the
         only thing allowed to truncate), and the time is trailing metadata —
         smaller, dimmed, tabular so the column stays flush down the list. -->
    <ul
      tabindex="0"
      class="dropdown-content menu rounded-box bg-base-100 border-base-content/10 z-50 max-h-96 w-72 flex-nowrap overflow-y-auto border p-1 shadow-lg"
    >
      <li v-for="other in containers" :key="other.id">
        <router-link
          :to="{ name: '/container/[id]', params: { id: other.id } }"
          class="grid grid-cols-[auto_minmax(0,1fr)_max-content] items-center gap-x-2.5 py-1.5"
          :title="`${label(other)} · ${other.state}`"
        >
          <div
            class="status data-[state=exited]:status-error data-[state=running]:status-success data-[state=paused]:status-warning"
            :data-state="other.state"
          ></div>
          <span class="text-base-content truncate text-[0.9rem] font-medium">{{ label(other) }}</span>
          <span class="text-base-content/55 shrink-0 text-xs tabular-nums">
            <RelativeTime :date="timestamp(other)" />
          </span>
        </router-link>
      </li>
    </ul>
  </div>
</template>
<script lang="ts" setup>
import { type Container } from "@/models/Container";
const { containers } = defineProps<{
  containers: Container[];
}>();

// Swarm tasks all share a service name, so the short task id is the identity
// that actually distinguishes them.
const label = (container: Container) => (container.isSwarm ? container.swarmId : container.name);

// Running containers are described by how long they have been up; stopped ones
// by when they went away.
const timestamp = (container: Container) =>
  container.state === "running" ? container.startedAt : container.finishedAt;
</script>
