<template>
  <div class="flex flex-col gap-8">
    <!-- Destinations -->
    <div>
      <h3 class="type-section mb-4">
        {{ $t("notifications.destinations") }}
      </h3>

      <template v-if="dispatchers.length === 0">
        <p class="text-base-content/60 mb-4 text-sm">{{ $t("notifications.empty-state.description") }}</p>
        <button
          class="card card-border border-base-content/30 hover:border-base-content/50 w-full cursor-pointer border-dashed transition-colors md:w-72"
          @click="openAddDestination"
        >
          <div class="card-body items-center justify-center gap-1 p-4">
            <mdi:plus class="text-2xl" />
            <span class="text-base-content/60 text-sm">{{ $t("notifications.add-destination") }}</span>
          </div>
        </button>
      </template>

      <template v-else>
        <div class="flex flex-wrap gap-4">
          <DestinationCard
            v-for="dest in dispatchers"
            :key="dest.id"
            :destination="dest"
            :on-updated="fetchAll"
            :existing-dispatchers="dispatchers"
            class="w-full md:w-72"
          />
          <button
            class="card card-border border-base-content/30 hover:border-base-content/50 w-full cursor-pointer border-dashed transition-colors md:w-72"
            @click="openAddDestination"
          >
            <div class="card-body items-center justify-center gap-1 p-4">
              <mdi:plus class="text-2xl" />
              <span class="text-base-content/60 text-sm">{{ $t("notifications.add-destination") }}</span>
            </div>
          </button>
        </div>
      </template>
    </div>

    <!-- Alerts -->
    <div>
      <div class="mb-4">
        <h3 class="type-section">{{ $t("notifications.alerts") }}</h3>
      </div>

      <div class="tabs tabs-box mb-6">
        <button class="tab" :class="{ 'tab-active': filter === 'all' }" @click="filter = 'all'">
          {{ $t("notifications.filter.all", { count: alerts.length }) }}
        </button>
        <button class="tab" :class="{ 'tab-active': filter === 'enabled' }" @click="filter = 'enabled'">
          {{ $t("notifications.filter.enabled", { count: enabledCount }) }}
        </button>
        <button class="tab" :class="{ 'tab-active': filter === 'paused' }" @click="filter = 'paused'">
          {{ $t("notifications.filter.paused", { count: pausedCount }) }}
        </button>
      </div>

      <div class="space-y-4">
        <AlertCard
          v-for="alert in filteredAlerts"
          :key="alert.id"
          :alert="alert"
          :on-updated="fetchAlerts"
          :highlight="alert.id === highlightId"
        />
        <button
          class="card card-border border-base-content/30 hover:border-base-content/50 w-full cursor-pointer border-dashed transition-colors"
          @click="openCreateAlert"
        >
          <div class="card-body items-center justify-center gap-1 p-4">
            <mdi:plus class="text-2xl" />
            <span class="text-base-content/60 text-sm">{{ $t("notifications.add-alert") }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NotificationRule, Dispatcher } from "@/types/notifications";
import AlertForm from "@/components/Notification/AlertForm.vue";
import DestinationForm from "@/components/Notification/DestinationForm.vue";

// highlightId flags a specific alert card (e.g. a just-created default alert
// linked from elsewhere). Optional — the popup context doesn't set it.
const { highlightId = null } = defineProps<{ highlightId?: number | null }>();

const { t } = useI18n();
const showDrawer = useDrawer();

const alerts = ref<NotificationRule[]>([]);
const dispatchers = ref<Dispatcher[]>([]);

async function fetchAlerts() {
  const res = await fetch(withBase("/api/notifications/rules"));
  alerts.value = await res.json();
}

async function fetchDispatchers() {
  const res = await fetch(withBase("/api/notifications/dispatchers"));
  dispatchers.value = await res.json();
}

async function fetchAll() {
  await Promise.all([fetchAlerts(), fetchDispatchers()]);
}

const filter = ref<"all" | "enabled" | "paused">("all");
const enabledCount = computed(() => alerts.value.filter((a) => a.enabled).length);
const pausedCount = computed(() => alerts.value.filter((a) => !a.enabled).length);
const filteredAlerts = computed(() => {
  if (filter.value === "enabled") return alerts.value.filter((a) => a.enabled);
  if (filter.value === "paused") return alerts.value.filter((a) => !a.enabled);
  return alerts.value;
});

function openCreateAlert() {
  showDrawer(AlertForm, { onCreated: fetchAlerts }, "lg");
}

function openCreateAlertPrefilled() {
  const cloudDispatcher = dispatchers.value.find((d) => d.type === "cloud");
  showDrawer(
    AlertForm,
    {
      onCreated: fetchAlerts,
      prefill: {
        name: t("notifications.prefill-name"),
        logExpression: t("notifications.prefill-expression"),
        ...(cloudDispatcher ? { dispatcherId: cloudDispatcher.id } : {}),
      },
    },
    "lg",
  );
}

function openAddDestination() {
  showDrawer(DestinationForm, { onCreated: fetchDispatchers }, "md");
}

onMounted(fetchAll);

// The route page triggers the prefilled create-alert flow from ?action=create-alert.
defineExpose({ openCreateAlertPrefilled });
</script>
