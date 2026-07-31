<template>
  <!-- fill: page fills the viewport and never scrolls itself; the child owns
       any scrolling (e.g. cloud search's internal-scroll table). Otherwise the
       page grows with content and the document scrolls as usual. -->
  <div
    class="flex flex-col px-4 md:px-8"
    :class="fill ? 'h-[calc(100dvh-var(--mobile-nav-height))] overflow-hidden py-4 md:h-dvh' : 'gap-5 py-4'"
  >
    <!-- Only the account menu lives up here now. The build version moved to
         Settings > Updates, which is where you go to act on it; on a page header
         it was a permanent label nobody reads twice. The row is dropped entirely
         when there is no account to show, rather than reserving empty space. -->
    <section v-if="config.user" class="flex shrink-0 items-center gap-4" :class="{ 'mb-5': fill }">
      <Links class="ml-auto" />
    </section>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
const { fill = false } = defineProps<{ fill?: boolean }>();
</script>
