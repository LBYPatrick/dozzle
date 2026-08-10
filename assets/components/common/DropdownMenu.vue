<template>
  <!-- The app's one pull-down.
       There were five, and they agreed on nothing: this one, `Dropdown.vue`
       (opened on focus), `ContainerDropdown` (focus), and the two log toolbars
       (hover). Five materials, three opening mechanisms, and only one of them
       animated. §16 Familiarity: things that look the same must behave the same.

       So: press to open, Escape or an outside press to close, one glass
       material, one radius, and enter *and* exit along the same path. -->
  <div class="dropdown" :class="[alignClass, { 'dropdown-open': open }]" ref="root">
    <button
      type="button"
      ref="trigger"
      class="btn btn-sm flex-nowrap gap-1.5 font-medium"
      aria-haspopup="menu"
      :aria-expanded="open"
      v-bind="$attrs"
      @click="toggle"
    >
      <slot name="trigger">
        <span class="truncate">{{ label }}</span>
        <carbon:caret-down class="dropdown-caret text-base-content/50 size-3" />
      </slot>
    </button>
    <transition name="menu-pop">
      <ul
        v-if="open"
        role="menu"
        class="menu dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 mt-2 max-h-72 w-52 flex-nowrap gap-0.5 overflow-auto rounded-[var(--control-radius)] p-1.5"
        :class="originClass"
        @click="onItemClick"
      >
        <slot>
          <li v-for="item in options" :key="String(item.value)">
            <button
              type="button"
              role="menuitemradio"
              :aria-checked="modelValue == item.value"
              class="flex items-center gap-2 rounded-[calc(var(--control-radius)-2px)]"
              :class="modelValue == item.value ? 'menu-active' : ''"
              @click="update(item.value as T)"
            >
              <mdi:check class="size-4 shrink-0" v-if="modelValue == item.value" />
              <div v-else class="size-4 shrink-0"></div>
              <span class="truncate">{{ item.label }}</span>
            </button>
          </li>
        </slot>
      </ul>
    </transition>
  </div>
</template>

<script lang="ts" setup generic="T">
type DropdownItem = {
  label: string;
  value: T;
};

const model = defineModel<T>();

const {
  options,
  defaultLabel = "",
  align = "end",
} = defineProps<{
  options: DropdownItem[];
  defaultLabel?: string;
  /** Which edge the panel hangs from. Drives `transform-origin` too, so the
      menu grows out of the corner it is anchored to rather than always from
      its own top-centre — §7, anchored origins. */
  align?: "start" | "end";
}>();

const label = computed(() => options.find((item) => item.value === model.value)?.label ?? defaultLabel);

const alignClass = computed(() => (align === "start" ? "dropdown-start" : "dropdown-end"));
const originClass = computed(() => (align === "start" ? "origin-top-left" : "origin-top-right"));

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, close, onItemClick } = useDropdownMenu(root, trigger);

const update = (value: T) => {
  model.value = value;
  close();
};
</script>

<style scoped>
.dropdown-caret {
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
}

.dropdown-open .dropdown-caret {
  transform: rotate(180deg);
}

/* Enter and exit along the same path. The panel used to animate in via a
   keyframe and then vanish instantly, because it was tied to `details[open]` —
   which has no exit. §7: if something disappears one way, we expect it to
   emerge from where it came.
   Materialising rather than fading: scale and blur move together so the panel
   reads as a piece of glass arriving. */
.menu-pop-enter-active {
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
    backdrop-filter 200ms ease;
}

.menu-pop-leave-active {
  transition:
    opacity 120ms ease,
    transform 160ms cubic-bezier(0.32, 0.72, 0, 1),
    backdrop-filter 160ms ease;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem) scale(0.96);
  backdrop-filter: blur(0) saturate(100%);
}

@media (prefers-reduced-motion: reduce) {
  .menu-pop-enter-active,
  .menu-pop-leave-active {
    transition: opacity 120ms ease;
  }

  .menu-pop-enter-from,
  .menu-pop-leave-to {
    transform: none;
    backdrop-filter: none;
  }

  .dropdown-caret {
    transition: none;
  }
}
</style>
