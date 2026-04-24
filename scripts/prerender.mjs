import { createServer } from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const PORT = 4173;

const ROUTES = [
  "/",
  "/designers",
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

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

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

    const html = await page.content();
    const textLen = await page.evaluate(() => document.getElementById("root")?.innerText.trim().length || 0);

    const outPath =
      route === "/"
        ? join(distDir, "index.html")
        : join(distDir, route, "index.html");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html);
    console.log(`  ✓ ${route.padEnd(20)} → ${outPath.replace(distDir, "dist")} (${textLen} chars of text)`);
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
