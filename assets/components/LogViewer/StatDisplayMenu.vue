<template>
  <!-- The stat-display choices, shared by the single-container and merged log
       toolbars so the two menus can't drift apart. Renders bare <li> rows so it
       drops straight into a daisyUI .menu. -->
  <li>
    <details>
      <summary>
        <mdi:chart-bar class="w-4" />
        {{ $t("toolbar.stat-display") }}
      </summary>
      <ul class="menu">
        <li class="menu-title px-2 py-1 text-[0.7rem]">{{ $t("label.cpu-memory") }}</li>
        <li v-for="option in resourceOptions" :key="option.value">
          <a @click="setResourceMode(option.value)">
            <mdi:check class="w-4" v-if="resourceStatMode === option.value" />
            <div v-else class="w-4"></div>
            {{ $t(option.label) }}
          </a>
        </li>
        <li class="menu-title px-2 py-1 text-[0.7rem]">{{ $t("label.network-disk") }}</li>
        <li v-for="option in ioOptions" :key="option.value">
          <a @click="setIoMode(option.value)">
            <mdi:check class="w-4" v-if="ioStatMode === option.value" />
            <div v-else class="w-4"></div>
            {{ $t(option.label) }}
          </a>
        </li>
        <li class="menu-title px-2 py-1 text-[0.7rem]">{{ $t("toolbar.trend-shape") }}</li>
        <li v-for="option in shapeOptions" :key="option.value">
          <a @click="setTrendShape(option.value)">
            <mdi:check class="w-4" v-if="trendShape === option.value" />
            <div v-else class="w-4"></div>
            {{ $t(option.label) }}
          </a>
        </li>
      </ul>
    </details>
  </li>
</template>

<script lang="ts" setup>
import type { Settings } from "@/stores/settings";

const resourceOptions: { value: Settings["resourceStatMode"]; label: string }[] = [
  { value: "summary", label: "toolbar.stat-summary" },
  { value: "chart", label: "toolbar.stat-chart" },
];

const ioOptions: { value: Settings["ioStatMode"]; label: string }[] = [
  { value: "summary", label: "toolbar.stat-summary" },
  { value: "current", label: "toolbar.stat-current" },
  { value: "chart", label: "toolbar.stat-chart" },
];

const shapeOptions: { value: Settings["trendShape"]; label: string }[] = [
  { value: "bars", label: "toolbar.shape-bars" },
  { value: "line", label: "toolbar.shape-line" },
  { value: "area", label: "toolbar.shape-area" },
];

// Assigned here rather than inline in the template: auto-imported refs are read
// through an unref wrapper, which is not an assignment target.
const setResourceMode = (value: Settings["resourceStatMode"]) => (resourceStatMode.value = value);
const setIoMode = (value: Settings["ioStatMode"]) => (ioStatMode.value = value);
const setTrendShape = (value: Settings["trendShape"]) => (trendShape.value = value);
</script>
