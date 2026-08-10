<template>
  <!-- A permalink resolver still has to be a screen.
       This page rendered nothing at all — an empty template — while it waited
       for the container store, so following a `/show?name=…` link was a blank
       white page for however long that took. Somewhere between "instant" and
       "forever", and the user could not tell which. -->
  <PageWithLinks>
    <div class="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <template v-if="!failed">
        <span class="loading loading-spinner loading-md text-primary-safe"></span>
        <p class="type-body text-base-content/70">
          {{ $t("label.finding-container", { name }) }}
        </p>
        <!-- After a few seconds, waiting silently is no longer honest. The way
             out appears without cancelling the search, which may still land. -->
        <router-link v-if="slow" :to="{ name: '/' }" class="btn btn-sm">
          {{ $t("button.back-to-dashboard") }}
        </router-link>
      </template>

      <template v-else>
        <ph:magnifying-glass class="text-base-content/30 size-8" />
        <div class="flex flex-col gap-1">
          <p class="type-heading">{{ $t("error.container-not-found") }}</p>
          <p v-if="name" class="type-caption text-base-content/60 font-mono">{{ name }}</p>
        </div>
        <router-link :to="{ name: '/' }" class="btn btn-sm btn-primary">
          {{ $t("button.back-to-dashboard") }}
        </router-link>
      </template>
    </div>
  </PageWithLinks>
</template>

<script lang="ts" setup>
const router = useRouter();
const route = useRoute();

const store = useContainerStore();
const { containers, ready } = storeToRefs(store);

const name = computed(() => (route.query.name as string) ?? "");
const host = computed(() => route.query.host as string | undefined);

const failed = ref(false);
const slow = ref(false);
// Long enough that a fast resolve never shows it, short enough that a stalled
// one does not read as a hang.
const slowTimer = setTimeout(() => (slow.value = true), 4000);
onBeforeUnmount(() => clearTimeout(slowTimer));

function resolve() {
  if (!name.value) {
    failed.value = true;
    return;
  }

  const matches = containers.value
    .filter((c) => c.name == name.value && (!host.value || c.host == host.value))
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  if (matches.length > 0) {
    router.push({ name: "/container/[id]", params: { id: matches[0].id } });
    return;
  }

  // Only give up once the store says it has the full picture. Before that, an
  // empty result means "not loaded yet", not "not there".
  if (ready.value) failed.value = true;
}

// `immediate`, and this is the whole bug this page had: `containers` is a
// long-lived ref on a store shared by the entire app, so arriving here from
// anywhere in-app — or pasting a permalink into an already-open tab — meant it
// was *already* populated and never changed again. The watcher never fired, and
// the page waited on the next arbitrary SSE container event, which on a quiet
// fleet is minutes.
watch([containers, ready], resolve, { immediate: true });
</script>
