<template>
  <!-- Opened by press and closed by Escape, like every other menu — it was a
       focus-opened panel on an opaque `bg-base-100` with a `shadow-lg`, i.e. a
       third material and a second opening mechanism. -->
  <div class="dropdown" :class="{ 'dropdown-open': open }" ref="root">
    <button
      type="button"
      ref="trigger"
      class="btn btn-xs md:btn-sm gap-1.5"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="truncate"><slot /></span>
      <carbon:caret-down class="dropdown-caret size-3 shrink-0 opacity-55" />
    </button>
    <!-- Apple-style list row: one line, three columns. A tonal status dot leads,
         the identity is the primary label (full contrast, medium weight, and the
         only thing allowed to truncate), and the time is trailing metadata —
         smaller, dimmed, tabular so the column stays flush down the list. -->
    <transition name="menu-pop">
      <ul
        v-if="open"
        role="menu"
        class="dropdown-content menu glass-surface glass-surface-sheer glass-surface-popover z-50 max-h-96 w-72 origin-top-left flex-nowrap overflow-y-auto rounded-[var(--control-radius)] p-1"
        @click="onItemClick"
      >
        <li v-for="other in containers" :key="other.id">
          <router-link
            role="menuitem"
            :to="{ name: '/container/[id]', params: { id: other.id } }"
            class="grid grid-cols-[auto_minmax(0,1fr)_max-content] items-center gap-x-2.5 py-1.5"
            :title="`${label(other)} · ${other.state}`"
          >
            <!-- The shared pill's dot, so a container's state is drawn the same
                 here as in the table. daisyUI's `.status` was a fifth parallel
                 state-colour system. -->
            <span class="status-pill status-pill-dot gap-0 bg-transparent p-0" :class="stateTone(other.state)"></span>
            <span class="text-base-content truncate text-[0.9rem] font-medium">{{ label(other) }}</span>
            <span class="text-base-content/55 shrink-0 text-xs tabular-nums">
              <RelativeTime :date="timestamp(other)" />
            </span>
          </router-link>
        </li>
      </ul>
    </transition>
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

// Same mapping as the container table's, so a state is one colour app-wide.
const stateTone = (state: string) =>
  ({ running: "status-pill-success", paused: "status-pill-warning", restarting: "status-pill-warning" })[state] ??
  "status-pill-neutral";

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);
</script>

<style scoped>
.dropdown-caret {
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.dropdown-open .dropdown-caret {
  transform: rotate(180deg);
}

.menu-pop-enter-active {
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-pop-leave-active {
  transition:
    opacity 120ms ease,
    transform 160ms cubic-bezier(0.32, 0.72, 0, 1);
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .menu-pop-enter-active,
  .menu-pop-leave-active {
    transition: opacity 120ms ease;
  }

  .menu-pop-enter-from,
  .menu-pop-leave-to {
    transform: none;
  }

  .dropdown-caret {
    transition: none;
  }
}
</style>
