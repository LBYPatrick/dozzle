<template>
  <!-- The app's text field. Everything a bare `<input class="input">` was
       missing: a leading affordance that lights up with focus, a clear button
       that grows in as soon as there is something to clear, and hover / focus /
       invalid states that transition rather than snap. The resting, hover and
       focus surfaces themselves are the shared `.input` rules in main.css, so
       this stays consistent with any field that can't use the component. -->
  <div
    class="input group/field flex w-full items-center gap-2"
    :class="[{ 'input-error': invalid, 'pointer-events-none opacity-55': disabled }, sizeClass]"
  >
    <span v-if="$slots.leading" class="leading text-base-content/55 flex shrink-0 items-center">
      <slot name="leading" />
    </span>

    <input
      ref="input"
      v-bind="$attrs"
      :type
      :value="model"
      :disabled
      :placeholder
      :required
      :readonly
      :name
      :autocomplete
      :maxlength
      class="min-w-0 flex-1 bg-transparent outline-none"
      @input="onInput"
    />

    <transition name="clear">
      <button
        v-if="clearable && hasValue && !disabled"
        type="button"
        class="clear text-base-content/40 hover:text-base-content flex shrink-0 items-center transition-colors"
        :title="$t('button.clear-input')"
        :aria-label="$t('button.clear-input')"
        @click="clear"
      >
        <mdi:close-circle class="size-4" />
      </button>
    </transition>

    <span v-if="$slots.trailing" class="flex shrink-0 items-center">
      <slot name="trailing" />
    </span>
  </div>
</template>

<script lang="ts" setup>
// Attributes land on the inner <input>, not on the field wrapper. The native
// ones the app actually passes are declared rather than left to $attrs, so the
// call sites type-check; anything else still falls through via v-bind="$attrs".
defineOptions({ inheritAttrs: false });

const {
  type = "text",
  fieldSize = "md",
  clearable = true,
  invalid = false,
  disabled = false,
} = defineProps<{
  type?: string;
  /** Named fieldSize, not size: a prop literally called `size` collides with
   *  Vue's built-in attribute typing and collapses the props type to never. */
  fieldSize?: "sm" | "md" | "lg";
  /** Show the inline clear button once the field has content. */
  clearable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  name?: string;
  autocomplete?: string;
  maxlength?: number;
}>();

const model = defineModel<string | number>();

const input = useTemplateRef<HTMLInputElement>("input");

const sizeClass = computed(() => ({ sm: "input-sm", md: "", lg: "input-lg" })[fieldSize]);

// Uncontrolled fields (a plain form post, no v-model) still get the clear
// button, so track the element's own value as well as the model.
const rawValue = ref("");
const hasValue = computed(() => String(model.value ?? rawValue.value).length > 0);

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  rawValue.value = value;
  model.value = type === "number" && value !== "" ? Number(value) : value;
}

function clear() {
  rawValue.value = "";
  model.value = type === "number" ? undefined : "";
  if (input.value) {
    input.value.value = "";
    // Uncontrolled consumers listen for input/change, not for the model.
    input.value.dispatchEvent(new Event("input", { bubbles: true }));
    input.value.focus();
  }
}

defineExpose({ focus: () => input.value?.focus(), input });
</script>

<style scoped>
/* The leading glyph is the field's focus indicator: it picks up the accent as
   soon as the caret lands, which is a quieter signal than recolouring the whole
   frame and reads at a glance in a stack of fields. */
.leading {
  transition: color 0.18s ease;
}

.group\/field:focus-within .leading {
  color: var(--color-primary);
}

.clear-enter-active,
.clear-leave-active {
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.clear-enter-from,
.clear-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

@media (prefers-reduced-motion: reduce) {
  .clear-enter-active,
  .clear-leave-active {
    transition: opacity 100ms ease;
  }
}
</style>
