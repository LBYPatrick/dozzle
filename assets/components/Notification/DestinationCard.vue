<template>
  <div class="card bg-base-100 hover:border-primary cursor-pointer border border-transparent" @click="editDestination">
    <div class="card-body gap-2 p-4">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg">
          <mdi:webhook v-if="destination.type === 'webhook'" class="text-lg" />
          <mdi:cloud v-else class="text-primary-content text-lg" />
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">{{ destination.name }}</h4>
          <p class="text-base-content/60 text-sm">
            {{
              destination.type === "webhook"
                ? $t("notifications.destination.http-webhook")
                : $t("notifications.destination.dozzle-cloud")
            }}
          </p>
        </div>
        <!-- The last focus-opened menu in the app: a `<label tabindex=0>` on an
             opaque panel. Press to open, shared material, real button. -->
        <div class="dropdown dropdown-end" :class="{ 'dropdown-open': open }" ref="root" @click.stop>
          <button
            type="button"
            ref="trigger"
            class="btn btn-ghost btn-sm btn-square"
            aria-haspopup="menu"
            :aria-expanded="open"
            :title="$t('action.more-actions')"
            :aria-label="$t('action.more-actions')"
            @click="toggle"
          >
            <ion:ellipsis-vertical />
          </button>
          <ul
            v-if="open"
            role="menu"
            class="menu dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 w-40 origin-top-right rounded-[var(--control-radius)] p-1"
            @click="onItemClick"
          >
            <li>
              <button type="button" role="menuitem" @click="editDestination">
                {{ $t("notifications.destination.edit") }}
              </button>
            </li>
            <li v-if="destination.type !== 'cloud'">
              <button type="button" role="menuitem" @click="duplicateDestination">
                {{ $t("notifications.destination.duplicate") }}
              </button>
            </li>
            <li v-if="destination.type !== 'cloud'">
              <button type="button" role="menuitem" class="text-error" @click="deleteDestination">
                {{ $t("notifications.destination.delete") }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);

import type { Dispatcher } from "@/types/notifications";
import DestinationForm from "./DestinationForm.vue";

const { destination, onUpdated, existingDispatchers } = defineProps<{
  destination: Dispatcher;
  onUpdated?: () => void;
  existingDispatchers: Dispatcher[];
}>();

const showDrawer = useDrawer();

function editDestination() {
  showDrawer(
    DestinationForm,
    {
      destination,
      onCreated: onUpdated,
      existingDispatchers,
    },
    "md",
  );
}

async function duplicateDestination() {
  await fetch(withBase("/api/notifications/dispatchers"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Copy of ${destination.name}`,
      type: destination.type,
      url: destination.url,
      template: destination.template,
      headers: destination.headers,
    }),
  });
  onUpdated?.();
}

async function deleteDestination() {
  await fetch(withBase(`/api/notifications/dispatchers/${destination.id}`), { method: "DELETE" });
  onUpdated?.();
}
</script>
