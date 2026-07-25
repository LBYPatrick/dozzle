<template>
  <PageWithLinks>
    <section>
      <div class="mb-8">
        <h2 class="text-2xl font-bold">{{ $t("notifications.title") }}</h2>
        <p class="text-base-content/60">{{ $t("notifications.description") }}</p>
      </div>

      <NotificationsPanel ref="panel" :highlight-id="highlightId" />
    </section>
  </PageWithLinks>
</template>

<script lang="ts" setup>
import NotificationsPanel from "@/components/Notification/NotificationsPanel.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { showToast } = useToast();

const highlightId = ref<number | null>(null);
const panel = useTemplateRef<InstanceType<typeof NotificationsPanel>>("panel");

function consumeHighlight(value: unknown) {
  if (typeof value !== "string" || !value) return false;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return false;
  highlightId.value = parsed;
  router.replace({ query: {} });
  showToast(
    {
      type: "info",
      message: t("notifications.default-alert-created"),
    },
    { expire: 8000 },
  );
  return true;
}

function consumeAction(action: unknown) {
  if (action !== "create-alert") return;
  router.replace({ query: {} });
  panel.value?.openCreateAlertPrefilled();
}

onMounted(() => {
  const hash = window.location.hash;
  if (hash === "#cloudLinked") {
    router.replace({ hash: "" });
  }

  if (!consumeHighlight(route.query.highlight)) {
    consumeAction(route.query.action);
  }
});

watch(
  () => route.query.highlight,
  (value) => consumeHighlight(value),
);

watch(
  () => route.query.action,
  (action) => consumeAction(action),
);
</script>
