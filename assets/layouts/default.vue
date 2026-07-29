<template>
  <div>
    <MobileMenu v-if="isMobile && !forceMenuHidden" @search="showFuzzySearch"></MobileMenu>
    <Splitpanes @resized="onResized($event)" :class="{ 'nav-collapsed': collapseNav }">
      <Pane
        :min-size="collapseNav ? 0 : MIN_MENU_WIDTH"
        :size="collapseNav ? 0 : menuWidth"
        v-if="!isMobile && !forceMenuHidden"
      >
        <SidePanel v-show="!collapseNav" />
      </Pane>
      <Pane :min-size="MIN_MENU_WIDTH" :size="collapseNav ? 100 : 100 - menuWidth">
        <Splitpanes>
          <Pane class="router-view min-h-screen">
            <router-view></router-view>
          </Pane>
          <template v-if="!isMobile">
            <Pane v-for="other in pinnedLogs" :key="other.id">
              <ContainerLog
                :id="other.id"
                show-title
                scrollable
                closable
                @close="pinnedLogsStore.unPinContainer(other)"
              />
            </Pane>
          </template>
        </Splitpanes>
      </Pane>
    </Splitpanes>
    <label
      class="group border-base-content/20 bg-base-100 hover:border-primary fixed bottom-16 -left-px z-20 flex h-10 cursor-pointer items-center rounded-l-none rounded-r-lg border px-2.5 shadow-sm transition-colors duration-300 select-none"
      v-if="!isMobile && !forceMenuHidden"
      :title="collapseNav ? $t('button.show-sidebar') : $t('button.hide-sidebar')"
    >
      <input type="checkbox" v-model="collapseNav" class="hidden" />
      <mdi:chevron-left
        class="size-5 shrink-0 transition-transform duration-300"
        :class="{ 'rotate-180': collapseNav }"
      />
      <span
        class="flex max-w-0 items-center gap-2 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-300 group-hover:ml-2 group-hover:max-w-60"
      >
        {{ collapseNav ? $t("button.show-sidebar") : $t("button.hide-sidebar") }}
        <KeyShortcut char="s" :modifiers="['meta', '^']" />
      </span>
    </label>
  </div>
  <!-- Dim only, no screen-wide blur: glass is reserved for the container card
       (FuzzySearchModal) itself. -->
  <dialog ref="modal" class="modal modal-scrim items-start transition-none!" @close="closeSearch">
    <div class="modal-box max-w-2xl overflow-visible! bg-transparent pt-20 shadow-none">
      <FuzzySearchModal @close="closeSearch" v-if="open" />
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
  <!-- Dim, never a screen-wide blur — the panel's own glass refracts the
       already-dimmed page behind it. -->
  <dialog ref="settingsDialog" class="modal modal-scrim items-start" @close="closeSettings">
    <div class="modal-box max-h-[95vh] max-w-3xl overflow-visible! bg-transparent p-0 pt-[5vh] shadow-none">
      <SettingsModal v-if="settingsOpen" />
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
  <SideDrawer ref="drawer" :width="drawerWidth" v-slot="{ close }">
    <Suspense :timeout="0">
      <component :is="drawerComponent" v-bind="drawerProperties" :close="close" />
      <template #fallback> <span class="loading loading-spinner loading-sm"></span></template>
    </Suspense>
  </SideDrawer>
  <ToastModal />
  <WelcomeModal ref="welcomeModal" />
</template>

<script lang="ts" setup>
import { Splitpanes, Pane } from "splitpanes";
import { collapseNav, MIN_MENU_WIDTH } from "@/stores/settings";
import SideDrawer from "@/components/common/SideDrawer.vue";

const pinnedLogsStore = usePinnedLogsStore();
const { pinnedLogs } = storeToRefs(pinnedLogsStore);

const drawer = useTemplateRef<InstanceType<typeof SideDrawer>>("drawer") as Ref<InstanceType<typeof SideDrawer>>;
const { component: drawerComponent, properties: drawerProperties, width: drawerWidth } = createDrawer(drawer);

import { useFuzzySearch } from "@/composable/fuzzySearch";

const modal = ref<HTMLDialogElement>();
const { open, openSearch: showFuzzySearch, closeSearch } = useFuzzySearch();
const searchParams = new URLSearchParams(window.location.search);
const forceMenuHidden = ref(searchParams.has("hideMenu"));

import { useSettingsModal } from "@/composable/settingsModal";
const settingsDialog = ref<HTMLDialogElement>();
const { open: settingsOpen, closeSettings } = useSettingsModal();

watch(open, () => {
  if (open.value) {
    modal.value?.showModal();
  } else {
    modal.value?.close();
  }
});

watch(settingsOpen, () => {
  if (settingsOpen.value) {
    settingsDialog.value?.showModal();
  } else {
    settingsDialog.value?.close();
  }
});

onKeyStroke("k", (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
    showFuzzySearch();
    e.preventDefault();
  }
});

onKeyStroke(["s", "S"], (e) => {
  if (e.metaKey && e.ctrlKey && !isMobile.value && !forceMenuHidden.value) {
    collapseNav.value = !collapseNav.value;
    e.preventDefault();
  }
});

function onResized({ panes }: { panes: { size: number }[] }) {
  // Ignore the resize that collapsing/expanding triggers; only persist drags.
  if (collapseNav.value) return;
  if (panes.length == 2) {
    menuWidth.value = Math.min(panes[0].size, 50);
  }
}

// Cloud OAuth linking redirects back here with #cloudLinked. Refresh the
// now-linked config and show the welcome modal once. Moved off CloudPopover,
// which was removed from the top bar.
import { useCloudConfig } from "@/composable/cloudConfig";
const { fetchCloudConfig } = useCloudConfig();
const welcomeModal = ref<{ open: () => void }>();
const cloudWelcomeShown = useProfileStorage("cloudWelcomeShown", false);
onMounted(async () => {
  if (window.location.hash !== "#cloudLinked") return;
  await fetchCloudConfig();
  if (!cloudWelcomeShown.value) {
    cloudWelcomeShown.value = true;
    nextTick(() => welcomeModal.value?.open());
  }
  history.replaceState(history.state, "", window.location.pathname + window.location.search);
});
</script>

<style scoped>
@reference "@/main.css";

/* Resize handles, for both the sidebar and the pinned log columns.
 *
 * iPad-style: a hairline divider carrying a capsule grabber. The grabber is
 * present at rest — a control you cannot see is a control nobody finds — and
 * thickens and darkens on approach rather than the whole column changing
 * colour.
 *
 * The splitter occupies exactly the hairline it paints. A comfortable target
 * still needs ~11px, but reserving that in the layout pushes the panes apart
 * and leaves an empty channel between them, which is what a separator is
 * supposed to avoid. So the target overflows symmetrically into both panes
 * (::before) instead of taking width of its own. */
:deep(.splitpanes--vertical > .splitpanes__splitter) {
  position: relative;
  width: 1px;
  flex-shrink: 0;
  /* Above the panes' own floating chrome (the log top bar is z-20), or that bar
     would take the pointer along its rows and the handle would only be grabbable
     below it. The target is narrow enough to stay inside each pane's padding, so
     it covers no controls. */
  z-index: 25;
  background-color: color-mix(in oklab, var(--color-base-content) 12%, transparent);
  transition:
    background-color 200ms ease,
    opacity 0.3s cubic-bezier(0.2, 0, 0, 1);
}

/* The drag target: invisible, centred on the hairline, overflowing both panes. */
:deep(.splitpanes--vertical > .splitpanes__splitter)::before {
  content: "";
  position: absolute;
  inset-block: 0;
  left: 50%;
  width: 11px;
  transform: translateX(-50%);
}

/* The grabber. Always visible; grows and gains contrast on approach. */
:deep(.splitpanes--vertical > .splitpanes__splitter)::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 44px;
  border-radius: 999px;
  /* Mixed into the surface rather than toward transparent: a translucent
     grabber lets the divider line show straight through it. */
  background-color: color-mix(in oklab, var(--color-base-content) 26%, var(--color-base-100));
  box-shadow: 0 1px 2px rgb(var(--shadow-ink) / 0.18);
  transform: translate(-50%, -50%);
  transition:
    transform 220ms cubic-bezier(0.32, 0.72, 0, 1),
    background-color 180ms ease,
    box-shadow 180ms ease;
}

:deep(.splitpanes--vertical > .splitpanes__splitter:hover),
:deep(.splitpanes--vertical > .splitpanes__splitter:focus-visible) {
  background-color: color-mix(in oklab, var(--color-base-content) 22%, transparent);
}

:deep(.splitpanes--vertical > .splitpanes__splitter:hover)::after,
:deep(.splitpanes--vertical > .splitpanes__splitter:focus-visible)::after {
  background-color: color-mix(in oklab, var(--color-base-content) 48%, var(--color-base-100));
  transform: translate(-50%, -50%) scale(1.25, 1.12);
  box-shadow: 0 2px 5px rgb(var(--shadow-ink) / 0.26);
}

/* Pressed: the grabber takes the accent so the drag reads as engaged. */
:deep(.splitpanes--vertical > .splitpanes__splitter:active)::after {
  background-color: var(--color-primary);
  transform: translate(-50%, -50%) scale(1.25, 1.12);
}

:deep(.splitpanes--vertical > .splitpanes__splitter:focus-visible) {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  :deep(.splitpanes--vertical > .splitpanes__splitter)::after {
    transition: background-color 120ms ease;
  }
  :deep(.splitpanes--vertical > .splitpanes__splitter:hover)::after,
  :deep(.splitpanes--vertical > .splitpanes__splitter:active)::after {
    transform: translate(-50%, -50%);
  }
}

/* Hide (and disable) the resize handle while the sidebar is collapsed. */
:deep(.splitpanes.nav-collapsed > .splitpanes__splitter) {
  opacity: 0;
  pointer-events: none;
}

@media screen and (max-width: 768px) {
  .router-view {
    padding-top: var(--mobile-nav-height);
  }
}
</style>
