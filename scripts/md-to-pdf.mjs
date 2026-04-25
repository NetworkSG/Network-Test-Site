import { readFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const inputPath = process.argv[2] || join(root, "FAQ-DRAFT-FOR-REVIEW.md");
const outputPath = inputPath.replace(/\.md$/, ".pdf");

const md = readFileSync(inputPath, "utf8");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

// Parse the markdown into a structured AST so we can apply the editorial layout.
// Document shape we expect:
//   H1 (doc title, ignored — replaced by cover)
//   leading paragraphs (purpose / action / note) — used in cover body
//   --- divider — start of FAQ list
//   H2 "1. Question text" — each question
//     paragraphs / lists / sub-lists under it
//   --- divider — start of appendix
//   H2 "What happens after approval" — appendix
//     paragraphs / lists

const lines = md.split("\n").map((l) => l.replace(/\r$/, ""));

const blocks = []; // flat list of { type, ... }
let para = [];
let list = null; // { type: 'ul' | 'ol', items: [] }
function flushPara() {
  if (para.length) {
    blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  }
}
function flushList() {
  if (list) {
    blocks.push(list);
    list = null;
  }
}
for (const line of lines) {
  if (!line.trim()) {
    flushPara();
    flushList();
    continue;
  }
  if (/^---+$/.test(line.trim())) {
    flushPara();
    flushList();
    blocks.push({ type: "hr" });
    continue;
  }
  const h = line.match(/^(#{1,6})\s+(.+)$/);
  if (h) {
    flushPara();
    flushList();
    blocks.push({ type: "h", level: h[1].length, text: h[2] });
    continue;
  }
  const ul = line.match(/^[-*]\s+(.+)$/);
  if (ul) {
    flushPara();
    if (!list || list.type !== "ul") {
      flushList();
      list = { type: "list", listType: "ul", items: [] };
    }
    list.items.push(ul[1]);
    continue;
  }
  const ol = line.match(/^\d+\.\s+(.+)$/);
  if (ol) {
    flushPara();
    if (!list || list.listType !== "ol") {
      flushList();
      list = { type: "list", listType: "ol", items: [] };
    }
    list.items.push(ol[1]);
    continue;
  }
  flushList();
  para.push(line);
}
flushPara();
flushList();

// Walk blocks and produce three regions: cover intro (before first hr),
// FAQ entries (between first and second hr), appendix (after second hr).
const hrIdx = blocks
  .map((b, i) => (b.type === "hr" ? i : -1))
  .filter((i) => i >= 0);

const intro = blocks.slice(0, hrIdx[0] ?? blocks.length);
const faqRegion = hrIdx.length >= 2 ? blocks.slice(hrIdx[0] + 1, hrIdx[1]) : blocks.slice((hrIdx[0] ?? -1) + 1);
const appendix = hrIdx.length >= 2 ? blocks.slice(hrIdx[1] + 1) : [];

// Cover: pull the doc H1 and the leading "**Purpose:** ..." paragraphs.
const docTitle = intro.find((b) => b.type === "h" && b.level === 1)?.text || "FAQ Draft";
const introParas = intro.filter((b) => b.type === "p");

// FAQ entries: group H2 + everything until the next H2.
const faqEntries = [];
let current = null;
for (const b of faqRegion) {
  if (b.type === "h" && b.level === 2) {
    if (current) faqEntries.push(current);
    current = { heading: b.text, body: [] };
  } else if (current) {
    current.body.push(b);
  }
}
if (current) faqEntries.push(current);

// Render helpers ---------------------------------------------------------

function renderInlineRich(s) {
  // inline() handles **bold** and `code`; we already escape html.
  return inline(s);
}

function renderBody(blocks) {
  let out = "";
  for (const b of blocks) {
    if (b.type === "p") {
      out += `<p>${renderInlineRich(b.text)}</p>`;
    } else if (b.type === "list") {
      const tag = b.listType === "ol" ? "ol" : "ul";
      out += `<${tag}>`;
      for (const item of b.items) out += `<li>${renderInlineRich(item)}</li>`;
      out += `</${tag}>`;
    } else if (b.type === "h" && b.level === 3) {
      out += `<h3 class="sub-head">${renderInlineRich(b.text)}</h3>`;
    } else if (b.type === "hr") {
      out += `<hr class="hairline"/>`;
    }
  }
  return out;
}

// Split a question heading like "1. What is Network?" into number + question.
function splitQuestion(text) {
  const m = text.match(/^(\d+)\.\s+(.+)$/);
  if (m) return { num: m[1].padStart(2, "0"), text: m[2] };
  return { num: null, text };
}

// Apply the italic-fragment treatment to the cover hero.
// We hard-code the cover headline so the markdown title can stay descriptive.
const coverHeadline = `Questions, <em>answered</em>.`;
const coverSub = `A draft of the FAQ content for the Network site — prepared for review and approval.`;

// FAQ entries HTML
const faqHtml = faqEntries
  .map((e, i) => {
    const { num, text } = splitQuestion(e.heading);
    const kicker = num ? `QUESTION ${num}` : `Q${String(i + 1).padStart(2, "0")}`;
    // Italicise the last word of the question for the editorial flourish — but only
    // if the question is short enough that it doesn't overwhelm the layout.
    const words = text.replace(/[?.]$/, "").split(" ");
    const punct = text.match(/[?.]$/)?.[0] || "";
    let headlineHtml;
    if (words.length >= 4 && words.length <= 14) {
      const last = words.pop();
      headlineHtml = `${escapeHtml(words.join(" "))} <em>${escapeHtml(last)}</em>${escapeHtml(punct)}`;
    } else {
      headlineHtml = escapeHtml(text);
    }
    return `
      <article class="faq-card">
        <div class="kicker">${kicker}</div>
        <h2 class="q-headline">${headlineHtml}</h2>
        <div class="q-body">${renderBody(e.body)}</div>
      </article>
    `;
  })
  .join("\n");

// Appendix (e.g., "What happens after approval")
let appendixHtml = "";
const appendixHeading = appendix.find((b) => b.type === "h");
if (appendixHeading) {
  const rest = appendix.filter((b) => !(b === appendixHeading));
  appendixHtml = `
    <section class="appendix">
      <div class="kicker">APPENDIX · NEXT STEPS</div>
      <h2 class="appendix-headline">${renderInlineRich(appendixHeading.text)}</h2>
      <div class="appendix-body">${renderBody(rest)}</div>
    </section>
  `;
}

// Cover stats — pulled from the doc to feel anchored, like the guidelines cover.
const stats = [
  { label: "QUESTIONS", value: String(faqEntries.length), sub: "Drafted for review" },
  { label: "STATUS", value: "<em>Draft</em>", sub: "Pending approval" },
  { label: "FORMAT", value: "FAQ", sub: "JSON-LD on publish" },
  { label: "VOLUME", value: "01", sub: "APR 2026" },
];

const statsHtml = stats
  .map(
    (s) => `
      <div class="stat-cell">
        <div class="kicker">${s.label}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-sub">${s.sub}</div>
      </div>
    `,
  )
  .join("");

// Cover intro paragraphs (the "Purpose / Action needed / Note on numbers" leadsheet)
const coverIntroHtml = introParas
  .map((p) => `<p>${renderInlineRich(p.text)}</p>`)
  .join("");

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --paper: #FAFAF6;
    --paper-2: #F3F1EA;
    --paper-3: #E8E5DB;
    --ink: #0F0F0E;
    --ink-2: #1F1F1D;
    --muted: #6B6B66;
    --muted-2: #9A9A93;
    --rule: rgba(15,15,14,0.08);
    --rule-2: rgba(15,15,14,0.14);
    --accent: #E8481B;
    --accent-soft: #FFE6DC;
    --serif: 'Instrument Serif', 'EB Garamond', Georgia, serif;
    --sans: 'Geist', -apple-system, 'Helvetica Neue', sans-serif;
    --mono: 'Geist Mono', 'SF Mono', 'Menlo', monospace;
  }

  @page { size: A4; margin: 18mm 18mm 22mm; }
  @page :first { margin: 18mm 18mm 22mm; }

  * { box-sizing: border-box; }

  html, body {
    background: var(--paper);
    color: var(--ink-2);
    font-family: var(--sans);
    font-size: 10.5pt;
    line-height: 1.55;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Running header / footer rendered inside the body via fixed pos
     would only print on the first page in Chromium. Instead we use
     Puppeteer's displayHeaderFooter API (see md-to-pdf.mjs). */

  /* Cover ------------------------------------------------------- */
  .cover {
    page-break-after: always;
    break-after: page;
    min-height: calc(297mm - 40mm);
    display: flex;
    flex-direction: column;
  }

  .cover-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10pt;
  }
  .cover-brand {
    font-family: var(--serif);
    font-size: 38pt;
    line-height: 1;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .cover-dateline {
    font-family: var(--mono);
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--muted);
    text-align: right;
    line-height: 1.6;
  }
  .cover-rule { border: 0; border-top: 1px solid var(--ink); margin: 0 0 22pt; }

  .hero {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 76pt;
    line-height: 0.95;
    letter-spacing: -0.025em;
    color: var(--ink);
    margin: 8pt 0 18pt;
  }
  .hero em {
    color: var(--accent);
    font-style: italic;
  }

  .hero-sub {
    font-family: var(--serif);
    font-style: italic;
    font-size: 16pt;
    line-height: 1.35;
    color: var(--ink-2);
    max-width: 70%;
    margin: 0 0 28pt;
  }

  .cover-body {
    column-count: 2;
    column-gap: 22pt;
    color: var(--ink-2);
    font-size: 10pt;
    line-height: 1.55;
    max-width: 78%;
  }
  .cover-body p {
    margin: 0 0 8pt;
    text-align: justify;
    hyphens: auto;
  }
  .cover-body strong { color: var(--ink); font-weight: 500; }

  .cover-divider {
    margin: 22pt 0 18pt;
    display: flex;
    gap: 4pt;
  }
  .cover-divider span {
    height: 2px;
    width: 28pt;
    background: var(--rule-2);
  }
  .cover-divider span:first-child { background: var(--accent); }

  .cover-stats {
    margin-top: auto;
    border: 1px solid var(--ink);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  .stat-cell {
    padding: 14pt 14pt 16pt;
    border-right: 1px solid var(--rule-2);
  }
  .stat-cell:last-child { border-right: none; }
  .stat-value {
    font-family: var(--serif);
    font-size: 30pt;
    line-height: 1;
    color: var(--ink);
    margin: 8pt 0 6pt;
  }
  .stat-value em { color: var(--accent); font-style: italic; }
  .stat-sub {
    font-family: var(--sans);
    font-size: 8.5pt;
    color: var(--muted);
    line-height: 1.4;
  }

  /* Shared kicker --------------------------------------------- */
  .kicker {
    font-family: var(--mono);
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--accent);
    font-weight: 500;
  }

  /* FAQ section header --------------------------------------- */
  .section-intro {
    margin: 0 0 18pt;
  }
  .section-intro .kicker { color: var(--muted); }
  .section-headline {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 40pt;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin: 6pt 0 10pt;
  }
  .section-headline em { color: var(--accent); font-style: italic; }
  .section-headline-rule {
    border: 0;
    border-top: 1px solid var(--ink);
    margin: 0 0 16pt;
  }
  .section-lede {
    font-family: var(--serif);
    font-style: italic;
    font-size: 13pt;
    line-height: 1.4;
    color: var(--ink-2);
    max-width: 80%;
    margin: 0 0 12pt;
  }

  /* FAQ card -------------------------------------------------- */
  .faq-card {
    border-left: 3px solid var(--accent);
    padding: 4pt 0 10pt 16pt;
    margin: 0 0 16pt;
    break-inside: avoid;
  }
  .q-headline {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 22pt;
    line-height: 1.05;
    letter-spacing: -0.015em;
    color: var(--ink);
    margin: 4pt 0 8pt;
  }
  .q-headline em { color: var(--accent); font-style: italic; }

  .q-body { color: var(--ink-2); }
  .q-body p { margin: 0 0 7pt; }
  .q-body p:last-child { margin-bottom: 0; }
  .q-body ul, .q-body ol {
    margin: 4pt 0 8pt 0;
    padding: 0 0 0 16pt;
  }
  .q-body li { margin: 0 0 4pt; line-height: 1.5; }
  .q-body strong { color: var(--ink); font-weight: 500; }
  .q-body code {
    font-family: var(--mono);
    font-size: 9pt;
    background: var(--paper-2);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .sub-head {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 14pt;
    margin: 12pt 0 6pt;
    color: var(--ink);
  }

  /* Appendix -------------------------------------------------- */
  .appendix {
    margin-top: 24pt;
    padding: 18pt 18pt 16pt;
    background: var(--paper-2);
    border: 1px solid var(--rule-2);
    border-radius: 6px;
    break-inside: avoid;
  }
  .appendix .kicker { color: var(--muted); }
  .appendix-headline {
    font-family: var(--serif);
    font-weight: 400;
    font-size: 22pt;
    line-height: 1.05;
    letter-spacing: -0.015em;
    margin: 4pt 0 10pt;
    color: var(--ink);
  }
  .appendix-body p { margin: 0 0 7pt; }
  .appendix-body ol, .appendix-body ul { margin: 4pt 0 8pt 16pt; padding: 0; }
  .appendix-body li { margin: 0 0 4pt; }

  /* Hairline rule used between groupings */
  hr.hairline {
    border: 0;
    border-top: 1px solid var(--rule);
    margin: 12pt 0;
  }
</style>
</head>
<body>

<section class="cover">
  <header class="cover-meta">
    <div class="cover-brand">Network</div>
    <div class="cover-dateline">
      <div>FAQ · APR 2026</div>
      <div>FOR REVIEW</div>
    </div>
  </header>
  <hr class="cover-rule"/>

  <h1 class="hero">${coverHeadline}</h1>
  <p class="hero-sub">${coverSub}</p>

  <div class="cover-body">
    ${coverIntroHtml}
  </div>

  <div class="cover-divider"><span></span><span></span><span></span><span></span></div>

  <div class="cover-stats">
    ${statsHtml}
  </div>
</section>

<section class="section-intro">
  <div class="kicker">§ 01 · FAQ</div>
  <h2 class="section-headline">The <em>questions</em>.</h2>
  <hr class="section-headline-rule"/>
  <p class="section-lede">${faqEntries.length} questions, drafted for review. Each will be published as visible content and embedded as FAQPage structured data.</p>
</section>

${faqHtml}

${appendixHtml}

</body>
</html>`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: "networkidle0" });

const headerTemplate = `
  <div style="
    width:100%;
    padding: 0 18mm;
    font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
    font-size: 7.5pt;
    color: #6B6B66;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
  ">
    <span>N · NETWORK · FAQ</span>
    <span>FOR REVIEW · APR 2026</span>
  </div>
`;

const footerTemplate = `
  <div style="
    width:100%;
    padding: 0 18mm;
    font-family: 'Geist Mono', 'SF Mono', Menlo, monospace;
    font-size: 7.5pt;
    color: #6B6B66;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
  ">
    <span>NETWORK SINGAPORE</span>
    <span>INTERNAL · FAQ DRAFT</span>
    <span>P. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>
`;

await page.pdf({
  path: outputPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
  margin: { top: "18mm", bottom: "20mm", left: "18mm", right: "18mm" },
});

await browser.close();

console.log(`✓ ${outputPath}`);
