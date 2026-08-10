<template>
  <!-- Which machines the fleet view queries. Multi-select, so the panel stays
       open as you tick hosts off — closing after each one would make choosing
       three of five a three-trip job. -->
  <DropdownMenu :options="[]" class="btn-xs md:btn-sm">
    <template #trigger>
      <ph:hard-drives class="size-3.5 shrink-0 opacity-60" />
      <span class="truncate">{{ label }}</span>
      <carbon:caret-down class="dropdown-caret text-base-content/50 size-3" />
    </template>

    <li v-for="host in hosts" :key="host.id">
      <button
        type="button"
        role="menuitem"
        class="flex items-center gap-2 rounded-lg"
        :class="{ 'font-medium': isSelected(host.id) }"
        @click.stop="toggle(host.id)"
      >
        <mdi:check class="text-primary-safe size-4 shrink-0" v-if="isSelected(host.id)" />
        <div v-else class="size-4 shrink-0"></div>
        <HostIcon :type="host.type" class="size-3.5 shrink-0 opacity-60" />
        <span class="min-w-0 flex-1 truncate">{{ host.name }}</span>
        <span class="text-base-content/40 shrink-0 text-xs tabular-nums">{{ counts[host.id] ?? 0 }}</span>
      </button>
    </li>

    <!-- Only offered when it would change something: a reset that is already the
         current state is a button that does nothing. -->
    <li v-if="model.length > 0" class="border-base-content/10 mt-1 border-t pt-1">
      <button type="button" role="menuitem" class="flex items-center gap-2 rounded-lg" @click.stop="model = []">
        <mdi:restore class="size-4 shrink-0" />
        <span>{{ $t("label.all-hosts") }}</span>
      </button>
    </li>
  </DropdownMenu>
</template>

<script lang="ts" setup>
import type { Host } from "@/stores/hosts";
import type { Container } from "@/models/Container";

// Empty means every host — the same thing the server treats as "no filter", so
// there is no second way to express "all".
const model = defineModel<string[]>({ required: true });

const { containers } = defineProps<{ containers: Container[] }>();

const { hosts: hostMap } = useHosts();
const { t } = useI18n();

const hosts = computed(() => Object.values(hostMap.value) as Host[]);

// Running containers per host, so the list says what picking one would get you.
const counts = computed(() =>
  containers.reduce<Record<string, number>>((acc, c) => {
    acc[c.host] = (acc[c.host] ?? 0) + 1;
    return acc;
  }, {}),
);

const isSelected = (id: string) => model.value.includes(id);

const toggle = (id: string) => {
  model.value = isSelected(id) ? model.value.filter((h) => h !== id) : [...model.value, id];
};

// Names once it is short enough to read, a count after that.
const label = computed(() => {
  if (model.value.length === 0) return t("label.all-hosts");
  if (model.value.length <= 2) {
    return model.value.map((id) => hostMap.value[id]?.name ?? id).join(", ");
  }
  return t("label.hosts-selected", { count: model.value.length });
});
</script>
