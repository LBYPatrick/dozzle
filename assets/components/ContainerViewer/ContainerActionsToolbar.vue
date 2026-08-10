<template>
  <div class="dropdown dropdown-end z-20" :class="{ 'dropdown-open': open }" ref="root">
    <!-- A real button, opened by press. It was a <label> on `dropdown-hover`:
         no button semantics, nothing announced to a screen reader, and — since
         a touch device never hovers — no way to open it on a phone at all.

         The stream state lives on the trigger: one mark per stream currently
         shown. The marks differ in shape as well as hue (stderr is a ring,
         stdout a disc), because two coloured dots encode the whole state in
         colour alone and red/blue is the most common confusion there is. -->
    <button
      type="button"
      ref="trigger"
      class="btn btn-ghost btn-sm size-11 gap-0 px-0 md:gap-0.5"
      aria-haspopup="menu"
      :aria-expanded="open"
      :title="streamSummary"
      :aria-label="streamSummary"
      @click="toggle"
    >
      <carbon:circle-outline class="text-error w-2.5 md:w-3" v-if="streamConfig.stderr" />
      <carbon:circle-solid class="text-info w-2 md:w-2.5" v-if="streamConfig.stdout" />
      <!-- Neither stream shown is a state too, and an empty button is not a
           state, it is a broken button. -->
      <mdi:dots-horizontal class="size-4" v-if="!streamConfig.stderr && !streamConfig.stdout" />
    </button>
    <ul
      v-if="open"
      role="menu"
      class="menu dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 max-h-[calc(100dvh-7rem)] w-52 flex-nowrap overflow-y-auto overscroll-contain rounded-[var(--control-radius)] p-1"
      @click="onItemClick"
    >
      <li v-if="!historical">
        <button type="button" role="menuitem" @click="clear()">
          <octicon:trash-24 /> {{ $t("toolbar.clear") }}
          <KeyShortcut char="l" :modifiers="['shift', 'meta']" />
        </button>
      </li>
      <li v-if="hasComplexLogs">
        <button type="button" role="menuitem" @click="showDrawer(LogAnalytics, { container }, 'lg')">
          <ph:file-sql /> SQL Analytics
          <KeyShortcut char="f" :modifiers="['shift', 'meta']" />
        </button>
      </li>
      <li class="line"></li>
      <li>
        <details>
          <summary>
            <ph:swap class="w-4" />
            Streams
          </summary>
          <ul class="menu">
            <li>
              <button
                type="button"
                role="menuitem"
                @click="
                  streamConfig.stdout = true;
                  streamConfig.stderr = true;
                "
              >
                <mdi:check class="w-4" v-if="streamConfig.stdout == true && streamConfig.stderr == true" />
                <div v-else class="w-4"></div>
                {{ $t("toolbar.show-all") }}
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                @click="
                  streamConfig.stdout = true;
                  streamConfig.stderr = false;
                "
              >
                <mdi:check class="w-4" v-if="streamConfig.stdout == true && streamConfig.stderr == false" />
                <div v-else class="w-4"></div>
                {{ $t("toolbar.show", { std: "STDOUT" }) }}
              </button>
            </li>
            <li>
              <button
                type="button"
                role="menuitem"
                @click="
                  streamConfig.stdout = false;
                  streamConfig.stderr = true;
                "
              >
                <mdi:check class="w-4" v-if="streamConfig.stdout == false && streamConfig.stderr == true" />
                <div v-else class="w-4"></div>
                {{ $t("toolbar.show", { std: "STDERR" }) }}
              </button>
            </li>
          </ul>
        </details>
      </li>
      <li>
        <!-- Summary is icon + label only, like every other submenu here. The
             "toggle all" switch used to sit in this row and landed underneath
             daisyUI's disclosure chevron; it belongs with the choices it
             governs, not in the row that opens them. -->
        <details>
          <summary>
            <mdi:gauge />
            Levels
          </summary>
          <ul class="menu">
            <li>
              <button type="button" role="menuitem" @click="showAllLevels()">
                <mdi:check class="w-4" v-if="allLevelsShown" />
                <div v-else class="w-4"></div>
                {{ $t("toolbar.show-all") }}
              </button>
            </li>
            <li class="line"></li>
            <li v-for="level in allLevels">
              <button
                type="button"
                role="menuitem"
                class="capitalize"
                @click="levels.has(level) ? levels.delete(level) : levels.add(level)"
              >
                <mdi:check class="w-4" v-if="levels.has(level)" />
                <div v-else class="w-4"></div>

                <!-- The shared pill, tinted from the level ramp. This was a
                     daisyUI `.badge` with a solid level colour and an
                     `!important` light-theme text override on top — a fifth
                     small-label system, and the only one that needed a hack to
                     stay readable. A tonal pill needs none: the wash carries
                     the hue, the label carries the level's own readable form. -->
                <div class="flex">
                  <span class="status-pill level-pill" :data-level="level">{{ level }}</span>
                </div>
              </button>
            </li>
          </ul>
        </details>
      </li>

      <StatDisplayMenu />

      <li class="line"></li>
      <li v-if="enableDownload">
        <a :href="downloadUrl" download>
          <octicon:download-24 />
          {{ isFiltered ? $t("toolbar.download-filtered") : $t("toolbar.download") }}
        </a>
      </li>
      <li v-if="isSupported">
        <button type="button" role="menuitem" @click="copyLogs()">
          <mdi:content-copy />
          {{ isFiltered ? $t("toolbar.copy-filtered-logs") : $t("toolbar.copy-logs") }}
        </button>
      </li>
      <li>
        <button type="button" role="menuitem" @click="copyPermalink()">
          <material-symbols:link />
          {{ $t("toolbar.copy-permalink") }}
        </button>
      </li>

      <!-- Container actions (enabled via config).
           §16 Agency: these three interrupt a running service, and `update`
           pulls a new image and recreates the container — genuinely
           irreversible. They fired on a single click with no confirmation and
           no way back. They arm on the first press instead, and disarm on
           their own if you walk away, which is the same two-step the settings
           reset uses. Starting a container is not destructive and stays
           immediate. -->
      <template v-if="enableActions && !historical">
        <li class="line"></li>
        <li>
          <button
            type="button"
            role="menuitem"
            :class="{ 'is-armed': armed === 'stop' }"
            @click.stop="confirmAction('stop', stop)"
            :disabled="actionStates.stop || actionStates.restart"
            v-if="container.state == 'running'"
          >
            <carbon:stop-filled-alt /> {{ armed === "stop" ? $t("toolbar.confirm") : $t("toolbar.stop") }}
          </button>

          <button
            type="button"
            role="menuitem"
            @click="start()"
            :disabled="actionStates.start || actionStates.restart"
            v-if="container.state != 'running'"
          >
            <carbon:play /> {{ $t("toolbar.start") }}
          </button>
        </li>
        <li>
          <button
            type="button"
            role="menuitem"
            :class="{ 'is-armed': armed === 'restart' }"
            @click.stop="confirmAction('restart', restart)"
            :disabled="disableRestart"
          >
            <carbon:restart
              :class="{
                'animate-spin': actionStates.restart,
                'text-secondary-safe': actionStates.restart,
              }"
            />
            {{ armed === "restart" ? $t("toolbar.confirm") : $t("toolbar.restart") }}
          </button>
        </li>
        <li>
          <button
            type="button"
            role="menuitem"
            :class="{ 'is-armed': armed === 'update' }"
            @click.stop="confirmAction('update', update)"
            :disabled="actionStates.update"
          >
            <carbon:upgrade />
            <span>
              {{
                armed === "update"
                  ? $t("toolbar.confirm")
                  : container.isSwarm
                    ? $t("toolbar.update-service")
                    : $t("toolbar.update")
              }}
            </span>
          </button>
        </li>
      </template>

      <template v-if="enableShell && !historical">
        <li class="line"></li>
        <li>
          <button type="button" role="menuitem" @click="showDrawer(Terminal, { container, action: 'attach' }, 'lg')">
            <ri:terminal-window-fill />
            {{ $t("toolbar.attach") }}
            <KeyShortcut char="a" :modifiers="['shift', 'meta']" />
          </button>
        </li>
        <li>
          <button type="button" role="menuitem" @click="showDrawer(Terminal, { container, action: 'exec' }, 'lg')">
            <material-symbols:terminal />
            {{ $t("toolbar.shell") }}
            <KeyShortcut char="e" :modifiers="['shift', 'meta']" />
          </button>
        </li>
      </template>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";
import { allLevels } from "@/composable/logContext";
import LogAnalytics from "../LogViewer/LogAnalytics.vue";
import Terminal from "@/components/Terminal.vue";

const { enableActions, enableShell, enableDownload } = config;
const { streamConfig, hasComplexLogs, levels } = useLoggingContext();
// Resolved during setup: useSearchFilter injects, so it cannot run from a click.
const { debouncedSearchFilter } = useSearchFilter();
const showDrawer = useDrawer();

const { container, historical = false } = defineProps<{ container: Container; historical?: boolean }>();
const clear = defineEmit();
const { actionStates, start, stop, restart, update } = useContainerActions(toRef(() => container));

const router = useRouter();
const { copy, copied, isSupported } = useClipboard({ legacy: true });
const { t } = useI18n();
const { showToast, removeToast } = useToast();

async function copyPermalink() {
  const url = router.resolve({
    name: "/show",
    query: { name: container.name, host: container.host },
  }).href;

  const resolved = new URL(url, window.location.origin);

  if (!isSupported.value) {
    showToast(
      {
        title: t("error.copy-not-supported-hint"),
        message: resolved.href,
        type: "info",
      },
      { expire: 10000 },
    );
    return;
  }

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

async function copyLogs() {
  const params = new URLSearchParams();
  if (streamConfig.value.stdout) params.append("stdout", "1");
  if (streamConfig.value.stderr) params.append("stderr", "1");
  params.append("everything", "1");

  if (debouncedSearchFilter.value) {
    params.append("filter", debouncedSearchFilter.value);
  }

  const selectedLevels = Array.from(levels.value);
  if (selectedLevels.length > 0 && selectedLevels.length < allLevels.length) {
    selectedLevels.forEach((level) => params.append("levels", level));
  }

  const url = withBase(`/api/hosts/${container.host}/containers/${container.id}/logs?${params.toString()}`);

  const toastId = "copy-logs";
  showToast(
    {
      id: toastId,
      title: t("toolbar.copying-logs"),
      message: "",
      type: "info",
    },
    { once: true },
  );

  const blobPromise = fetch(url, { headers: { Accept: "text/plain" } })
    .then((response) => {
      if (!response.ok) throw new Error(response.statusText);
      return response.blob();
    })
    .then((blob) => {
      removeToast(toastId);
      showToast(
        {
          title: t("toasts.copied.title"),
          message: t("toasts.copied.message"),
          type: "info",
        },
        { expire: 2000 },
      );
      return blob;
    })
    .catch((err) => {
      removeToast(toastId);
      showToast(
        {
          title: "Error",
          message: err.message,
          type: "error",
        },
        { expire: 5000 },
      );
      throw err;
    });

  await navigator.clipboard.write([new ClipboardItem({ "text/plain": blobPromise })]);
}

onKeyStroke(["f", "F"], (e) => {
  if (hasComplexLogs.value) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      showDrawer(LogAnalytics, { container }, "lg");
      e.preventDefault();
    }
  }
});
if (enableShell) {
  onKeyStroke(["a", "A"], (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      showDrawer(Terminal, { container, action: "attach" }, "lg");
      e.preventDefault();
    }
  });

  onKeyStroke(["e", "E"], (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      showDrawer(Terminal, { container, action: "exec" }, "lg");
      e.preventDefault();
    }
  });
}

const containerRef = computed(() => [container]);
const { downloadUrl, isFiltered } = useDownloadUrl(
  containerRef,
  streamConfig,
  levels,
  toRef(() => container.name),
);

const disableRestart = computed(() => actionStates.stop || actionStates.start || actionStates.restart);

const allLevelsShown = computed(() => levels.value.size === allLevels.length);
// Idempotent: "show all" always ends with everything on, never toggles the
// whole set off underneath you.
const showAllLevels = () => allLevels.forEach((level) => levels.value.add(level));

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, close, onItemClick } = useDropdownMenu(root, trigger);

// The trigger's accessible name says what the marks mean rather than leaving
// them to be decoded from two coloured dots.
const streamSummary = computed(() => {
  const { stdout, stderr } = streamConfig.value;
  const shown = [stdout && "stdout", stderr && "stderr"].filter(Boolean).join(" + ");
  return shown ? `${t("action.more-actions")} — ${shown}` : t("action.more-actions");
});

// Two-step confirmation for the actions that interrupt or replace a running
// container. Arms on the first press, fires on the second, and disarms after a
// few seconds so an abandoned menu is not left loaded.
type Armable = "stop" | "restart" | "update";
const armed = ref<Armable | null>(null);
let armTimer: ReturnType<typeof setTimeout> | undefined;

function confirmAction(name: Armable, perform: () => void) {
  clearTimeout(armTimer);
  if (armed.value !== name) {
    armed.value = name;
    armTimer = setTimeout(() => (armed.value = null), 4000);
    return;
  }
  armed.value = null;
  perform();
  close();
}

// Closing the menu forgets what was armed; reopening it should not present a
// loaded button you armed a minute ago.
watch(open, (isOpen) => {
  if (!isOpen) {
    clearTimeout(armTimer);
    armed.value = null;
  }
});

onBeforeUnmount(() => clearTimeout(armTimer));
</script>

<style scoped>
@reference "@/main.css";

li.line {
  @apply bg-base-content/20 h-px;
}

a {
  @apply whitespace-nowrap;
}

/* daisyUI's .menu is width: fit-content, so nested submenus (Streams, Levels)
 * shrink to their content and the hover highlight stops short. Stretch them to
 * fill the dropdown so the row highlight spans the full width. */
.menu li ul {
  margin-inline-start: 0;
  width: 100%;
  &:before {
    display: none;
  }
}

/* An armed destructive action. Loud enough that the second press is a
 * deliberate one, and it reverts on its own after a few seconds. */
.is-armed {
  background-color: color-mix(in oklab, var(--color-error) 18%, transparent) !important;
  color: var(--color-error-text) !important;
  font-weight: 600;
}
</style>
