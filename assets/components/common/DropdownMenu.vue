<template>
  <details class="dropdown dropdown-end" ref="details" v-on-click-outside="close">
    <summary
      class="btn btn-sm border-base-content/15 bg-base-100 hover:border-primary/50 flex-nowrap gap-1.5 rounded-lg font-medium shadow-none transition-colors"
      v-bind="$attrs"
    >
      <slot name="trigger">
        <span class="truncate">{{ label }}</span>
        <carbon:caret-down class="dropdown-caret text-base-content/50 size-3" />
      </slot>
    </summary>
    <ul
      class="menu dropdown-content border-base-content/15 bg-base-100/85 z-50 mt-2 max-h-72 w-52 flex-nowrap gap-0.5 overflow-auto rounded-2xl border p-1.5 shadow-xl backdrop-blur-xl backdrop-saturate-150"
    >
      <slot>
        <li v-for="item in options" :key="String(item.value)">
          <a
            class="flex items-center gap-2 rounded-lg"
            :class="modelValue == item.value ? 'bg-primary/12 text-primary-safe font-medium' : ''"
            @click="update(item.value as T)"
          >
            <mdi:check class="size-4 shrink-0" v-if="modelValue == item.value" />
            <div v-else class="size-4 shrink-0"></div>
            <span class="truncate">{{ item.label }}</span>
          </a>
        </li>
      </slot>
    </ul>
  </details>
</template>

<script lang="ts" setup generic="T">
import { vOnClickOutside } from "@vueuse/components";
type DropdownItem = {
  label: string;
  value: T;
};

const model = defineModel<T>();

const { options, defaultLabel = "" } = defineProps<{
  options: DropdownItem[];
  defaultLabel?: string;
}>();

const label = computed(() => options.find((item) => item.value === model.value)?.label ?? defaultLabel);
const details = ref<HTMLElement | null>(null);
const close = () => details.value?.removeAttribute("open");

const update = (value: T) => {
  model.value = value;
  close();
};
</script>

<style scoped>
/* Apple-style pull-down: the caret flips and the panel springs in on open. */
.dropdown-caret {
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}
details[open] > summary .dropdown-caret {
  transform: rotate(180deg);
}
details[open] > .dropdown-content {
  transform-origin: top;
  animation: dropdown-in 160ms cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-0.35rem) scale(0.97);
  }
}
</style>
