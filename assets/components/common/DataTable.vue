<template>
  <!-- The app's one table shell: a rounded, hairline-bordered surface with a
       sticky recessed header bar. The container table and the cloud search
       results had grown two different header treatments; this is the merged
       one. Rows are supplied by the caller — this owns the chrome and the sort
       interaction, nothing about the data. -->
  <div ref="scroller" class="data-table rounded-box border-base-content/10 overflow-auto border">
    <!-- No zebra. Alternating fills are a workaround for rows you can't
         otherwise tell apart; with a hairline under each row and a hover tint
         the banding is just noise laid over the data. -->
    <table class="table-md table-pin-rows table w-full" :class="{ 'table-fixed': fixed }">
      <thead>
        <tr>
          <th
            v-for="column in visibleColumns"
            :key="column.key"
            :class="[column.class, { sorted: sort.key === column.key }]"
            :aria-sort="ariaSort(column.key)"
          >
            <span v-if="column.sortable === false" class="th-label">{{ column.label }}</span>
            <button v-else type="button" class="th-label th-button" @click="toggleSort(column.key)">
              <span>{{ column.label }}</span>
              <mdi:arrow-up class="sort-arrow size-3.5" :class="{ descending: sort.direction < 0 }" />
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
    <slot name="footer" />
  </div>
</template>

<script lang="ts" setup>
export type DataTableColumn = {
  key: string;
  /** Already-translated header text. */
  label: string;
  /** Width/alignment classes for the column's <th>. */
  class?: string;
  /** Columns opt out of sorting; they still render a header cell. */
  sortable?: boolean;
  /** Hidden columns are skipped entirely (e.g. narrow viewports). */
  hidden?: boolean;
};

export type DataTableSort = {
  /** null means "no column sort" — the caller's natural order. */
  key: string | null;
  direction: 1 | -1;
};

const {
  columns,
  fixed = false,
  tristate = false,
} = defineProps<{
  columns: DataTableColumn[];
  /** table-fixed, for tables whose column widths are declared up front. */
  fixed?: boolean;
  /** When set, a third click on the sorted column clears the sort. */
  tristate?: boolean;
}>();

const sort = defineModel<DataTableSort>("sort", { required: true });

const scroller = useTemplateRef<HTMLElement>("scroller");
// Exposed so callers can hang infinite scroll off the table's own scroll box.
defineExpose({ scroller });

const visibleColumns = computed(() => columns.filter((column) => !column.hidden));

function toggleSort(key: string) {
  if (sort.value.key !== key) {
    sort.value = { key, direction: 1 };
  } else if (sort.value.direction === 1) {
    sort.value = { key, direction: -1 };
  } else {
    sort.value = tristate ? { key: null, direction: 1 } : { key, direction: 1 };
  }
}

function ariaSort(key: string): "ascending" | "descending" | "none" {
  if (sort.value.key !== key) return "none";
  return sort.value.direction === 1 ? "ascending" : "descending";
}
</script>

<style scoped>
@reference "@/main.css";

th {
  @apply bg-base-200 border-base-content/10 border-b;
}

.th-label {
  @apply text-base-content/60 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider whitespace-nowrap uppercase transition-colors;
}

.th-button {
  @apply hover:text-base-content cursor-pointer;
}

/* The arrow is a hint on hover and a statement once the column is sorted, so an
   unsorted header stays quiet without hiding that it can be sorted at all. */
.sort-arrow {
  @apply opacity-0 transition-[opacity,transform] duration-200;
}

.th-button:hover .sort-arrow {
  @apply opacity-35;
}

th.sorted {
  @apply border-primary border-b-2;
}

th.sorted .th-label {
  @apply text-base-content;
}

th.sorted .sort-arrow {
  @apply text-primary opacity-100;
}

.sort-arrow.descending {
  @apply rotate-180;
}

tbody :deep(tr) {
  @apply border-base-content/8 border-b transition-colors duration-150;
}

/* The last row's separator would draw a second line right on the surface's own
   bottom edge. */
tbody :deep(tr:last-child) {
  @apply border-b-0;
}

tbody :deep(tr:hover) {
  @apply bg-base-content/4;
}

tbody :deep(td) {
  @apply py-3 whitespace-nowrap;
}

tbody :deep(a) {
  @apply hover:text-primary transition-colors;
}
</style>
