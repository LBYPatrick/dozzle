<template>
  <!-- iOS-style segmented control: a recessed track with a raised, theme-tinted
       selected segment. Single-select (radio semantics). -->
  <div class="bg-base-300/70 inline-flex rounded-lg p-0.5" role="radiogroup">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      :aria-checked="model === opt.value"
      class="focus-visible:ring-primary/60 rounded-md px-3 py-1 text-sm whitespace-nowrap transition-all duration-150 focus:outline-none focus-visible:ring-2"
      :class="
        model === opt.value
          ? 'bg-base-100 text-base-content font-medium shadow-sm'
          : 'text-base-content/60 hover:text-base-content'
      "
      @click="select(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script lang="ts" setup generic="T">
const model = defineModel<T>();

defineProps<{ options: { label: string; value: T }[] }>();

const select = (value: T) => {
  model.value = value;
};
</script>
