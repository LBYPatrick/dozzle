<template>
  <!-- Inner card for the settings popup. Presented inside the shared dialog
       overlay (see default.vue). Glass is intentional: this is a container
       background, the one place blur is allowed. -->
  <div
    class="bg-base-200/95 border-base-content/15 flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl"
  >
    <!-- Header -->
    <div class="border-base-content/10 flex flex-wrap items-center gap-2 border-b px-4 py-3">
      <mdi:cog-outline class="text-base-content/60 size-5 shrink-0" />
      <h2 class="text-base font-semibold">{{ $t("title.settings") }}</h2>

      <div class="join ml-2">
        <button
          class="btn btn-xs join-item gap-1"
          :class="view === 'visual' ? 'btn-primary' : 'btn-ghost'"
          @click="view = 'visual'"
        >
          <mdi:tune-variant class="size-3.5" /> {{ $t("settings.view-visual") }}
        </button>
        <button
          class="btn btn-xs join-item gap-1"
          :class="view === 'json' ? 'btn-primary' : 'btn-ghost'"
          @click="view = 'json'"
        >
          <mdi:code-json class="size-3.5" /> {{ $t("settings.view-json") }}
        </button>
      </div>

      <div class="ml-auto flex items-center gap-1">
        <button class="btn btn-ghost btn-sm gap-1" @click="exportToClipboard">
          <mdi:content-copy class="size-4" /> <span class="max-sm:hidden">{{ $t("settings.export") }}</span>
        </button>
        <button
          class="btn btn-ghost btn-sm gap-1"
          :class="{ 'text-primary': showImport }"
          @click="showImport = !showImport"
        >
          <mdi:import class="size-4" /> <span class="max-sm:hidden">{{ $t("settings.import") }}</span>
        </button>
        <form method="dialog">
          <button class="btn btn-ghost btn-sm btn-square" :aria-label="$t('button.cancel')">
            <mdi:close class="size-5" />
          </button>
        </form>
      </div>
    </div>

    <!-- Import panel -->
    <transition name="import-panel">
      <div v-if="showImport" class="border-base-content/10 bg-base-300/40 border-b p-3">
        <label class="text-base-content/60 text-xs">{{ $t("settings.import-hint") }}</label>
        <textarea
          v-model="importText"
          class="textarea textarea-sm bg-base-100/70 mt-1.5 h-24 w-full resize-none font-mono text-xs"
          :placeholder="$t('settings.import-placeholder')"
        ></textarea>
        <div class="mt-2 flex items-center gap-2">
          <button class="btn btn-primary btn-sm" :disabled="!importText.trim() || importing" @click="doImport">
            <span v-if="importing" class="loading loading-spinner loading-xs"></span>
            {{ $t("settings.import") }}
          </button>
          <span v-if="importError" class="text-error text-xs">{{ importError }}</span>
        </div>
      </div>
    </transition>

    <!-- Body -->
    <div class="min-h-0 flex-1 overflow-hidden">
      <div v-show="view === 'visual'" class="h-full overflow-y-auto p-4 md:p-6">
        <SettingsPanels compact-about />
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import SettingsPanels from "@/components/Settings/SettingsPanels.vue";
import JsonEditor from "@/components/common/JsonEditor.vue";
import { useSettingsModal } from "@/composable/settingsModal";
import { serializeSettings, importSettingsJson } from "@/stores/settings";

const { t } = useI18n();
const { view } = useSettingsModal();
const { copy, isSupported } = useClipboard({ legacy: true });
const { showToast } = useToast();

const jsonText = ref(serializeSettings());
const showImport = ref(false);
const importText = ref("");
const importError = ref("");
const importing = ref(false);

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

async function doImport() {
  importError.value = "";
  const raw = importText.value.trim();
  importing.value = true;
  try {
    let json = raw;
    if (/^https?:\/\//i.test(raw)) {
      const response = await fetch(raw, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      json = await response.text();
    }
    const result = importSettingsJson(json);
    if (!result.ok) {
      importError.value = result.error;
      return;
    }
    jsonText.value = serializeSettings();
    showImport.value = false;
    importText.value = "";
    toast("settings.imported", "info");
  } catch (e) {
    importError.value = (e as Error).message;
  } finally {
    importing.value = false;
  }
}

// Small helper so the toast calls stay terse. `raw` skips translation for
// dynamic error/JSON strings.
function toast(message: string, type: "info" | "error", raw = false) {
  showToast({ title: raw ? message : t(message), message: "", type }, { expire: type === "error" ? 5000 : 2000 });
}
</script>

<style scoped>
.import-panel-enter-active,
.import-panel-leave-active {
  transition:
    max-height 200ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 160ms ease;
  overflow: hidden;
  max-height: 12rem;
}
.import-panel-enter-from,
.import-panel-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
