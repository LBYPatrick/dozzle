<template>
  <div class="mb-1 flex items-center gap-1">
    <span class="text-base-content/45 flex-1 truncate text-[0.72rem] font-semibold tracking-[0.06em] uppercase">
      {{ $t("label.group-menu") }}
    </span>
  </div>

  <ul class="menu sidebar-menu">
    <MenuSection
      v-if="customGroups.length > 0"
      variant="host"
      :title="$t('label.group-menu')"
      :count="customGroups.length"
      :open="isOpen(GROUPS_KEY)"
      @update:open="setOpen(GROUPS_KEY, $event)"
    >
      <template #icon>
        <ph:bounding-box-fill class="size-4 shrink-0 opacity-70" />
      </template>

      <li v-for="group in customGroups" :key="group.name">
        <router-link
          :to="{ name: '/group/[name]', params: { name: group.name } }"
          active-class="menu-active"
          class="py-1"
          :title="group.name"
        >
          <ph:stack-simple class="size-4 shrink-0 opacity-70" />
          <div class="truncate">{{ group.name }}</div>
        </router-link>
      </li>
    </MenuSection>
  </ul>
</template>

<script lang="ts" setup>
const store = useSwarmStore();

const { customGroups } = storeToRefs(store);

const GROUPS_KEY = "custom-groups";

const { isOpen, setOpen } = useCollapsedSections();
</script>
