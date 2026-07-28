<template>
  <div class="dropdown dropdown-end dropdown-hover z-20" @mouseleave="collapseSubmenus" @focusout="onFocusOut">
    <!-- The stream state lives on the trigger itself: one dot per stream that
         is currently being shown. Compact, and it needs no room in the bar. -->
    <label
      tabindex="0"
      class="btn btn-ghost btn-sm w-8 gap-0 px-0 md:gap-0.5"
      :title="$t('action.more-actions')"
      :aria-label="$t('action.more-actions')"
    >
      <carbon:circle-solid class="text-red w-2 md:w-2.5" v-if="streamConfig.stderr" />
      <carbon:circle-solid class="text-blue w-2 md:w-2.5" v-if="streamConfig.stdout" />
    </label>
    <ul
      tabindex="0"
      class="menu dropdown-content glass-surface rounded-box z-50 max-h-[calc(100dvh-7rem)] w-52 flex-nowrap overflow-y-auto overscroll-contain p-1"
      @click="hideMenu"
    >
      <li>
        <a @click="clear()">
          <octicon:trash-24 /> {{ $t("toolbar.clear") }}
          <KeyShortcut char="l" :modifiers="['shift', 'meta']" />
        </a>
      </li>
      <li v-if="enableDownload">
        <a :href="downloadUrl" download>
          <octicon:download-24 />
          {{ isFiltered ? $t("toolbar.download-filtered") : $t("toolbar.download") }}
        </a>
      </li>
      <li class="line"></li>
      <li>
        <a
          @click="
            streamConfig.stdout = true;
            streamConfig.stderr = true;
          "
        >
          <mdi:check class="w-4" v-if="streamConfig.stderr && streamConfig.stdout" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show-all") }}
        </a>
      </li>
      <li>
        <a
          @click="
            streamConfig.stdout = true;
            streamConfig.stderr = false;
          "
        >
          <mdi:check class="w-4" v-if="!streamConfig.stderr && streamConfig.stdout" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show", { std: "STDOUT" }) }}
        </a>
      </li>
      <li>
        <a
          @click="
            streamConfig.stdout = false;
            streamConfig.stderr = true;
          "
        >
          <mdi:check class="w-4" v-if="streamConfig.stderr && !streamConfig.stdout" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show", { std: "STDERR" }) }}
        </a>
      </li>
      <li class="line"></li>
      <StatDisplayMenu />
      <li class="line"></li>
      <li>
        <a @click="showHostname = !showHostname">
          <mdi:check class="w-4" v-if="showHostname" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show-hostname") }}
        </a>
      </li>
      <li>
        <a @click="showContainerName = !showContainerName">
          <mdi:check class="w-4" v-if="showContainerName" />
          <div v-else class="w-4"></div>
          {{ $t("toolbar.show-container-name") }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const { enableDownload } = config;
const clear = defineEmit();

const { name } = defineProps<{ name?: string }>();

const { streamConfig, showHostname, showContainerName, containers, levels } = useLoggingContext();

const { downloadUrl, isFiltered } = useDownloadUrl(containers, streamConfig, levels, name);

const { hideMenu, collapseSubmenus, onFocusOut } = useDropdownMenu();
</script>

<style scoped>
@reference "@/main.css";
li.line {
  @apply bg-base-content/20 h-px;
}

a {
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
