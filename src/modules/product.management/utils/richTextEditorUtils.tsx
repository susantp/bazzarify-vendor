import { nodes } from "@/components/blocks/editor-x/nodes";
import { BlockFormatDropDown } from "@/components/editor/plugins/toolbar/block-format-toolbar-plugin";
import { FormatBulletedList } from "@/components/editor/plugins/toolbar/block-format/format-bulleted-list";
import { FormatCheckList } from "@/components/editor/plugins/toolbar/block-format/format-check-list";
import { FormatHeading } from "@/components/editor/plugins/toolbar/block-format/format-heading";
import { FormatNumberedList } from "@/components/editor/plugins/toolbar/block-format/format-numbered-list";
import { FormatParagraph } from "@/components/editor/plugins/toolbar/block-format/format-paragraph";
import { FormatQuote } from "@/components/editor/plugins/toolbar/block-format/format-quote";
import { BlockInsertPlugin } from "@/components/editor/plugins/toolbar/block-insert-plugin";
import { InsertImage } from "@/components/editor/plugins/toolbar/block-insert/insert-image";
import { ElementFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/element-format-toolbar-plugin";
import { FontFormatToolbarPlugin } from "@/components/editor/plugins/toolbar/font-format-toolbar-plugin";
import { ToolbarPlugin } from "@/components/editor/plugins/toolbar/toolbar-plugin";
import { escapeHtmlFragment } from "@/modules/product.management/utils/sanitizeRichHtml";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $insertNodes, SerializedEditorState } from "lexical";
import { useEffect, useRef } from "react";

export const microtask =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (fn: () => void) => Promise.resolve().then(fn);

export const ToolbarUI = ({
  variant,
  enableImages = false,
}: {
  variant: "full" | "minimal" | "none";
  enableImages: boolean;
}) =>
  variant === "none" ? null : variant === "minimal" ? (
    <ToolbarPlugin>
      {() => (
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto border-b p-2">
          <FontFormatToolbarPlugin format="bold" />
          <BlockFormatDropDown>
            <FormatBulletedList />
          </BlockFormatDropDown>
        </div>
      )}
    </ToolbarPlugin>
  ) : (
    <ToolbarPlugin>
      {() => (
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto border-b p-2">
          <FontFormatToolbarPlugin format="bold" />
          <BlockFormatDropDown>
            <FormatParagraph />
            <FormatHeading levels={["h1", "h2", "h3"]} />
            <FormatNumberedList />
            <FormatBulletedList />
            <FormatCheckList />
            <FormatQuote />
          </BlockFormatDropDown>
          <ElementFormatToolbarPlugin />
          {enableImages && (
            <BlockInsertPlugin>
              <InsertImage />
            </BlockInsertPlugin>
          )}
        </div>
      )}
    </ToolbarPlugin>
  );

export default function HtmlHydrationPlugin({
  html,
  onApplied,
}: {
  html: string | undefined;
  onApplied?: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const lastApplied = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (typeof html !== "string") return;
    if (html === lastApplied.current) return;

    // Apply after mount to avoid SSR→CSR mismatch
    const parser = new DOMParser();
    const dom = parser.parseFromString(html || "<p></p>", "text/html");

    editor.update(() => {
      const created = $generateNodesFromDOM(editor, dom);
      $getRoot().clear();
      $insertNodes(created);
      lastApplied.current = html;
      onApplied?.(html);
    });
  }, [editor, html, onApplied]);

  return null;
}
export function lexicalJsonToHtml(
  json: string | SerializedEditorState | undefined,
): string {
  if (json === undefined) return "";
  const serialized = typeof json === "string" ? json : JSON.stringify(json);
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized);
  } catch {
    return toEditorHtml(serialized);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("root" in parsed) ||
    typeof parsed.root !== "object" ||
    parsed.root === null
  ) {
    return toEditorHtml(serialized);
  }

  const editor = createHeadlessEditor({
    namespace: "ProductRichText",
    nodes,
    onError: (error) =>
      console.error("[product-authoring] rich-text parse failed", error.name),
  });

  try {
    editor.setEditorState(editor.parseEditorState(serialized));
    return editor.getEditorState().read(() => $generateHtmlFromNodes(editor));
  } catch (error) {
    console.error(
      "[product-authoring] rich-text parse failed",
      error instanceof Error ? error.name : typeof error,
    );
    return toEditorHtml(serialized);
  }
}

const SUPPORTED_EDITOR_HTML_TAG =
  /<\/?(?:p|br|strong|b|em|i|u|s|ul|ol|li|h[1-6]|blockquote|code|pre|a|img|span|div)(?:\s|\/|>)/i;

const toEditorHtml = (value: string): string => {
  if (value === "" || SUPPORTED_EDITOR_HTML_TAG.test(value)) {
    return value;
  }

  return `<p>${escapeHtmlFragment(value)}</p>`;
};
