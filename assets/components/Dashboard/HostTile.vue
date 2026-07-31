<template>
  <!-- A host, compact and navigable. The old card was ~480px wide and held two
       tinted metric boxes, each with its own chart and an avg/peak line — a
       screenful for three hosts, and none of it was clickable, so the one thing
       you actually want from a host on this page (its logs) wasn't offered.

       Meters, not charts. The question a list of hosts answers is "which one is
       busy", which is a comparison across rows; a shared scale answers it at a
       glance where five separate time series do not. -->
  <li>
    <router-link :to="{ name: '/host/[id]', params: { id: host.id } }" class="tile block rounded-lg p-3">
      <div class="flex items-center gap-2">
        <HostIcon :type="host.type" class="text-base-content/40 size-3.5 shrink-0" />
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ host.name }}</span>

        <span v-if="host.available" class="text-base-content/45 shrink-0 text-xs tabular-nums">
          {{ totals.running.length }}
        </span>
        <span v-else class="text-error shrink-0 text-[0.7rem] font-medium">{{ $t("label.host-unavailable") }}</span>

        <!-- Says the row goes somewhere, and leans the way it will take you. -->
        <ph:caret-right class="chevron text-base-content/25 size-3 shrink-0" />
      </div>

      <!-- An unreachable host has no load to report. Two meters at 0% are not
           "quiet", they are a measurement, and they claim the machine is idle
           when all we know is that we cannot see it. -->
      <div v-if="host.available" class="mt-2.5 flex flex-col gap-1.5">
        <div v-for="meter in meters" :key="meter.label" class="flex items-center gap-2">
          <span class="text-base-content/45 w-7 shrink-0 text-[0.6rem] font-semibold tracking-wider uppercase">
            {{ meter.label }}
          </span>
          <div class="bg-base-content/10 h-1 min-w-0 flex-1 overflow-hidden rounded-full">
            <div class="fill h-full rounded-full" :class="meter.class" :style="{ width: `${meter.percent}%` }" />
          </div>
          <span class="w-14 shrink-0 text-right text-[0.7rem] tabular-nums">{{ meter.text }}</span>
        </div>
      </div>
    </router-link>
  </li>
</template>

<script setup lang="ts">
import type { Host } from "@/stores/hosts";

const { host } = defineProps<{ host: Host }>();

const totals = useHostTotals(() => host);
const { t } = useI18n();

const meters = computed(() => [
  {
    label: t("label.cpu"),
    percent: totals.value.cpuPercent,
    text: `${cpuDisplayValue(totals.value.cpuPercent, totals.value.cpuPerCore).toFixed(1)}%`,
    class: "bg-primary",
  },
  {
    label: t("label.mem"),
    percent: totals.value.memoryPercent,
    text: formatBytes(totals.value.memoryUsage, { decimals: 1, short: true }),
    class: "bg-secondary",
  },
]);
</script>

<style scoped>
@reference "@/main.css";

/* Tonal, not outlined. A page of hairline-bordered boxes is a page of cages;
   a tint separates the tile from the page just as well and leaves the borders
   available for the one place that needs a hard edge. */
.tile {
  @apply bg-base-content/4;
  transition:
    background-color 180ms ease,
    transform 120ms cubic-bezier(0.32, 0.72, 0, 1);
}

.tile:hover {
  @apply bg-base-content/8;
}

/* Feedback on the press, not on the navigation that follows it — on a slow
   route that gap is long enough to wonder whether the tap registered. */
.tile:active {
  @apply bg-base-content/12;
  transform: scale(0.985);
}

.chevron {
  transition:
    transform 180ms cubic-bezier(0.32, 0.72, 0, 1),
    color 180ms ease;
}

.tile:hover .chevron {
  @apply text-base-content/45;
  transform: translateX(1.5px);
}

.fill {
  transition: width 500ms cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-contrast: more) {
  .tile {
    @apply border-base-content/40 border;
  }
}

/* Reduced motion drops the travel and keeps the state: colour still confirms
   the press, nothing slides. */
@media (prefers-reduced-motion: reduce) {
  .fill,
  .chevron {
    transition: none;
  }

  .tile {
    transition: background-color 180ms ease;
  }

  .tile:active,
  .tile:hover .chevron {
    transform: none;
  }
}
</style>
