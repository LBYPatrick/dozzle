<template>
  <!-- One presentation, not two.
       This page rendered NotificationsPanel under its own `text-2xl font-bold`
       header while Settings → Notifications rendered the identical panel as a
       drill-in with a `text-base font-semibold` one: the same content, two
       navigation models and two type treatments. The route survives — links and
       bookmarks point at it — but it now opens the panel where it lives, so
       there is one notifications screen in the app.

       A visible state while that happens, because a route that renders nothing
       is indistinguishable from a route that is broken. -->
  <PageWithLinks>
    <div class="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center">
      <mdi:bell-outline class="text-base-content/30 size-8" />
      <p class="type-body text-base-content/60">{{ $t("notifications.title") }}</p>
      <button type="button" class="btn btn-sm" @click="openPanel">
        {{ $t("settings.open-notifications") }}
      </button>
    </div>
  </PageWithLinks>
</template>

<script lang="ts" setup>
import { useSettingsModal } from "@/composable/settingsModal";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { showToast } = useToast();
const { openSettings, openSubview } = useSettingsModal();

setTitle(t("notifications.title"));

function openPanel() {
  openSettings("visual");
  openSubview("notifications");
}

function consumeHighlight(value: unknown) {
  if (typeof value !== "string" || !value) return false;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return false;
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

onMounted(() => {
  const hash = window.location.hash;
  if (hash === "#cloudLinked") {
    router.replace({ hash: "" });
  }

  if (!consumeHighlight(route.query.highlight) && route.query.action === "create-alert") {
    router.replace({ query: {} });
  }

  openPanel();
});
</script>
