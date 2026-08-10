<template>
  <!-- A 404 has to answer "how do I get out of here", which this one did not:
       it was a single sentence with no link anywhere on it. §16 Wayfinding —
       never trap the user.

       The nested `hero min-h-screen` is gone too. It sat inside PageWithLinks's
       own padding (so the page carried two sets of chrome) and `screen` rather
       than `dvh` meant it ran under the iOS URL bar. -->
  <PageWithLinks>
    <div class="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <ph:compass class="text-base-content/30 size-10" />
      <div class="flex flex-col gap-1">
        <h1 class="type-title">{{ $t("error.page-not-found") }}</h1>
        <p class="type-body text-base-content/60">{{ $t("error.page-not-found-hint") }}</p>
      </div>
      <router-link :to="{ name: '/' }" class="btn btn-sm btn-primary">
        {{ $t("button.back-to-dashboard") }}
      </router-link>
    </div>
  </PageWithLinks>
</template>

<script lang="ts" setup>
const { t } = useI18n();
setTitle(t("title.page-not-found"));
</script>
