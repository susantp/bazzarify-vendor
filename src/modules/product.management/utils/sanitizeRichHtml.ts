/**
 * Allowlist-based HTML sanitizer for display of rich-text product fields
 * (description, highlights, box_items).
 *
 * Accepted inputs:
 *  - HTML string produced by our Lexical editor (`$generateHtmlFromNodes`)
 *  - Lexical `SerializedEditorState` JSON (older records or hand-built payloads)
 *  - `null` / `undefined` / anything else → empty string
 *
 * Design invariants:
 *  - MUST be environment-agnostic: same output on Node SSR and the browser, so
 *    `dangerouslySetInnerHTML` doesn't trigger a React hydration mismatch.
 *    Therefore this module must NOT depend on `DOMParser`, `document`, or any
 *    other browser-only API.
 *  - MUST be an allowlist. Anything not explicitly allowed is stripped.
 *
 * This is not a full DOMPurify replacement; it is a conservative allowlist for
 * READ-ONLY display surfaces. When the editor emits a richer tag/attribute set,
 * extend the lists here deliberately.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "a",
  "img",
  "span",
  "div",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title"],
  span: ["class"],
  div: ["class"],
  p: ["class"],
  ul: ["class"],
  ol: ["class"],
  li: ["class"],
};

const VOID_TAGS = new Set(["br", "img"]);

const SAFE_URL_RE = /^(https?:|mailto:|tel:|\/|#)/i;

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*?)?)\s*(\/?)>/g;

const ATTR_RE =
  /([a-zA-Z_:][a-zA-Z0-9_:.\-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;

const COMMENT_RE = /<!--[\s\S]*?-->/g;

const isSafeUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed === "") return false;
  return SAFE_URL_RE.test(trimmed);
};

const escapeAttrValue = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const parseAttrs = (raw: string): [string, string][] => {
  const out: [string, string][] = [];
  if (!raw) return out;
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    out.push([name, value]);
  }
  return out;
};

const renderAllowedAttrs = (tag: string, attrs: [string, string][]): string => {
  const allowlist = ALLOWED_ATTRS[tag] ?? [];
  if (allowlist.length === 0) return "";
  const parts: string[] = [];
  let hasBlankTarget = false;
  for (const [name, value] of attrs) {
    if (!allowlist.includes(name)) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    if (name === "target" && value === "_blank") hasBlankTarget = true;
    parts.push(`${name}="${escapeAttrValue(value)}"`);
  }
  if (tag === "a" && hasBlankTarget) {
    parts.push('rel="noopener noreferrer"');
  }
  return parts.length > 0 ? " " + parts.join(" ") : "";
};

const sanitizeHtmlString = (html: string): string => {
  if (html === "") return "";
  const withoutComments = html.replace(COMMENT_RE, "");
  TAG_RE.lastIndex = 0;
  return withoutComments.replace(
    TAG_RE,
    (_full, slash: string, rawTag: string, attrsStr: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      const isClosing = slash === "/";
      if (isClosing) {
        if (VOID_TAGS.has(tag)) return "";
        return `</${tag}>`;
      }
      const attrs = renderAllowedAttrs(tag, parseAttrs(attrsStr));
      if (VOID_TAGS.has(tag)) return `<${tag}${attrs} />`;
      return `<${tag}${attrs}>`;
    },
  );
};

/**
 * Best-effort text extraction from a Lexical SerializedEditorState-shaped
 * object. Used only as a fallback when a rich-text field is stored as the
 * editor's JSON state rather than an HTML string.
 */
const extractTextFromSerializedState = (value: unknown): string => {
  if (value === null || typeof value !== "object") return "";
  const lines: string[] = [];

  const visit = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const maybe = node as Record<string, unknown>;

    if (typeof maybe.text === "string") {
      if (lines.length === 0) lines.push("");
      lines[lines.length - 1] += maybe.text;
    }

    const children = maybe.children;
    if (Array.isArray(children)) {
      const isBlock =
        typeof maybe.type === "string" &&
        ["paragraph", "heading", "listitem", "quote"].includes(
          maybe.type as string,
        );
      if (isBlock) lines.push("");
      for (const child of children) visit(child);
    }

    const root = maybe.root;
    if (root && typeof root === "object") visit(root);
  };

  visit(value);
  return lines.filter((line) => line.length > 0).join("\n");
};

export const escapeHtmlFragment = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Normalize any shape we may receive for a rich-text field (HTML string,
 * Lexical SerializedEditorState object, or accidental other JSON) into a
 * plain HTML string that downstream sanitization can handle safely.
 */
const toHtmlSource = (input: unknown): string => {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    const text = extractTextFromSerializedState(input);
    if (!text) return "";
    return text
      .split("\n")
      .map((line) => `<p>${escapeHtmlFragment(line)}</p>`)
      .join("");
  }
  return "";
};

export const sanitizeRichHtml = (input: unknown): string =>
  sanitizeHtmlString(toHtmlSource(input));

export const isRichHtmlEmpty = (input: unknown): boolean => {
  const source = toHtmlSource(input);
  if (source === "") return true;
  const stripped = source
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return stripped === "";
};
