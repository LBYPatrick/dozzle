<template>
  <div ref="parent" class="h-full w-full overflow-hidden text-left"></div>
</template>

<script lang="ts" setup>
import { createJsonEditor } from "@/composable/jsonEditor";
import type { EditorView } from "@codemirror/view";

const { modelValue, readOnly = false } = defineProps<{ modelValue: string; readOnly?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const parent = ref<HTMLElement>();
let view: EditorView | undefined;
let disposed = false;

onMounted(async () => {
  if (!parent.value) return;
  const created = await createJsonEditor({
    parent: parent.value,
    initialValue: modelValue,
    readOnly,
    onChange: (value) => emit("update:modelValue", value),
  });
  // The dynamic import can resolve after the component was already torn down
  // (e.g. the dialog closed quickly); destroy it instead of leaking a detached
  // EditorView.
  if (disposed) {
    created.destroy();
    return;
  }
  view = created;
});

// Keep the editor in sync when the value is replaced from outside (e.g. the
// visual form edits a setting, or an import replaces the whole document).
watch(
  () => modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  },
);

onBeforeUnmount(() => {
  disposed = true;
  view?.destroy();
});
</script>
