<template>
  <!-- fill: page fills the viewport and never scrolls itself; the child owns
       any scrolling (e.g. cloud search's internal-scroll table). Otherwise the
       page grows with content and the document scrolls as usual. -->
  <div
    class="flex flex-col px-4 md:px-8"
    :class="fill ? 'h-[calc(100dvh-var(--mobile-nav-height))] overflow-hidden py-4 md:h-dvh' : 'gap-5 py-4'"
  >
    <section class="flex shrink-0 items-center gap-4" :class="{ 'mb-5': fill }">
      <CloudSearchInline class="hidden max-w-sm flex-1 md:flex" />
      <Links class="ml-auto">
        <template #more-items>
          <Tag class="font-mono">{{ config.version }}</Tag>
        </template>
      </Links>
    </section>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { useInlineSearchProvider } from "@/composable/inlineSearch";

const { fill = false } = defineProps<{ fill?: boolean }>();

useInlineSearchProvider();
</script>
