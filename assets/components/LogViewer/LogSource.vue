<template>
  <!-- Where a line came from.
       Two filled tags at a fixed w-30/md:w-40 each used to reserve 20rem of every
       row for this, clipped whatever did not fit, and stated context at the
       volume of content. Now: a colour mark, and the names at the log's own size.

       Nothing is shrunk and nothing is elided. Both were tried and both were
       wrong — 0.72em of an already-0.8em list is a 9px label, and an elided name
       defeats the only job the cell has, which is telling two rows apart. -->
  <div class="source flex items-center gap-1.5 font-mono" :title="title">
    <!-- Identity by colour is how a merged stream is scanned, so it stays — a
         hairline down the cell rather than a filled plate behind the text. -->
    <span class="mark w-[3px] shrink-0 self-stretch rounded-full"></span>

    <!-- Stacked, so each name gets the cell's full width instead of the two
         competing for one strip. Same size for both: the hierarchy is carried by
         tone, which costs no legibility. -->
    <div class="names flex flex-col justify-center gap-[0.15em] leading-tight">
      <span v-if="host" class="text-base-content/45 whitespace-nowrap">{{ host }}</span>
      <span v-if="containerName" class="text-base-content/85 whitespace-nowrap">{{ containerName }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { COLOR_PALETTE } from "@/components/LogViewer/RandomColorTag.vue";

const { host, containerName, colorKey } = defineProps<{
  /** Omitted when the view does not show hostnames — including when every row
      shares one host, where repeating it says nothing. */
  host?: string;
  containerName?: string;
  /** What the mark's colour is hashed from — the container id, so every line
      from one container marks the same however its name is displayed. */
  colorKey: string;
}>();

// Nothing is cut off, so this is for the pair as a unit rather than a rescue.
const title = computed(() => [host, containerName].filter(Boolean).join(" / "));

const color = computed(() => COLOR_PALETTE[Math.abs(hashCode(colorKey)) % COLOR_PALETTE.length]);
</script>

<style scoped>
.mark {
  background-color: v-bind(color);
}

/* A fixed width, so every message starts at the same x — which is what the old
   w-30/md:w-40 tags got right and two intermediate versions of this cell did
   not. It sits on the text column rather than the cell: on the cell it would
   also have to cover the colour mark and its gap, and the ~9px shortfall made
   every row overflow by a hair and size itself to its own name.

   Safe to fix rather than floor because LogList measures every name the rows
   actually reference, not just the view's scope — so nothing can exceed it and
   nothing is clipped. */
.names {
  width: calc(var(--log-source-chars, 12) * 1ch);
}

.source {
  min-height: var(--log-line, 1.45em);
}
</style>
