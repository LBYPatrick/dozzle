<template>
  <div class="flex flex-col gap-8 px-4 py-4 md:px-8">
    <section>
      <Links>
        <template #more-items>
          <Tag class="font-mono">{{ config.version }}</Tag>
        </template>
      </Links>
    </section>

    <SettingsPanels />
  </div>
</template>

<script lang="ts" setup>
import SettingsPanels from "@/components/Settings/SettingsPanels.vue";

const { t } = useI18n();
setTitle(t("title.settings"));
</script>
