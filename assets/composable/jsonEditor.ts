// JSON editor built on CodeMirror, matching the styling used by exprEditor. The
// modules are dynamically imported so CodeMirror is only pulled in when someone
// actually opens the JSON view (e.g. the settings popup). Uses the `codemirror`
// meta-package's basicSetup so we don't depend on the un-hoisted
// @codemirror/commands package directly.
export interface JsonEditorOptions {
  parent: HTMLElement;
  initialValue: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export async function createJsonEditor(options: JsonEditorOptions) {
  const [{ EditorView }, { EditorState }, { json }, { HighlightStyle, syntaxHighlighting }, { tags }, { basicSetup }] =
    await Promise.all([
      import("@codemirror/view"),
      import("@codemirror/state"),
      import("@codemirror/lang-json"),
      import("@codemirror/language"),
      import("@lezer/highlight"),
      import("codemirror"),
    ]);

  const editorTheme = EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: "var(--color-base-content)",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
    ".cm-content": { caretColor: "var(--color-primary)" },
    ".cm-cursor": { borderLeftColor: "var(--color-primary)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "color-mix(in oklch, var(--color-primary) 25%, transparent)",
    },
    ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--color-base-200) 45%, transparent)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "color-mix(in oklch, var(--color-base-content) 45%, transparent)",
      border: "none",
    },
    ".cm-activeLineGutter": { backgroundColor: "color-mix(in oklch, var(--color-base-200) 60%, transparent)" },
  });

  // Overrides basicSetup's default highlight for the tokens JSON actually uses.
  const highlightStyle = HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--color-info)" },
    { tag: tags.string, color: "var(--color-success)" },
    { tag: tags.number, color: "var(--color-warning)" },
    { tag: tags.bool, color: "var(--color-secondary)" },
    { tag: tags.null, color: "var(--color-secondary)" },
    { tag: tags.keyword, color: "var(--color-primary)" },
  ]);

  const state = EditorState.create({
    doc: options.initialValue,
    extensions: [
      basicSetup,
      json(),
      editorTheme,
      syntaxHighlighting(highlightStyle),
      EditorState.tabSize.of(2),
      EditorState.readOnly.of(!!options.readOnly),
      EditorView.editable.of(!options.readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && options.onChange) {
          options.onChange(update.view.state.doc.toString());
        }
      }),
    ],
  });

  return new EditorView({ state, parent: options.parent });
}
