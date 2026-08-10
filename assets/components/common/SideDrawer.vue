<template>
  <!-- A scrim, at last.
       This was `backdrop:bg-none` on a `showModal()` dialog: it blocked the
       page — that is what a modal dialog does — and gave no visual sign that it
       had. Every other dialog in the layout uses `.modal-scrim`; this one opted
       out. §12: a modal task pairs the surface with a dimming veil.

       The veil lifts as you drag the panel away, so the dismissal is one
       continuous thing rather than a panel sliding over a stubbornly dark page. -->
  <dialog
    ref="panel"
    class="modal-right modal modal-scrim items-start outline-hidden"
    :style="{ '--scrim-progress': 1 - gesture.progress.value }"
  >
    <!-- The shared sheet material, applied here rather than via `@apply`:
         `.glass-surface` is a plain class (the reduced-transparency and
         increased-contrast queries key off it), and `@apply` only takes
         Tailwind utilities. -->
    <div
      class="modal-box glass-surface glass-surface-thick"
      :width="width"
      :class="{ 'is-dragging': gesture.dragging.value }"
      :style="{ transform: offsetTransform }"
      v-bind="gesture.handlers"
    >
      <div class="pt-safe relative flex h-full min-h-0 flex-col">
        <!-- Grabber. On touch this is the affordance for the swipe — a gesture
             nobody is told about is a gesture nobody uses — and it doubles as
             the visible edge of the panel. Hidden from pointer devices, which
             have the close button and Escape. -->
        <div class="drawer-grabber" aria-hidden="true"></div>

        <!-- The close control used to live here, positioned absolutely in the
             sheet's top-right corner — on top of whatever the panel happened to
             put there, and outside any panel's own layout. It belongs to the
             panel's title bar (see DrawerPanel), which is a real row that
             nothing else can collide with. -->
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
import { useDismissGesture } from "@/composable/dismissGesture";

const panel = useTemplateRef<HTMLDialogElement>("panel");

const open = ref(false);
const { width } = defineProps<{
  width: DrawerWidth;
}>();

function close() {
  panel.value?.close();
}

// Swipe right to dismiss — the direction the panel already leaves in, so the
// gesture and the animation agree (§7, symmetric paths).
const reduceMotion = usePreferredReducedMotion();
const gesture = useDismissGesture({
  axis: "x",
  direction: 1,
  onDismiss: close,
  // Measured from the panel itself rather than assumed: the drawer is `md` or
  // `lg`, and a guessed extent makes the projection wrong on one of them.
  extent: () => panel.value?.querySelector(".modal-box")?.clientWidth ?? 0,
  enabled: () => reduceMotion.value !== "reduce",
});

// While dragging, the panel is glued to the finger — no transition may sit
// between the two. At rest the class is dropped so the open/close animation
// applies again.
const offsetTransform = computed(() => (gesture.offset.value !== 0 ? `translateX(${gesture.offset.value}px)` : ""));

defineExpose({
  open: () => {
    open.value = true;
    gesture.reset();
    panel.value?.showModal();
  },
  close,
});

useEventListener(panel, "close", () => {
  open.value = false;
  gesture.reset();
});
</script>
<style scoped>
@reference "@/main.css";

.modal-right :where(.modal-box) {
  /* Geometry only — the material comes from `.glass-surface` in the template,
     which replaced a bare `bg-base-100`: this was the only sheet in the app
     that was not glass.
     `p-0`: the panel owns its own padding, so its title bar can run edge to
     edge without negative margins guessing at the sheet's inset. */
  @apply fixed right-0 h-lvh max-h-screen translate-x-24 scale-100 rounded-none border-y-0 border-r-0 p-0;
  touch-action: pan-y;

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

/* Nothing between the finger and the panel while it is being dragged. A
   transition here is exactly the lag §1 warns about, and it also fights the
   spring that settles the release. */
.modal-right .modal-box.is-dragging {
  transition: none !important;
}

/* The veil tracks the gesture: drag the panel half-way out and the page behind
   it is half-way back. */
.modal-scrim {
  background-color: rgb(var(--shadow-ink) / calc(var(--scrim-alpha) * var(--scrim-progress, 1)));
}

/* A grabber says "this can be pulled". Touch only — a mouse has the close
   button and Escape, and a handle it cannot use is furniture. */
.drawer-grabber {
  display: none;
}

@media (pointer: coarse) {
  .drawer-grabber {
    position: absolute;
    top: 50%;
    left: 0.375rem;
    display: block;
    width: 4px;
    height: 42px;
    border-radius: 999px;
    background-color: color-mix(in oklab, var(--color-base-content) 26%, transparent);
    transform: translateY(-50%);
  }
}
</style>
