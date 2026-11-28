import { lexicalJsonToHtml } from "@/modules/product.management/utils/richTextEditorUtils";
import { withDOM } from "@lexical/headless/dom";
import { expect, test } from "bun:test";

const serializedState = {
  root: {
    type: "root",
    version: 1,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [
          {
            type: "text",
            version: 1,
            text: "Saved product details",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
        direction: null,
        format: "",
        indent: 0,
      },
    ],
  },
};

test("hydrates legacy plain text as escaped editor HTML", () => {
  expect(lexicalJsonToHtml("Electronics <details> & more")).toBe(
    "<p>Electronics &lt;details&gt; &amp; more</p>",
  );
});

test("preserves editor HTML formatting and image dimensions", () => {
  const html =
    '<p><span style="color: red">Saved</span><img src="/image.png" width="640" height="480"></p>';
  expect(lexicalJsonToHtml(html)).toBe(html);
});

test("continues to hydrate serialized Lexical editor states", () => {
  expect(withDOM(() => lexicalJsonToHtml(serializedState))).toContain(
    "Saved product details",
  );
  expect(
    withDOM(() => lexicalJsonToHtml(JSON.stringify(serializedState))),
  ).toContain("Saved product details");
});
