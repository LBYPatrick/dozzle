<template>
  <div
    class="dropdown absolute -left-2 z-10 font-sans"
    :class="[shouldShowBelow ? 'dropdown-right' : 'dropdown-right dropdown-end', { 'dropdown-open': open }]"
    v-show="container"
    ref="root"
  >
    <!-- Opened by press, and present on touch.
         This was `dropdown-hover` on a trigger that was itself `opacity-0
         group-hover/entry`, so on a phone or tablet the whole menu — copy log,
         copy permalink, see-in-context, show details, create alert — did not
         exist. `.reveal-on-hover` keeps the quiet-until-hovered behaviour on a
         pointer device and drops it under `@media (pointer: coarse)`.

         `size-8` rather than `btn-xs`: still small enough to stay out of the
         way of a dense log, but a real target rather than a 24px one. -->
    <router-link
      v-if="isFiltered"
      @click="resetSearch()"
      class="btn btn-square reveal-on-hover border-base-content/20 pointer-events-auto! size-8 min-h-0 shadow-sm"
      :title="$t('action.see-in-context')"
      :aria-label="$t('action.see-in-context')"
      :to="{
        name: '/container/[id].time.[datetime]',
        params: { id: container.id, datetime: logEntry.date.toISOString() },
        query: { logId: logEntry.id },
      }"
    >
      <material-symbols:eye-tracking />
    </router-link>
    <button
      v-else
      type="button"
      ref="trigger"
      class="btn btn-square reveal-on-hover border-base-content/20 size-8 min-h-0 border shadow-sm"
      aria-haspopup="menu"
      :aria-expanded="open"
      :title="$t('action.more-actions')"
      :aria-label="$t('action.more-actions')"
      @click="onTriggerClick"
    >
      <ion:ellipsis-vertical />
    </button>
    <!-- Built on first open. Every visible log line renders one of these, so
         eagerly materializing the menu (five rows, two resolved routes) for
         each of them is what made rebuilding the list — on a stdout/stderr
         toggle, a level change, a search — lock the page up. -->
    <ul
      v-if="menuMounted"
      v-show="open"
      role="menu"
      class="menu dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 w-52 rounded-[var(--control-radius)] p-1 text-sm"
      @click="onItemClick"
    >
      <li v-if="isFiltered">
        <router-link
          role="menuitem"
          @click="resetSearch()"
          :to="{
            name: '/container/[id].time.[datetime]',
            params: { id: container.id, datetime: logEntry.date.toISOString() },
            query: { logId: logEntry.id },
          }"
        >
          <material-symbols:eye-tracking />
          {{ $t("action.see-in-context") }}
        </router-link>
      </li>
      <li>
        <button
          type="button"
          role="menuitem"
          @click="copyLogMessage()"
          :disabled="!isSupported"
          :title="!isSupported ? $t('error.copy-not-supported') : ''"
          :class="{ 'cursor-not-allowed opacity-50': !isSupported }"
        >
          <material-symbols:content-copy />
          {{ $t("action.copy-log") }}
        </button>
      </li>
      <li>
        <button
          type="button"
          role="menuitem"
          @click="copyPermalink()"
          :disabled="!isSupported"
          :title="!isSupported ? $t('error.copy-not-supported') : ''"
          :class="{ 'cursor-not-allowed opacity-50': !isSupported }"
        >
          <material-symbols:link />
          {{ $t("action.copy-link") }}
        </button>
      </li>

      <li v-if="logEntry instanceof ComplexLogEntry">
        <button type="button" role="menuitem" @click="showDrawer(LogDetails, { entry: logEntry })">
          <material-symbols:code-blocks-rounded />
          {{ $t("action.show-details") }}
        </button>
      </li>
      <li>
        <button type="button" role="menuitem" @click="createAlert()">
          <mdi:bell />
          {{ $t("action.create-alert") }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import stripAnsi from "strip-ansi";
import { Container } from "@/models/Container";
import { LogEntry, SimpleLogEntry, ComplexLogEntry, GroupedLogEntry, JSONObject } from "@/models/LogEntry";
import LogDetails from "./LogDetails.vue";
import AlertForm from "@/components/Notification/AlertForm.vue";

const { logEntry, container } = defineProps<{
  logEntry: LogEntry<string | JSONObject>;
  container: Container;
}>();

const { showToast } = useToast();
const showDrawer = useDrawer();
const router = useRouter();
const { isSearching, resetSearch } = useSearchFilter();
const { levels } = useLoggingContext();

// Show "see in context" whenever the stream is narrowed, either by a text search
// or by a log-level filter, so the entry can be inspected in the full log stream.
const isFiltered = computed(() => isSearching.value || allLevels.some((level) => !levels.value.has(level)));

const { copy, isSupported, copied } = useClipboard({ legacy: true });
const { t } = useI18n();

async function copyLogMessage() {
  if (!isSupported.value) {
    return;
  }

  if (logEntry instanceof ComplexLogEntry) {
    await copy(stripAnsi(logEntry.rawMessage));
  } else if (logEntry instanceof SimpleLogEntry) {
    await copy(stripAnsi(logEntry.rawMessage));
  } else if (logEntry instanceof GroupedLogEntry) {
    await copy(stripAnsi(logEntry.message.join("\n")));
  }

  if (copied.value) {
    showToast(
      {
        title: t("toasts.copied.title"),
        message: t("toasts.copied.message"),
        type: "info",
      },
      { expire: 2000 },
    );
  }
}

async function copyPermalink() {
  if (!isSupported.value) {
    return;
  }
  const url = router.resolve({
    name: "/container/[id].time.[datetime]",
    params: { id: container.id, datetime: logEntry.date.toISOString() },
    query: { logId: logEntry.id },
  }).href;

  const resolved = new URL(url, window.location.origin);

  await copy(resolved.href);

  if (copied.value) {
    showToast(
      {
        title: t("toasts.copied.title"),
        message: t("toasts.copied.message"),
        type: "info",
      },
      { expire: 2000 },
    );
  }
}

function createAlert() {
  const containerExpr = `name contains "${container.name}"`;
  let logExpr = "";
  if (logEntry.level && logEntry.level !== "unknown") {
    logExpr = `level == "${logEntry.level}"`;
  }

  const nameParts = [container.name];
  if (logEntry.level && logEntry.level !== "unknown") {
    nameParts.push(logEntry.level);
  }
  const name = nameParts.join(" ");

  showDrawer(AlertForm, { prefill: { name, containerExpression: containerExpr, logExpression: logExpr } }, "lg");
}

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);

const shouldShowBelow = ref(false);
const menuMounted = ref(false);

// Which side the menu opens toward is decided at the moment of the press, from
// where the row actually is — a row near the top of the viewport has no room
// above it. Measured here rather than on hover because there is no longer a
// hover to measure on.
function onTriggerClick() {
  if (root.value) {
    shouldShowBelow.value = root.value.getBoundingClientRect().top < 150;
  }
  menuMounted.value = true;
  toggle();
}
</script>
