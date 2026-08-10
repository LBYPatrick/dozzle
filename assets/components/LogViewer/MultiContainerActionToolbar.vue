<template>
  <div class="dropdown dropdown-end z-20" :class="{ 'dropdown-open': open }" ref="root">
    <!-- A real button, opened by press — see ContainerActionsToolbar for why
         `dropdown-hover` on a <label> had to go. The stream marks differ in
         shape as well as hue so the state does not rest on telling red from
         blue. -->
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
      <mdi:dots-horizontal class="size-4" v-if="!streamConfig.stderr && !streamConfig.stdout" />
    </button>
    <ul
      v-if="open"
      role="menu"
      class="menu dropdown-content glass-surface glass-surface-sheer glass-surface-popover z-50 max-h-[calc(100dvh-7rem)] w-52 flex-nowrap overflow-y-auto overscroll-contain rounded-[var(--control-radius)] p-1"
      @click="onItemClick"
    >
      <li>
        <button type="button" role="menuitem" @click="clear()">
          <octicon:trash-24 /> {{ $t("toolbar.clear") }}
          <KeyShortcut char="l" :modifiers="['shift', 'meta']" />
        </button>
      </li>
      <li v-if="enableDownload">
        <a :href="downloadUrl" download>
          <octicon:download-24 />
          {{ isFiltered ? $t("toolbar.download-filtered") : $t("toolbar.download") }}
        </a>
      </li>
      <li class="line"></li>
      <li>
        <button
          type="button"
          role="menuitem"
          @click="
            streamConfig.stdout = true;
            streamConfig.stderr = true;
          "
        >
          <mdi:check class="w-4" v-if="streamConfig.stderr && streamConfig.stdout" />
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
          <mdi:check class="w-4" v-if="!streamConfig.stderr && streamConfig.stdout" />
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
          <mdi:check class="w-4" v-if="streamConfig.stderr && !streamConfig.stdout" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show", { std: "STDERR" }) }}
        </button>
      </li>
      <li class="line"></li>
      <StatDisplayMenu />
      <li class="line"></li>
      <li>
        <button type="button" role="menuitem" @click="showHostname = !showHostname">
          <mdi:check class="w-4" v-if="showHostname" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show-hostname") }}
        </button>
      </li>
      <li>
        <button type="button" role="menuitem" @click="showContainerName = !showContainerName">
          <mdi:check class="w-4" v-if="showContainerName" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show-container-name") }}
        </button>
      </li>
      <li class="line"></li>
      <!-- Which containers this view draws from at all, as opposed to the two
           above, which only say what each row prints. Reconnects the stream:
           the server decides the set, so including stopped containers is a
           different subscription rather than a client-side unhide. -->
      <li>
        <button type="button" role="menuitem" @click="toggleStopped()">
          <mdi:check class="w-4" v-if="showAllContainers" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.include-stopped") }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const { enableDownload } = config;
const clear = defineEmit();

const { name } = defineProps<{ name?: string }>();

const { streamConfig, showHostname, showContainerName, containers, levels } = useLoggingContext();

const { t } = useI18n();

// The same setting the sidebar's eye drives, so "running vs all" means one
// thing across the app rather than one thing per surface.
const toggleStopped = () => {
  showAllContainers.value = !showAllContainers.value;
  notifySetting(t(showAllContainers.value ? "toasts.showing-all-containers" : "toasts.showing-running-containers"));
};

const { downloadUrl, isFiltered } = useDownloadUrl(containers, streamConfig, levels, name);

const root = useTemplateRef<HTMLElement>("root");
const trigger = useTemplateRef<HTMLElement>("trigger");
const { open, toggle, onItemClick } = useDropdownMenu(root, trigger);

// The trigger's accessible name says what the marks mean rather than leaving
// them to be decoded from two coloured dots.
const streamSummary = computed(() => {
  const { stdout, stderr } = streamConfig.value;
  const shown = [stdout && "stdout", stderr && "stderr"].filter(Boolean).join(" + ");
  return shown ? `${t("action.more-actions")} — ${shown}` : t("action.more-actions");
});
</script>

<style scoped>
@reference "@/main.css";
li.line {
  @apply bg-base-content/20 h-px;
}

a,
button[role="menuitem"] {
  @apply whitespace-nowrap;
}

/* daisyUI's .menu is width: fit-content, so a nested submenu shrinks to its
 * content and the hover highlight stops short. Stretch it to fill the dropdown. */
.menu li ul {
  margin-inline-start: 0;
  width: 100%;
  &:before {
    display: none;
  }
}
</style>
