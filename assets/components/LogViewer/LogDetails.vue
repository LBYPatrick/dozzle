<template>
  <!-- Redesigned around what you actually came for.
       The old panel opened with a header, then a three-column grid of metadata
       under `font-thin` labels, then the raw JSON, then a fields table with a
       caption explaining that it could be dragged. So the *log line* — the one
       thing you clicked a log line to see — was the third block down, and the
       loudest thing on screen was a set of container names you already knew.
       §16 Simplicity: hierarchy should make the most important thing the most
       obvious.

       Message first, then the fields it is made of, then provenance last. -->
  <DrawerPanel :eyebrow="$t('drawer.log-entry')">
    <template #leading>
      <span v-if="entry.level" class="status-pill level-pill" :data-level="entry.level">{{ entry.level }}</span>
    </template>

    <template #title><DateTime :date="entry.date" /></template>
    <template #subtitle> <RelativeTime :date="entry.date" /> · {{ entry.std }} </template>

    <div class="flex flex-col gap-7">
      <!-- THE MESSAGE.
           One surface with a mode switch, rather than the old panel's two
           separate always-visible renderings of the same payload. Formatted is
           the default because a structured log is easier to read as a tree;
           raw is one press away for copying or eyeballing exactly what
           arrived. -->
      <section class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="type-section">{{ $t("drawer.message") }}</h2>
          <SegmentedControl
            dense
            class="ml-auto"
            v-model="view"
            :options="[
              { label: $t('drawer.formatted'), value: 'formatted' },
              { label: $t('drawer.raw'), value: 'raw' },
            ]"
          />
          <UseClipboard v-slot="{ copy, copied }" :source="entry.rawMessage">
            <button
              class="btn btn-sm btn-square hit-44 relative"
              @click="copy()"
              :title="$t('action.copy-log')"
              :aria-label="$t('action.copy-log')"
            >
              <mdi:check v-if="copied" class="text-success size-4" />
              <material-symbols:content-copy v-else class="size-4" />
            </button>
          </UseClipboard>
        </div>

        <!-- Tonal well, not a hairline box. The border it replaced was a
             hardcoded `border-white/20`, invisible on the light theme. -->
        <div class="bg-base-content/4 max-h-[42dvh] overflow-auto rounded-[var(--control-radius)] p-3">
          <JsonFormatted v-if="view === 'formatted'" :value="entry.rawMessage" class="text-sm" />
          <pre v-else class="font-mono text-sm break-all whitespace-pre-wrap">{{ pretty }}</pre>
        </div>
      </section>

      <!-- THE FIELDS.
           Was a `<table>` with a `<caption>` reading "Fields are sortable by
           dragging and dropping" — §16 again: if you need a label to explain a
           control, the mapping is weak. There is a grip on every row now, and
           the rows say what they do by looking draggable.

           The per-row switch became a checkmark. A switch is for a setting you
           are configuring; this is a selection within a list, and eleven
           switches stacked vertically read as a settings screen that wandered
           into an inspector. -->
      <section v-if="entry instanceof ComplexLogEntry" class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <h2 class="type-section">{{ $t("drawer.fields") }}</h2>
          <span class="section-count">{{ fields.length }}</span>
          <button type="button" class="btn btn-ghost btn-sm ml-auto" @click="toggleAllFields = !toggleAllFields">
            {{ toggleAllFields ? $t("drawer.hide-all") : $t("drawer.show-all") }}
          </button>
        </div>

        <ul ref="list" class="inset-group" style="--inset-separator: 2.75rem">
          <li
            v-for="{ key, value, enabled } in fields"
            :key="key.join('.')"
            class="field-row row-pressable flex items-center gap-2.5 px-2.5 py-2"
            :class="{ 'is-hidden': !enabled }"
            @click="toggleField(key)"
          >
            <mdi:drag-horizontal-variant class="grip text-base-content/25 size-4 shrink-0 cursor-move" />

            <!-- The checkmark holds its space when absent, so the labels stay on
                 one edge instead of jumping as fields are toggled. -->
            <span class="flex size-4 shrink-0 items-center justify-center">
              <mdi:check v-if="enabled" class="text-primary-safe size-4" />
            </span>

            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate font-mono text-[0.8125rem]">{{ key.join(".") }}</span>
              <code class="text-base-content/50 truncate font-mono text-xs">{{ preview(value) }}</code>
            </div>
          </li>
        </ul>
      </section>

      <!-- PROVENANCE, last.
           Three rows in a grouped list rather than a three-column grid under
           `font-thin` headings. The label is the quiet one and the value is the
           thing you read — the grid had that backwards. -->
      <section class="flex flex-col gap-2">
        <h2 class="type-section">{{ $t("drawer.source") }}</h2>
        <div class="inset-group">
          <div class="inset-row">
            <span class="inset-label">{{ $t("label.container-name") }}</span>
            <span class="inset-value truncate">{{ container.name }}</span>
          </div>
          <div class="inset-row">
            <span class="inset-label">{{ $t("label.host") }}</span>
            <span class="inset-value truncate">{{ hosts[container.host]?.name }}</span>
          </div>
          <div class="inset-row">
            <span class="inset-label">{{ $t("drawer.image") }}</span>
            <span class="inset-value truncate font-mono">{{ container.image }}</span>
          </div>
        </div>
      </section>
    </div>
  </DrawerPanel>
</template>

<script setup lang="ts">
import { ComplexLogEntry } from "@/models/LogEntry";
import { UseClipboard } from "@vueuse/components";
import DrawerPanel from "@/components/common/DrawerPanel.vue";

const { entry } = defineProps<{ entry: ComplexLogEntry }>();
const { currentContainer } = useContainerStore();
const list = ref<HTMLElement>();
const container = currentContainer(toRef(() => entry.containerID));
const visibleKeys = persistentVisibleKeysForContainer(container);
const { hosts } = useHosts();

const view = ref<"formatted" | "raw">("formatted");

// Raw is shown pretty-printed when it parses, verbatim when it does not — the
// point of the raw view is fidelity, not a second formatter.
const pretty = computed(() => {
  try {
    return JSON.stringify(JSON.parse(entry.rawMessage), null, 2);
  } catch {
    return entry.rawMessage;
  }
});

// One line, short enough to sit under its key without wrapping the row.
function preview(value: unknown) {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s && s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

const { useSortable } = await import("@vueuse/integrations/useSortable");

function toggleField(key: string[]) {
  if (visibleKeys.value.size === 0) {
    visibleKeys.value = new Map<string[], boolean>(fields.value.map(({ key }) => [key, true]));
  }

  const enabled = visibleKeys.value.get(key) ?? true;

  visibleKeys.value.set(key, !enabled);
}

const fields = computed({
  get() {
    const fieldsWithValue: { key: string[]; value: any; enabled: boolean }[] = [];
    const rawFields = JSON.parse(entry.rawMessage);
    const allFields = flattenJSONToMap(rawFields);
    if (visibleKeys.value.size === 0) {
      for (const [key, value] of allFields) {
        fieldsWithValue.push({ key, value, enabled: true });
      }
    } else {
      for (const [key, enabled] of visibleKeys.value) {
        const value = getDeep(rawFields, key);
        fieldsWithValue.push({ key, value, enabled });
      }

      for (const [key, value] of allFields) {
        if ([...visibleKeys.value.keys()].findIndex((k) => arrayEquals(k, key)) === -1) {
          fieldsWithValue.push({ key, value, enabled: true });
        }
      }
    }

    return fieldsWithValue;
  },
  set(value) {
    const map = new Map<string[], boolean>();
    for (const { key, enabled } of value) {
      map.set(key, enabled);
    }
    visibleKeys.value = map;
  },
});

const toggleAllFields = computed({
  get: () => fields.value.every(({ enabled }) => enabled),
  set(value) {
    if (visibleKeys.value.size === 0) {
      visibleKeys.value = new Map<string[], boolean>(fields.value.map(({ key }) => [key, true]));
    }
    for (const key of visibleKeys.value.keys()) {
      visibleKeys.value.set(key, value);
    }

    for (const field of fields.value) {
      visibleKeys.value.set(field.key, value);
    }
  },
});

// Drag by the grip only. Dragging from anywhere on the row fought the row's own
// press-to-toggle, so a slightly-moved tap became a reorder.
useSortable(list, fields, { handle: ".grip", animation: 180 });
</script>

<style scoped>
@reference "@/main.css";

/* A hidden field stays legible — it is still a row you are choosing about, not
   disabled chrome. Dimming the whole row to 40% made the key unreadable, which
   is the one thing you need in order to decide to turn it back on. */
.field-row.is-hidden .font-mono {
  @apply text-base-content/45;
}

/* The grip brightens with the row, so the drag affordance is discoverable
   without a caption telling you it exists. */
.grip {
  transition: color 150ms ease;
}

.field-row:hover .grip {
  @apply text-base-content/60;
}
</style>
