<template>
  <div class="mb-1 flex items-center gap-1">
    <span class="text-base-content/45 flex-1 truncate text-[0.72rem] font-semibold tracking-[0.06em] uppercase">
      {{ $t("label.service", services.length) }}
    </span>
    <div class="dropdown dropdown-end dropdown-hover flex-none">
      <label
        tabindex="0"
        class="btn btn-square btn-ghost btn-sm"
        :title="$t('action.more-actions')"
        :aria-label="$t('action.more-actions')"
      >
        <ph:dots-three-vertical-bold class="size-5" />
      </label>
      <ul
        tabindex="0"
        class="menu dropdown-content rounded-box bg-base-200 border-base-content/20 z-50 w-52 border p-1 shadow-sm"
      >
        <li>
          <a class="text-sm capitalize" @click="collapseAll()">
            <material-symbols-light:expand-all class="w-4" v-if="allCollapsed" />
            <material-symbols-light:collapse-all class="w-4" v-else />
            {{ allCollapsed ? $t("label.expand-all") : $t("label.collapse-all") }}
          </a>
        </li>
      </ul>
    </div>
  </div>

  <!-- stack -> service, in the same outline language as the host menu. -->
  <ul class="menu sidebar-menu">
    <MenuSection
      v-for="{ name, services: stackServices } in stacks"
      :key="name"
      variant="host"
      :title="name"
      :count="stackServices.length"
      :open="isOpen(stackKey(name))"
      @update:open="setOpen(stackKey(name), $event)"
    >
      <template #icon>
        <ph:stack class="size-4 shrink-0 opacity-70" />
      </template>
      <template #actions>
        <router-link
          :to="{ name: '/stack/[name]', params: { name } }"
          class="btn btn-square btn-ghost btn-xs text-primary"
          active-class="menu-active"
          :title="$t('tooltip.merge-all')"
          @click.stop
        >
          <ph:arrows-merge />
        </router-link>
      </template>

      <li v-for="service in stackServices" :key="service.name">
        <router-link
          :to="{ name: '/service/[name]', params: { name: service.name } }"
          active-class="menu-active"
          class="py-1"
          :title="service.name"
        >
          <ph:stack-simple class="size-4 shrink-0 opacity-70" />
          <div class="truncate">{{ service.name }}</div>
        </router-link>
      </li>
    </MenuSection>

    <MenuSection
      v-if="servicesWithoutStacks.length > 0"
      variant="host"
      :title="$t('label.services')"
      :count="servicesWithoutStacks.length"
      :open="isOpen(UNSTACKED_KEY)"
      @update:open="setOpen(UNSTACKED_KEY, $event)"
    >
      <template #icon>
        <ph:circles-four class="size-4 shrink-0 opacity-70" />
      </template>

      <li v-for="service in servicesWithoutStacks" :key="service.name">
        <router-link
          :to="{ name: '/service/[name]', params: { name: service.name } }"
          active-class="menu-active"
          class="py-1"
          :title="service.name"
        >
          <ph:stack-simple class="size-4 shrink-0 opacity-70" />
          <div class="truncate">{{ service.name }}</div>
        </router-link>
      </li>
    </MenuSection>
  </ul>
</template>

<script lang="ts" setup>
const store = useSwarmStore();

const { stacks, services } = storeToRefs(store);

const servicesWithoutStacks = computed(() => services.value.filter((service) => !service.stack));

// The "services with no stack" section. stackKey() namespaces the real stacks,
// so this literal can never collide with one.
const UNSTACKED_KEY = "stack:__unstacked__";

const { isOpen, setOpen, allCollapsed: allOf, toggleAll } = useCollapsedSections();

const sectionKeys = computed(() => {
  const keys = stacks.value.map(({ name }) => stackKey(name));
  if (servicesWithoutStacks.value.length > 0) keys.push(UNSTACKED_KEY);
  return keys;
});

const allCollapsed = computed(() => allOf(sectionKeys.value));
const collapseAll = () => toggleAll(sectionKeys.value);
</script>
