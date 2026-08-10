<template>
  <!-- `flush`: the shell reaches the sheet's edges rather than sitting in a
       padded box, and the height comes from the panel rather than a hand-tuned
       `calc(100svh - 50px)` that assumed where the header ended. -->
  <DrawerPanel :eyebrow="$t('drawer.terminal')" :title="container.name" flush>
    <template #leading><material-symbols:terminal class="size-5" /></template>
    <template #subtitle>{{ $t("label.started") }} <RelativeTime :date="container.created" /></template>

    <div ref="host" class="shell h-full px-2 pb-2"></div>
  </DrawerPanel>
</template>

<script setup lang="ts">
import { Container } from "@/models/Container";
import DrawerPanel from "@/components/common/DrawerPanel.vue";
import "@xterm/xterm/css/xterm.css";
const { container, action } = defineProps<{ container: Container; action: "attach" | "exec" }>();

const { Terminal } = await import("@xterm/xterm");
const { WebLinksAddon } = await import("@xterm/addon-web-links");
const { FitAddon } = await import("@xterm/addon-fit");

const host = useTemplateRef<HTMLDivElement>("host");
const terminal = new Terminal({
  cursorBlink: true,
  cursorStyle: "block",
  theme: {
    background: "rgba(0, 0, 0, 0)",
  },
});
terminal.loadAddon(new WebLinksAddon());
const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);

let ws: WebSocket | null = null;

function sendEvent(type: "userinput" | "resize", data?: string, width?: number, height?: number) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const event: { type: string; data?: string; width?: number; height?: number } = { type };
  if (data !== undefined) event.data = data;
  if (width !== undefined) event.width = width;
  if (height !== undefined) event.height = height;

  ws.send(JSON.stringify(event));
}

onMounted(() => {
  terminal.open(host.value!);
  fitAddon.fit();

  ws = new WebSocket(withBase(`/api/hosts/${container.host}/containers/${container.id}/${action}`));
  ws.onopen = () => {
    terminal.writeln(`Attaching to ${container.name} 🚀`);

    // Send initial resize event
    sendEvent("resize", undefined, terminal.cols, terminal.rows);

    if (action === "attach") {
      sendEvent("userinput", "\r");
    }

    terminal.onData((data) => {
      sendEvent("userinput", data);
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      sendEvent("resize", undefined, cols, rows);
    });

    terminal.focus();
  };

  ws.onmessage = (event) => terminal.write(event.data);
  ws.addEventListener("close", () => {
    terminal.writeln("⚠️ Connection closed");
  });

  // Refit from the element, not from the window.
  //
  // The panel used to be `calc(100svh - 50px)` — a height that was definite the
  // moment it existed and only ever changed with the window, so watching the
  // window was enough. Its height now comes from the drawer's flex layout,
  // which means two things a window listener cannot see: it resolves *after*
  // mount (so the `fit()` above can run against a box that is still zero-height
  // and size the terminal to 0×0), and it changes when the panel does — a
  // wrapping header, a `md`→`lg` drawer — without the window moving at all.
  //
  // A ResizeObserver on the host covers the initial layout and every later
  // change, and fires the first time as soon as the box has a size.
  useResizeObserver(host, () => requestAnimationFrame(() => fitAddon.fit()));
});

onUnmounted(() => {
  console.log("Closing WebSocket");
  terminal.dispose();
  ws?.close();
});
</script>
<style scoped>
@reference "@/main.css";

.shell {
  & :deep(.terminal) {
    @apply overflow-hidden rounded border p-2;
    &:is(.focus) {
      @apply border-primary;
    }
  }

  & :deep(.xterm-viewport) {
    @apply bg-base-200!;
  }

  & :deep(.xterm-rows) {
    @apply text-base-content;
  }

  & :deep(.xterm-cursor-block.xterm-cursor-blink) {
    animation-name: blink !important;
  }

  & :deep(.xterm-selection) {
    @apply bg-primary/30;
  }
}

@keyframes blink {
  0% {
    background-color: var(--color-base-content);
    color: #000000;
  }

  50% {
    background-color: inherit;
    color: var(--color-base-content);
  }
}

/* A blinking cursor is a 2 Hz oscillation on a bright block. Reduced motion
   holds it steady — the cursor is still drawn, so the caret position is not
   lost. */
@media (prefers-reduced-motion: reduce) {
  :deep(.xterm-cursor-blink),
  :deep(.xterm .xterm-cursor-blink-block) {
    animation: none;
  }
}
</style>
