// Two-way conversion between the persisted Block[] shape and the HTML
// the contenteditable rich-text editor produces. Keeps the data model
// portable while letting the editor speak native browser HTML.

import type { Block } from "./posts";

const escAttr = (s: string) => s.replace(/"/g, "&quot;");
const escText = (s: string) => s.replace(/[&<>]/g, (c) =>
  c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
);

// ─── Block → HTML ────────────────────────────────────────────────
function blockToHtml(b: Block): string {
  switch (b.type) {
    case "h2":
      return `<h2>${escText(b.text)}</h2>`;
    case "h3":
      return `<h3>${escText(b.text)}</h3>`;
    case "p":
      // Body of paragraphs is allowed to contain inline HTML produced by
      // the editor (<strong>, <em>, <u>, <a>). Editor-side input is the
      // only writer; readers render via dangerouslySetInnerHTML below.
      return `<p>${b.text}</p>`;
    case "ul":
      return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    case "ol":
      return `<ol>${b.items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
    case "quote":
      return `<blockquote>${b.text}</blockquote>`;
    case "image":
      return `<figure data-block="image"><img src="${escAttr(b.src)}" alt="${escAttr(b.alt || "")}" /></figure>`;
    case "divider":
      return `<hr data-block="divider" />`;
    default:
      return "";
  }
}

export function blocksToHtml(body: Block[]): string {
  if (!body || body.length === 0) {
    // Give the editor a single empty paragraph so the user has a
    // cursor target on first load.
    return "<p><br /></p>";
  }
  return body.map(blockToHtml).join("");
}

// ─── HTML → Block[] ──────────────────────────────────────────────
// Walks the editor's child nodes and folds each into a typed block.
// Unknown wrappers are flattened to <p> so paste from Word / Google Docs
// degrades gracefully instead of breaking the model.
export function htmlToBlocks(html: string): Block[] {
  if (typeof document === "undefined") return [];
  const root = document.createElement("div");
  root.innerHTML = html;
  const out: Block[] = [];

  const pushPara = (innerHtml: string) => {
    const trimmed = innerHtml.replace(/^\s*<br\s*\/?>\s*$/, "").trim();
    if (!trimmed) return;
    out.push({ type: "p", text: trimmed });
  };

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent || "").trim();
      if (txt) out.push({ type: "p", text: txt });
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2") {
      out.push({ type: "h2", text: el.textContent?.trim() || "" });
    } else if (tag === "h3" || tag === "h4") {
      out.push({ type: "h3", text: el.textContent?.trim() || "" });
    } else if (tag === "ul") {
      out.push({
        type: "ul",
        items: Array.from(el.querySelectorAll(":scope > li")).map((li) => (li as HTMLLIElement).innerHTML.trim()),
      });
    } else if (tag === "ol") {
      out.push({
        type: "ol",
        items: Array.from(el.querySelectorAll(":scope > li")).map((li) => (li as HTMLLIElement).innerHTML.trim()),
      });
    } else if (tag === "blockquote") {
      out.push({ type: "quote", text: el.textContent?.trim() || "" });
    } else if (tag === "figure" || tag === "img") {
      const img = tag === "img" ? (el as HTMLImageElement) : el.querySelector("img");
      if (img) out.push({ type: "image", src: img.getAttribute("src") || "", alt: img.getAttribute("alt") || "" });
    } else if (tag === "hr") {
      out.push({ type: "divider" });
    } else if (tag === "p" || tag === "div") {
      pushPara(el.innerHTML);
    } else if (tag === "br") {
      // skip standalone <br> between blocks
    } else {
      // unknown wrapper — keep its inner text as a paragraph
      pushPara(el.innerHTML || el.textContent || "");
    }
  }

  // Drop a trailing empty paragraph created by the editor's final <br>.
  while (out.length && out[out.length - 1].type === "p" && !(out[out.length - 1] as any).text) {
    out.pop();
  }
  return out;
}
