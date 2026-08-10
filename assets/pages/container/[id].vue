<template>
  <ContainerLog :id show-title :scrollable="pinnedLogs.length > 0" v-if="currentContainer" />
  <!-- A dead end with no way out, same as the 404 was: one sentence, no link.
       §16 Wayfinding — every screen has to answer "how do I get out of here".
       `dvh` rather than `screen` so it does not run under the iOS URL bar. -->
  <div v-else-if="ready" class="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-4 text-center">
    <ph:magnifying-glass class="text-base-content/30 size-8" />
    <div class="flex flex-col gap-1">
      <h1 class="type-title">{{ $t("error.container-not-found") }}</h1>
      <p class="type-caption text-base-content/60">{{ $t("error.page-not-found-hint") }}</p>
    </div>
    <router-link :to="{ name: '/' }" class="btn btn-sm btn-primary">
      {{ $t("button.back-to-dashboard") }}
    </router-link>
  </div>
</template>

<script lang="ts" setup>
import { type Container } from "@/models/Container";
const route = useRoute("/container/[id]");
const id = toRef(() => route.params.id);
const containerStore = useContainerStore();
const currentContainer = containerStore.currentContainer(id);
const { ready } = storeToRefs(containerStore);
const pinnedLogsStore = usePinnedLogsStore();
const { pinnedLogs } = storeToRefs(pinnedLogsStore);
const { containers: allContainers } = storeToRefs(containerStore) as unknown as { containers: Ref<Container[]> };
const { showToast } = useToast();
const { t } = useI18n();
const router = useRouter();

watchEffect(() => {
  if (ready.value) {
    if (currentContainer.value) {
      setTitle(currentContainer.value.name);
    } else {
      setTitle("Not Found");
    }
  }
});

const redirectTrigger = ref(false);
watch(currentContainer, () => (redirectTrigger.value = false));

watchEffect(() => {
  if (redirectTrigger.value) return;
  if (automaticRedirect.value === "none") return;
  if (!currentContainer.value) return;
  if (currentContainer.value.state === "running") return;
  if (Date.now() - +currentContainer.value.finishedAt > 5 * 60 * 1000) return;

  const nextContainer = allContainers.value
    .filter(
      (c) =>
        c.startedAt > currentContainer.value.startedAt &&
        c.name === currentContainer.value.name &&
        c.host === currentContainer.value.host,
    )
    .sort((a, b) => +a.created - +b.created)[0];

  if (!nextContainer) return;

  if (automaticRedirect.value === "delayed") {
    redirectTrigger.value = true;
    showToast(
      {
        title: t("alert.similar-container-found.title"),
        message: t("alert.similar-container-found.message", { containerId: nextContainer.id }),
        type: "info",
        action: {
          label: t("button.cancel"),
          handler: () => {
            showToast(
              {
                title: t("alert.redirected.title"),
                message: t("alert.redirected.message", { containerId: nextContainer.id }),
                type: "info",
              },
              { expire: 5000 },
            );
            router.push({ name: "/container/[id]", params: { id: nextContainer.id } });
          },
        },
      },
      { timed: 4000 },
    );
  } else {
    router.push({ name: "/container/[id]", params: { id: nextContainer.id } });
    showToast(
      {
        title: t("alert.redirected.title"),
        message: t("alert.redirected.message", { containerId: nextContainer.id }),
        type: "info",
      },
      { expire: 3000 },
    );
  }
});
</script>
<route lang="yaml">
meta:
  menu: host
</route>
