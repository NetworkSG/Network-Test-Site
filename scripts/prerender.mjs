import { createServer } from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";
import puppeteerCore from "puppeteer-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const PORT = 4173;

// ── Externalize inlined base64 images ────────────────────────────────────────
// Blog covers (and the logo mask) can arrive as huge `data:` URIs in the live
// DOM, which puppeteer then bakes into the prerendered HTML — pushing the
// homepage past 800KB and choking crawlers / link-openers. We extract every
// data: image into a content-hashed file under dist/assets/inlined/ and rewrite
// the reference to that path. Deduped by hash (the logo used twice → one file),
// and cached across routes so each unique image is written only once.
const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
const DATA_URI_RE = /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;
const inlinedDir = join(distDir, "assets", "inlined");
const writtenAssets = new Set();
let externalizeSavings = 0;

function externalizeDataUris(html) {
  const seen = new Map(); // full data-URI string → public path
  let m;
  DATA_URI_RE.lastIndex = 0;
  while ((m = DATA_URI_RE.exec(html)) !== null) {
    const [full, mime, b64] = m;
    if (seen.has(full)) continue;
    // Skip tiny payloads — not worth a request; keep them inline.
    if (b64.length < 2048) continue;
    const ext = MIME_EXT[mime] || "bin";
    const buf = Buffer.from(b64, "base64");
    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
    const fileName = `${hash}.${ext}`;
    const publicPath = `/assets/inlined/${fileName}`;
    if (!writtenAssets.has(fileName)) {
      mkdirSync(inlinedDir, { recursive: true });
      writeFileSync(join(inlinedDir, fileName), buf);
      writtenAssets.add(fileName);
    }
    seen.set(full, publicPath);
    externalizeSavings += full.length - publicPath.length;
  }
  let out = html;
  for (const [full, publicPath] of seen) out = out.split(full).join(publicPath);
  return out;
}

const ROUTES = [
  "/",
  "/interior-designers",
  "/get-matched",
  "/cost-guide",
  "/explore",
  "/style-quiz",
  "/render-tool",
  "/floorplan3d",
  "/networkxhandshake",
];

const server = createServer((req, res) =>
  handler(req, res, {
    public: distDir,
    rewrites: [{ source: "**", destination: "/index.html" }],
  }),
);

await new Promise((resolve) => server.listen(PORT, resolve));

const isServerless = !!process.env.VERCEL || !!process.env.AWS_EXECUTION_ENV;

let browser;
if (isServerless) {
  const { default: chromium } = await import("@sparticuz/chromium");
  browser = await puppeteerCore.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
} else {
  const { default: puppeteer } = await import("puppeteer");
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

const failures = [];

for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const url = `http://localhost:${PORT}${route}`;
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return !!root && root.children.length > 0 && root.innerText.trim().length > 20;
      },
      { timeout: 15000 },
    );
    await new Promise((r) => setTimeout(r, 750));

    const rawHtml = await page.content();
    const html = externalizeDataUris(rawHtml);
    const textLen = await page.evaluate(() => document.getElementById("root")?.innerText.trim().length || 0);

    const outPath =
      route === "/"
        ? join(distDir, "index.html")
        : join(distDir, route, "index.html");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
    const rawKb = (Buffer.byteLength(rawHtml) / 1024).toFixed(0);
    const note = rawHtml.length !== html.length ? ` (was ${rawKb}KB inlined)` : "";
    console.log(`  ✓ ${route.padEnd(20)} → ${outPath.replace(distDir, "dist")} — ${kb}KB${note}, ${textLen} chars text`);
  } catch (err) {
    failures.push({ route, error: err.message });
    console.log(`  ✗ ${route.padEnd(20)} FAILED: ${err.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.log(`\nPrerendered ${ROUTES.length - failures.length}/${ROUTES.length} routes. Failed:`);
  for (const f of failures) console.log(`  - ${f.route}: ${f.error.split("\n")[0]}`);
  console.log("\n(Failed routes fall back to the SPA shell — still work for users, just not prerendered.)");
} else {
  console.log(`\n✓ All ${ROUTES.length} routes prerendered.`);
}

if (writtenAssets.size) {
  console.log(
    `\n✓ Externalized ${writtenAssets.size} inlined image(s) → dist/assets/inlined/ ` +
      `(~${(externalizeSavings / 1024).toFixed(0)}KB of base64 lifted out of HTML).`,
  );
}
