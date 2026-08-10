<template>
  <div class="mb-1 flex items-center gap-1">
    <span class="text-base-content/45 flex-1 truncate text-[0.72rem] font-semibold tracking-[0.06em] uppercase">
      {{ $t("label.namespaces") }}
    </span>
    <CollapseControls :keys="sectionKeys" />
  </div>

  <!-- namespace -> owner. The namespace list is no longer a separate screen you
       drill into; expanding a namespace shows what it holds. -->
  <ul class="menu sidebar-menu">
    <MenuSection
      v-for="{ name, owners: nsOwners } in namespaces"
      :key="name"
      variant="host"
      :title="name"
      :count="nsOwners.length"
      :open="isOpen(namespaceKey(name))"
      @update:open="setOpen(namespaceKey(name), $event)"
    >
      <template #icon>
        <ph:stack class="size-4 shrink-0 opacity-70" />
      </template>
      <template #actions>
        <router-link
          :to="{ name: '/namespace/[name]', params: { name } }"
          class="btn btn-square btn-ghost btn-xs text-primary-safe"
          active-class="menu-active"
          :title="$t('tooltip.merge-all')"
          @click.stop
        >
          <ph:arrows-merge />
        </router-link>
      </template>

      <li v-for="owner in nsOwners" :key="owner.key">
        <router-link
          :to="{ name: '/owner/[name]', params: { name: owner.key } }"
          active-class="menu-active"
          class="py-1"
          :title="`${owner.kind}/${owner.name}`"
        >
          <ph:stack-simple class="size-4 shrink-0 opacity-70" />
          <div class="truncate">{{ owner.kind }}/{{ owner.name }}</div>
        </router-link>
      </li>
    </MenuSection>

    <MenuSection
      v-if="ownersWithoutNamespace.length > 0"
      variant="host"
      :title="$t('label.owners')"
      :count="ownersWithoutNamespace.length"
      :open="isOpen(UNNAMESPACED_KEY)"
      @update:open="setOpen(UNNAMESPACED_KEY, $event)"
    >
      <template #icon>
        <ph:circles-four class="size-4 shrink-0 opacity-70" />
      </template>

      <li v-for="owner in ownersWithoutNamespace" :key="owner.key">
        <router-link
          :to="{ name: '/owner/[name]', params: { name: owner.key } }"
          active-class="menu-active"
          class="py-1"
          :title="`${owner.kind}/${owner.name}`"
        >
          <ph:stack-simple class="size-4 shrink-0 opacity-70" />
          <div class="truncate">{{ owner.kind }}/{{ owner.name }}</div>
        </router-link>
      </li>
    </MenuSection>
  </ul>
</template>

<script lang="ts" setup>
const store = useK8sStore();

const { namespaces, owners } = storeToRefs(store);

// The "owners with no namespace" section. namespaceKey() namespaces the real
// ones, so this literal can never collide with one.
const UNNAMESPACED_KEY = "ns:__unnamespaced__";

const ownersWithoutNamespace = computed(() => owners.value.filter((owner) => !owner.namespace));

const { isOpen, setOpen } = useCollapsedSections();

const sectionKeys = computed(() => {
  const keys = namespaces.value.map(({ name }) => namespaceKey(name));
  if (ownersWithoutNamespace.value.length > 0) keys.push(UNNAMESPACED_KEY);
  return keys;
});
</script>
