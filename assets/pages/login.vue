<template>
  <!-- The first screen anyone sees, and the last one the design system reached.
       What it was: `input-bordered border-2` with daisyUI's own
       `has-[:focus]:input-primary` (a 2px frame and a second focus system, both
       contradicting main.css, which states outright that focus is a shift in the
       control's own surface and not a ring); `card shadow-2xl` instead of the
       shared sheet material; an `uppercase` button label, which Apple never
       does and nothing else in this app does; `<label>` nested inside `<label>`,
       which is invalid and left the visible field names as unassociated spans;
       `autofocus` on both fields at once; and an error that reddened the
       username box alone though the failure is for the credential pair. -->
  <div class="glass-surface glass-surface-thick w-96 shrink-0 rounded-2xl p-6">
    <form action="" method="post" @submit.prevent="onLogin" ref="form" class="flex flex-col gap-5">
      <div class="flex flex-col gap-1 text-center">
        <h1 class="type-title">{{ $t("title.login") }}</h1>
      </div>

      <!-- Real labels, really associated. The field name is above the box
           rather than inside it, so it survives being typed over — a
           placeholder that vanishes on the first keystroke is not a label. -->
      <div class="flex flex-col gap-1.5">
        <label for="login-username" class="type-caption text-base-content/70 font-medium">
          {{ $t("label.username") }}
        </label>
        <TextField
          id="login-username"
          ref="usernameField"
          name="username"
          autocomplete="username"
          :placeholder="$t('label.username')"
          :disabled="loading"
          :invalid="error"
          :clearable="false"
          required
          v-model="username"
        >
          <template #leading><mdi:account /></template>
        </TextField>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="login-password" class="type-caption text-base-content/70 font-medium">
          {{ $t("label.password") }}
        </label>
        <TextField
          id="login-password"
          type="password"
          name="password"
          autocomplete="current-password"
          :placeholder="$t('label.password')"
          :disabled="loading"
          :invalid="error"
          :clearable="false"
          required
          v-model="password"
        >
          <template #leading><mdi:key /></template>
        </TextField>
      </div>

      <!-- One message, for the pair, announced when it appears. Reddening only
           the username box said the username was wrong, which is not something
           the server tells us and not something we should imply. -->
      <p
        v-if="error"
        class="text-error type-caption flex items-center gap-1.5"
        role="alert"
        aria-live="polite"
        data-testid="login-error"
      >
        <mdi:alert-circle-outline class="size-4 shrink-0" />
        {{ $t("error.invalid-auth") }}
      </p>

      <button class="btn btn-primary" type="submit" :disabled="loading">
        <span class="loading loading-spinner loading-sm" v-if="loading"></span>
        {{ $t("button.login") }}
      </button>
    </form>
  </div>
</template>

<script lang="ts" setup>
import TextField from "@/components/common/TextField.vue";

const { t } = useI18n();

setTitle(t("title.login"));

const error = ref(false);
const loading = ref(false);
const form = ref<HTMLFormElement>();
const username = ref("");
const password = ref("");
const usernameField = useTemplateRef<InstanceType<typeof TextField>>("usernameField");
const params = new URLSearchParams(window.location.search);

// One focus target, not two. Both fields carried `autofocus`, which is a race
// the browser resolves by whichever it sees last — so the caret landed in the
// password box on an empty form.
onMounted(() => usernameField.value?.focus());

// Typing again is the user retracting the failed attempt; the error should not
// outlive it.
watch([username, password], () => (error.value = false));

async function onLogin() {
  loading.value = true;
  const response = await fetch(withBase("/api/token"), {
    body: new FormData(form.value),
    method: "POST",
  });

  if (response.status == 200) {
    error.value = false;
    if (params.has("redirectUrl")) {
      window.location.href = withBase(params.get("redirectUrl")!);
    } else {
      window.location.href = withBase("/");
    }
  } else {
    error.value = true;
  }
  loading.value = false;
}
</script>
<route lang="yaml">
meta:
  layout: splash
</route>
