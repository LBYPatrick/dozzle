<template>
  <!-- Inner card for the settings popup. Presented inside the shared dialog
       overlay (see default.vue). Glass is intentional: this is a container
       background, the one place blur is allowed. -->
  <div class="glass-surface glass-surface-thick flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl">
    <!-- Header. The rule under it is a scroll edge, not a decoration: it draws
         itself only once there is content passing beneath, so a short panel is
         one uninterrupted surface. The border is always in the box model and
         only changes colour, so nothing shifts when it appears. -->
    <div
      class="flex flex-wrap items-center gap-2 border-b px-4 py-3 transition-colors duration-200"
      :class="headerDivided ? 'border-base-content/10' : 'border-transparent'"
    >
      <!-- Secondary screen: back to the main list -->
      <template v-if="subview">
        <button class="btn btn-ghost btn-sm -ml-1 gap-1 pl-1" @click="closeSubview">
          <mdi:chevron-left class="size-5" /> {{ $t("title.settings") }}
        </button>
        <h2 class="text-base font-semibold">{{ subviewTitle }}</h2>
        <form method="dialog" class="ml-auto">
          <button class="btn btn-ghost btn-sm btn-square" :aria-label="$t('button.cancel')">
            <mdi:close class="size-5" />
          </button>
        </form>
      </template>

      <!-- Main list -->
      <template v-else>
        <mdi:cog-outline class="text-base-content/60 size-5 shrink-0" />
        <h2 class="text-base font-semibold">{{ $t("title.settings") }}</h2>

        <SegmentedControl
          class="ml-2"
          v-model="view"
          :options="[
            { label: $t('settings.view-visual'), value: 'visual' },
            { label: $t('settings.view-json'), value: 'json' },
          ]"
        />

        <div class="ml-auto flex items-center gap-1">
          <button class="btn btn-ghost btn-sm gap-1" @click="exportToClipboard">
            <mdi:content-copy class="size-4" /> <span class="max-sm:hidden">{{ $t("settings.export") }}</span>
          </button>
          <form method="dialog">
            <button class="btn btn-ghost btn-sm btn-square" :aria-label="$t('button.cancel')">
              <mdi:close class="size-5" />
            </button>
          </form>
        </div>
      </template>
    </div>

    <!-- Body -->
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div ref="visualScroll" v-show="view === 'visual'" class="h-full overflow-y-auto p-4 md:p-6">
        <SettingsPanels />
      </div>

      <div v-show="view === 'json'" class="flex h-full flex-col">
        <div class="bg-base-100/40 min-h-0 flex-1 overflow-hidden">
          <JsonEditor v-model="jsonText" />
        </div>
        <div class="border-base-content/10 flex items-center gap-2 border-t px-4 py-2 text-xs">
          <span v-if="jsonError" class="text-error flex items-center gap-1">
            <mdi:alert-circle-outline class="size-3.5" /> {{ jsonError }}
          </span>
          <span v-else class="text-success flex items-center gap-1">
            <mdi:check-circle-outline class="size-3.5" /> {{ $t("settings.json-valid") }}
          </span>
          <button class="btn btn-primary btn-xs ml-auto" :disabled="!!jsonError" @click="applyJson">
            {{ $t("settings.apply") }}
          </button>
        </div>
      </div>

      <!-- Secondary screen slides in over the main list -->
      <transition name="subview">
        <div
          v-if="subview"
          class="bg-base-200/85 absolute inset-0 overflow-y-auto p-4 backdrop-blur-2xl backdrop-saturate-150 md:p-6"
        >
          <WhatsNewPanel v-if="subview === 'whats-new'" />
          <NotificationsPanel v-else-if="subview === 'notifications'" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import SettingsPanels from "@/components/Settings/SettingsPanels.vue";
import WhatsNewPanel from "@/components/Settings/WhatsNewPanel.vue";
import NotificationsPanel from "@/components/Notification/NotificationsPanel.vue";
import JsonEditor from "@/components/common/JsonEditor.vue";
import { useSettingsModal } from "@/composable/settingsModal";
import { serializeSettings, importSettingsJson } from "@/stores/settings";

const { t } = useI18n();
const { view, section, subview, closeSubview } = useSettingsModal();

const subviewTitle = computed(() => {
  switch (subview.value) {
    case "whats-new":
      return t("settings.whats-new");
    case "notifications":
      return t("notifications.title");
    default:
      return "";
  }
});
const { copy, isSupported } = useClipboard({ legacy: true });
const { showToast } = useToast();

// The modal is v-if-mounted fresh on each open, so scroll the requested section
// (e.g. a "cloud settings" deep link) into view once the panels have rendered.
const visualScroll = useTemplateRef<HTMLElement>("visualScroll");
onMounted(async () => {
  if (!section.value) return;
  await nextTick();
  visualScroll.value?.querySelector(`#settings-${section.value}`)?.scrollIntoView({ block: "start" });
});

const jsonText = ref(serializeSettings());

// Only the visual view scrolls under the header. The JSON editor is its own
// bounded surface butted right against it, and that seam is real regardless of
// scroll position.
const scrolled = ref(false);
useEventListener(visualScroll, "scroll", () => (scrolled.value = (visualScroll.value?.scrollTop ?? 0) > 0), {
  passive: true,
});
const headerDivided = computed(() => view.value !== "visual" || scrolled.value);

// Live JSON validity for the editor footer.
const jsonError = computed(() => {
  try {
    JSON.parse(jsonText.value);
    return "";
  } catch (e) {
    return (e as Error).message;
  }
});

// Refresh the JSON snapshot from the live settings whenever the JSON view is
// entered, so edits made in the visual form are reflected.
watch(view, (v) => {
  if (v === "json") jsonText.value = serializeSettings();
});

function applyJson() {
  const result = importSettingsJson(jsonText.value);
  if (result.ok) {
    toast("settings.applied", "info");
  } else {
    toast(result.error, "error", true);
  }
}

async function exportToClipboard() {
  const json = serializeSettings();
  if (!isSupported.value) {
    toast(json, "info", true);
    return;
  }
  await copy(json);
  toast("settings.exported", "info");
}

// Small helper so the toast calls stay terse. `raw` skips translation for
// dynamic error/JSON strings.
function toast(message: string, type: "info" | "error", raw = false) {
  showToast({ title: raw ? message : t(message), message: "", type }, { expire: type === "error" ? 5000 : 2000 });
}
</script>

<style scoped>
/* iOS-style push: the secondary screen slides in from the right. */
.subview-enter-active,
.subview-leave-active {
  transition:
    transform 260ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms ease;
}
.subview-enter-from,
.subview-leave-to {
  transform: translateX(1.5rem);
  opacity: 0;
}

/* Reduced motion is not "no feedback": the drill-in still needs to read as a
   screen change, so both transitions keep their cross-fade and drop only the
   travel — the sideways push and the height sweep. */
@media (prefers-reduced-motion: reduce) {
  .subview-enter-active,
  .subview-leave-active {
    transition: opacity 160ms ease;
  }

  .subview-enter-from,
  .subview-leave-to {
    transform: none;
  }
}
</style>
