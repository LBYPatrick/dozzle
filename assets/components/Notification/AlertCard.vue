<template>
  <div
    class="card bg-base-100 shadow-sm"
    :class="{ 'opacity-60': !alert.enabled, 'highlight-new': isHighlighted }"
    @animationend="isHighlighted = false"
  >
    <div class="card-body gap-4 p-5">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <h3 class="type-heading flex min-w-0 flex-wrap items-center gap-2">
            <mdi:chart-line v-if="alert.metricExpression" class="text-info shrink-0" />
            <mdi:bell-ring-outline v-else-if="alert.eventExpression" class="text-info shrink-0" />
            <mdi:text-box-outline v-else class="text-info shrink-0" />
            <span class="break-all">{{ alert.name }}</span> <span class="text-sm font-light">→</span>
            <!-- Opened by press, not by the pointer passing over it: a menu that
                 changes where an alert is delivered should never open by
                 accident, and on touch a hover menu never opens at all. -->
            <div class="group/dispatch dropdown" :class="{ 'dropdown-open': open }" ref="root">
              <button
                type="button"
                ref="trigger"
                aria-haspopup="menu"
                :aria-expanded="open"
                :title="$t('notifications.alert.change-destination')"
                class="hover:bg-base-content/8 flex cursor-pointer items-center gap-1 rounded-[var(--control-radius)] px-1.5 py-1 text-xs font-light transition-colors"
                :class="{ 'text-warning': !alert.dispatcher }"
                @click="toggle"
              >
                <template v-if="alert.dispatcher">
                  <mdi:webhook v-if="alert.dispatcher.type === 'webhook'" />
                  <mdi:cloud v-else />
                  {{ alert.dispatcher.name }}
                </template>
                <template v-else>
                  <mdi:alert-outline />
                  {{ $t("notifications.alert.dispatcher-deleted") }}
                </template>
                <mdi:chevron-down class="dispatch-caret text-[0.6rem]" />
              </button>
              <ul
                v-if="open"
                role="menu"
                class="dropdown-content menu glass-surface glass-surface-sheer glass-surface-popover z-50 w-48 rounded-[var(--control-radius)] p-1.5"
                @click="onItemClick"
              >
                <li v-for="dest in dispatchers" :key="dest.id">
                  <button
                    type="button"
                    role="menuitem"
                    class="flex items-center gap-2"
                    :class="{ 'menu-active': dest.id === alert.dispatcher?.id }"
                    @click="changeDispatcher(dest.id)"
                  >
                    <mdi:webhook v-if="dest.type === 'webhook'" />
                    <mdi:cloud v-else />
                    {{ dest.name }}
                  </button>
                </li>
              </ul>
            </div>
          </h3>
          <span v-if="!alert.enabled" class="status-pill status-pill-warning">{{
            $t("notifications.alert.paused")
          }}</span>
        </div>
        <input
          type="checkbox"
          class="toggle toggle-primary shrink-0"
          :checked="alert.enabled"
          @change="toggleEnabled"
        />
      </div>

      <!-- Expressions -->
      <div class="text-base-content/80 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <span>{{ $t("notifications.alert.containers") }}</span>
        <code class="bg-base-200 text-base-content rounded px-2 py-0.5 font-mono">{{ alert.containerExpression }}</code>
        <template v-if="alert.metricExpression">
          <span>{{ $t("notifications.alert.metric-filter") }}</span>
          <code class="bg-base-200 text-base-content rounded px-2 py-0.5 font-mono">{{ alert.metricExpression }}</code>
          <span>{{ $t("notifications.alert.sample-window") }}</span>
          <span>{{ formatDuration(alert.sampleWindow || 15, locale || undefined) }}</span>
          <span>{{ $t("notifications.alert.cooldown") }}</span>
          <span>{{ formatDuration(alert.cooldown || 300, locale || undefined) }}</span>
        </template>
        <template v-else-if="alert.eventExpression">
          <span>{{ $t("notifications.alert.event-filter") }}</span>
          <code class="bg-base-200 text-base-content rounded px-2 py-0.5 font-mono">{{ alert.eventExpression }}</code>
          <template v-if="alert.cooldown">
            <span>{{ $t("notifications.alert.cooldown") }}</span>
            <span>{{ formatDuration(alert.cooldown, locale || undefined) }}</span>
          </template>
        </template>
        <template v-else>
          <span>{{ $t("notifications.alert.log-filter") }}</span>
          <code class="bg-base-200 text-base-content rounded px-2 py-0.5 font-mono">{{ alert.logExpression }}</code>
        </template>
      </div>

      <!-- Footer -->
      <div
        class="border-base-content/10 text-base-content/80 flex items-center justify-between gap-2 border-t pt-3 text-xs"
      >
        <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {{ $t("notifications.alert.containers-count", { count: alert.triggeredContainers }) }}
          </span>
          <span>
            {{ $t("notifications.alert.triggered-count", { count: alert.triggerCount }) }}
          </span>
          <span v-if="alert.lastTriggeredAt">
            {{ $t("notifications.alert.last-triggered", { time: formatTimeAgo(alert.lastTriggeredAt) }) }}
          </span>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button class="btn btn-ghost btn-square" @click="editAlert">
            <mdi:pencil-outline />
          </button>
          <button class="btn btn-ghost btn-square" @click="deleteAlert" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading loading-spinner loading-xs"></span>
            <mdi:trash-can-outline v-else />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);

import type { Dispatcher, NotificationRule } from "@/types/notifications";
import AlertForm from "./AlertForm.vue";

const { alert, onUpdated, highlight } = defineProps<{
  alert: NotificationRule;
  onUpdated?: () => void;
  highlight?: boolean;
}>();

const isHighlighted = ref(highlight ?? false);
watch(
  () => highlight,
  (v) => {
    if (v) isHighlighted.value = true;
  },
);

const showDrawer = useDrawer();
const isDeleting = ref(false);
const dispatchers = ref<Dispatcher[]>([]);

onMounted(async () => {
  const res = await fetch(withBase("/api/notifications/dispatchers"));
  dispatchers.value = await res.json();
});

async function changeDispatcher(id: number) {
  await fetch(withBase(`/api/notifications/rules/${alert.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dispatcherId: id }),
  });
  onUpdated?.();
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (date.getFullYear() === 0) return "-";
  return toRelativeTime(date, undefined);
}

async function toggleEnabled() {
  await fetch(withBase(`/api/notifications/rules/${alert.id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: !alert.enabled }),
  });
  onUpdated?.();
}

function editAlert() {
  showDrawer(AlertForm, { alert, onCreated: onUpdated }, "lg");
}

async function deleteAlert() {
  isDeleting.value = true;
  try {
    await fetch(withBase(`/api/notifications/rules/${alert.id}`), { method: "DELETE" });
    onUpdated?.();
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
/* The caret is quiet until the row is hovered or the control is focused, and
   flips while the menu is open — the same disclosure language the rest of the
   app's pull-downs use. Focus is included so a keyboard user can see which
   control they are on. */
.dispatch-caret {
  opacity: 0;
  transition:
    opacity 150ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.group\/dispatch:hover .dispatch-caret,
.group\/dispatch:focus-within .dispatch-caret,
.dropdown-open .dispatch-caret {
  opacity: 1;
}

.dropdown-open .dispatch-caret {
  transform: rotate(180deg);
}

@media (pointer: coarse) {
  .dispatch-caret {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dispatch-caret {
    transition: opacity 150ms ease;
  }
  .dropdown-open .dispatch-caret {
    transform: none;
  }
}

.card.highlight-new {
  animation: highlight-fade 3s ease-out;
}

@keyframes highlight-fade {
  from {
    background-color: oklch(from var(--color-secondary) l c h / 0.25);
  }
  to {
    background-color: transparent;
  }
}
</style>
