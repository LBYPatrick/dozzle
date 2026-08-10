<template>
  <!-- Opened by press, on the shared material — it was a focus-opened panel on
       an opaque `bg-base-200`, and the chip was a sixth hand-rolled small label. -->
  <div
    v-if="worst"
    class="dropdown dropdown-end"
    :class="[{ 'dropdown-bottom': !openUp }, { 'dropdown-open': open }]"
    ref="root"
  >
    <button
      type="button"
      ref="trigger"
      class="status-pill tabular-nums"
      :class="badgeClass"
      aria-haspopup="menu"
      :aria-expanded="open"
      :title="title"
      :aria-label="title"
      @click="toggle"
    >
      <PhWarning class="size-3.5" />
      <span class="max-md:hidden">{{ worst.destination }}</span>
      <span>{{ formatPct(worst.pct) }}</span>
    </button>
    <div
      v-if="open"
      class="dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 mt-1 w-72 origin-top-right rounded-[var(--control-radius)] p-2 text-xs"
    >
      <div class="text-base-content/60 mb-1.5 px-1 text-[0.6875rem] tracking-wide uppercase">
        {{ t("tooltip.volumes") }}
      </div>
      <ul class="space-y-1.5">
        <li
          v-for="m in sortedMounts"
          :key="m.destination"
          class="flex flex-col gap-1 rounded p-1.5"
          :class="rowClass(m.pct, m.available)"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="truncate font-mono text-[0.72rem]" :title="m.destination">{{ m.destination }}</span>
            <span v-if="m.available" class="tabular-nums">{{ formatPct(m.pct) }}</span>
            <span v-else class="text-base-content/50">n/a</span>
          </div>
          <div v-if="m.available" class="bg-base-content/10 h-1 w-full overflow-hidden rounded">
            <div class="h-full" :class="barClass(m.pct)" :style="{ width: Math.min(100, m.pct * 100) + '%' }"></div>
          </div>
          <div class="text-base-content/60 flex justify-between tabular-nums">
            <span v-if="m.available">{{ formatBytes(m.used) }} / {{ formatBytes(m.total) }}</span>
            <span v-else>{{ t("tooltip.volume-unreachable") }}</span>
            <RelativeTime v-if="m.lastChecked" :date="m.lastChecked" class="text-[0.656rem]" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";
import PhWarning from "~icons/ph/warning-fill";

const WARN = 0.85;
const CRITICAL = 0.95;

const { container } = defineProps<{ container: Container; openUp?: boolean }>();

const { t } = useI18n();

interface DerivedMount {
  destination: string;
  total: number;
  used: number;
  free: number;
  available: boolean;
  pct: number;
  lastChecked?: Date;
}

const mounts = computed<DerivedMount[]>(() => {
  const raw = container.mountStats ?? {};
  return Object.values(raw).map((m) => ({
    destination: m.destination,
    total: m.total,
    used: m.used,
    free: m.free,
    available: m.available && m.total > 0,
    pct: m.available && m.total > 0 ? m.used / m.total : 0,
    lastChecked: m.lastChecked ? new Date(m.lastChecked) : undefined,
  }));
});

const sortedMounts = computed(() => [...mounts.value].sort((a, b) => b.pct - a.pct));

const worst = computed(() => {
  const candidate = sortedMounts.value.find((m) => m.available && m.pct >= WARN);
  return candidate ?? null;
});

const badgeClass = computed(() => {
  if (!worst.value) return "";
  return worst.value.pct >= CRITICAL ? "status-pill-error" : "status-pill-warning";
});

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle } = useDropdownMenu(root, trigger);

function rowClass(pct: number, available: boolean) {
  if (!available) return "bg-base-content/[0.04]";
  if (pct >= CRITICAL) return "bg-error/10";
  if (pct >= WARN) return "bg-warning/10";
  return "bg-base-content/[0.04]";
}

function barClass(pct: number) {
  if (pct >= CRITICAL) return "bg-error";
  if (pct >= WARN) return "bg-warning";
  return "bg-success";
}

function formatPct(pct: number) {
  return `${Math.round(pct * 100)}%`;
}

const title = computed(() => {
  if (!worst.value) return "";
  return t("tooltip.volume-full", { destination: worst.value.destination, pct: formatPct(worst.value.pct) });
});
</script>
