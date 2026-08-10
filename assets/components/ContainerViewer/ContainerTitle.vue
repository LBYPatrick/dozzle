<template>
  <div class="@container flex min-w-0 flex-1 items-center gap-1.5 md:gap-2">
    <!-- A pushpin, because pinning is what this does: it lifts the container out
         of its host branch into the sidebar's Pinned section. It was a star,
         which reads as "favourite" and matched nothing at the other end. Filled
         and red when pinned, outline at rest, and the same icon marks the
         sidebar section it feeds. -->
    <label
      class="swap pin-swap size-4 shrink-0 place-content-center"
      :title="pinned ? $t('tooltip.unpin-container') : $t('tooltip.pin-container')"
    >
      <input type="checkbox" v-model="pinned" :aria-label="$t('tooltip.pin-container')" />
      <ph:push-pin-fill class="swap-on text-pin block size-4" />
      <ph:push-pin class="swap-off block size-4" />
    </label>
    <!-- The pin is the title bar's primary gesture and was a 16px target — the
         smallest in the app. It keeps its drawn size (a bigger pin would
         dominate a row it only annotates) and gains a 44px hit area centred on
         it, per the ::before below. -->

    <div class="inline-flex min-w-0 items-center text-sm">
      <div class="breadcrumbs min-w-0 overflow-x-visible p-0 font-mono">
        <ul>
          <li v-if="config.hosts.length > 1" class="font-thin max-md:hidden">
            {{ container.hostLabel }}
          </li>
          <li class="min-w-0">
            <template v-if="otherContainers.length === 0"
              ><span class="block truncate">{{ container.name }}</span></template
            >
            <!-- Same control as every other multi-container title, rather than a
                 second hand-rolled copy of it. -->
            <ContainerDropdown v-else :containers="otherContainers">{{ container.name }}</ContainerDropdown>
          </li>
        </ul>
      </div>
    </div>
    <ContainerHealth :health="container.health" v-if="container.health" />
    <VolumeWarning :container="container" />
    <Tag
      class="group hidden! cursor-pointer items-center gap-1.5 pr-1! font-mono @md:inline-flex!"
      size="small"
      role="button"
      :title="$t('toolbar.copy-image')"
      :aria-label="$t('toolbar.copy-image')"
      @click="copyImage"
    >
      <span class="truncate">{{ imageTag }}</span>
      <span
        class="bg-base-content/10 text-base-content/40 group-hover:text-base-content/70 flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors"
      >
        <mdi:content-copy class="size-3" />
      </span>
    </Tag>
  </div>
</template>

<script lang="ts" setup>
import { Container } from "@/models/Container";

const { container } = defineProps<{ container: Container }>();

const { t } = useI18n();
const { copy, copied, isSupported } = useClipboard({ legacy: true });
const { showToast } = useToast();

const imageTag = computed(() => container.image.replace(/@sha.*/, ""));

async function copyImage() {
  if (!isSupported.value) return;
  await copy(imageTag.value);
  if (copied.value) {
    showToast({ title: t("toasts.copied.title"), message: t("toasts.copied.message"), type: "info" }, { expire: 2000 });
  }
}

const pinned = computed({
  get: () => pinnedContainers.value.has(container.name),
  set: (value) => {
    if (value) {
      pinnedContainers.value.add(container.name);
    } else {
      pinnedContainers.value.delete(container.name);
    }
  },
});
const store = useContainerStore();
const { containers: allContainers } = storeToRefs(store);

const otherContainers = computed(() =>
  allContainers.value
    .filter((c) => c.name === container.name && c.id !== container.id)
    .sort((a, b) => +b.created - +a.created),
);
</script>

<style scoped>
/* A 44px hit area over a 16px glyph. Overflowing rather than reserving: the
   title row is dense, and giving the pin 44px of layout width would push the
   container name sideways for a control that only needs to be *pressable* at
   that size, not drawn at it. Sits under the glyph so it never covers the
   breadcrumb beside it. */
.pin-swap {
  position: relative;
}

.pin-swap::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}

/* Phosphor draws its pushpin on a diagonal, needle to the lower-left. Exactly 45°
   off vertical, not approximately: the needle segment of the path is
   `l-42.63 42.66`, equal run and rise. So the resting state needs no rotation at
   all — the icon already is the 45° pin lying loose, not yet pushed in — and
   pinned is a flat -45° from there, which lands the needle vertical.
 *
 * daisyUI's `swap-rotate` could not express this. It only rotates whichever icon
 * is *hidden* (45deg off, 0deg on), so both visible states sat at the icon's own
 * angle and the toggle had no directionality at all — it spun mid-transition and
 * landed where it started. Hence plain `.swap` for the crossfade and the rotation
 * driven here. */
/* Opacity belongs in this list. `transition` is a shorthand, so naming only
   `rotate` reset transition-property and dropped the crossfade daisyUI puts on
   `.swap > *` (transform, rotate, opacity) — the fill swapped instantly under a
   rotating pin. */
.pin-swap :where(.swap-on, .swap-off) {
  transition:
    rotate 280ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 200ms ease;
}

/* Both layers, not just the incoming one. Rotating only `.swap-on` meant pinning
   animated and unpinning did not: on the way back the outline pin faded in
   sitting still at its resting angle while the filled one rotated away already
   invisible. Held at the same angle in each state, the two layers read as one pin
   rotating — down as it is driven in, back up to its loose diagonal as it is
   pulled out — and the motion is the same in both directions. */
.pin-swap input:checked ~ :where(.swap-on, .swap-off) {
  rotate: -45deg;
}

@media (prefers-reduced-motion: reduce) {
  .pin-swap :where(.swap-on, .swap-off) {
    transition: none;
  }
}
</style>
