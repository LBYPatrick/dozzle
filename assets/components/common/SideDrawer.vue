<template>
  <dialog ref="panel" class="modal-right modal items-start outline-hidden backdrop:bg-none">
    <div class="modal-box" :width="width">
      <div class="pt-safe relative">
        <!-- Dismiss control. A bare swap glyph read as decoration and gave no
             hit target; this is a real glass button matching every other
             control, with the Esc affordance spelled out on pointer devices and
             collapsing to a plain close on touch. -->
        <form method="dialog" class="absolute top-0 right-0 z-10">
          <button
            class="btn btn-sm group text-base-content/70 hover:text-base-content gap-1.5 px-2.5"
            :aria-label="$t('button.cancel')"
            :title="$t('button.cancel')"
          >
            <mdi:close class="size-4 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
            <kbd
              v-if="!isMobile"
              class="border-base-content/15 bg-base-content/5 rounded border px-1 font-sans text-[0.65rem] leading-4 tracking-wide"
            >
              esc
            </kbd>
          </button>
        </form>
        <slot v-if="open" :close="close"></slot>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>
<script setup lang="ts">
import { type DrawerWidth } from "@/composable/drawer";
const panel = useTemplateRef<HTMLDialogElement>("panel");

const open = ref(false);
const { width } = defineProps<{
  width: DrawerWidth;
}>();

function close() {
  panel.value?.close();
}

defineExpose({
  open: () => {
    open.value = true;
    panel.value?.showModal();
  },
  close,
});

useEventListener(panel, "close", () => (open.value = false));
</script>
<style scoped>
@reference "@/main.css";

.modal-right :where(.modal-box) {
  @apply bg-base-100 fixed right-0 h-lvh max-h-screen translate-x-24 scale-100 rounded-none shadow-none;

  &[width="md"] {
    @apply max-w-3xl;
  }

  &[width="lg"] {
    @apply max-w-5xl;
  }
}

.modal-right[open] .modal-box {
  @apply translate-x-0;
}
</style>
