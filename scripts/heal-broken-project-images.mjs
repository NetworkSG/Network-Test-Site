#!/usr/bin/env node
// One-off: heal broken hero/gallery URLs in designer_sections.projects by
// copying the healthy URL set from the corresponding designer_projects row.
//
// Why: an earlier incident wiped some Supabase storage objects. The legacy
// designer_sections KV (which the live page reads from) ended up with 404
// hero/gallery URLs, but the newer designer_projects table still has
// healthy images[] for the same projects. Match by Qanvast source URL,
// copy URLs over, write back.
//
// USAGE
//   read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
//   node scripts/heal-broken-project-images.mjs            # dry-run
//   node scripts/heal-broken-project-images.mjs --apply    # write changes
//
// FLAGS
//   --apply              Default is dry-run.
//   --slug=<slug>        Restrict to one designer.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8").split("\n")
    .map((l) => l.split("=")).filter((p) => p[0]),
);
const PROJECT_ID = env.VITE_SUPABASE_PROJECT_ID;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY in env."); process.exit(1); }

const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const SLUG = (process.argv.slice(2).find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const isOurUrl = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);
async function head(url) {
  try { const r = await fetch(url, { method: "HEAD" }); return r.ok; }
  catch { return false; }
}
function normalizeQanvast(u) {
  if (typeof u !== "string") return "";
  // strip trailing slash + query string for forgiving comparison
  return u.replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
}

// ── load both tables ────────────────────────────────────────────────────
let secsQuery = sb.from("designer_sections").select("slug, data").eq("section", "projects");
if (SLUG) secsQuery = secsQuery.eq("slug", SLUG);
const { data: secs, error: secErr } = await secsQuery;
if (secErr) { console.error("read designer_sections:", secErr.message); process.exit(1); }

let dpQuery = sb.from("designer_projects").select("designer_slug, title, source_url, drive_url, images");
if (SLUG) dpQuery = dpQuery.eq("designer_slug", SLUG);
const { data: dpRows, error: dpErr } = await dpQuery;
if (dpErr) { console.error("read designer_projects:", dpErr.message); process.exit(1); }

// Index designer_projects by (slug, normalized URL) and (slug, normalized title)
const byUrl = new Map();
const byTitle = new Map();
for (const r of dpRows || []) {
  const urls = [r.source_url, r.drive_url].filter(Boolean).map(normalizeQanvast);
  for (const u of urls) byUrl.set(`${r.designer_slug}|${u}`, r);
  if (r.title) byTitle.set(`${r.designer_slug}|${(r.title||"").toLowerCase().trim()}`, r);
}

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN (pass --apply to commit)"}`);
console.log(`Designers in scope: ${secs?.length || 0}`);
console.log(`designer_projects rows in scope: ${dpRows?.length || 0}`);
console.log("");

const stats = { designers: 0, projectsScanned: 0, healed: 0, noMatch: 0, noBroken: 0, written: 0 };

for (const sec of secs || []) {
  const slug = sec.slug;
  const list = Array.isArray(sec.data) ? sec.data : [];
  if (list.length === 0) continue;

  let mutated = false;
  const newList = [];
  let designerHealed = 0;

  for (const p of list) {
    stats.projectsScanned++;
    const urls = [];
    if (typeof p.image === "string") urls.push(p.image);
    for (const g of (Array.isArray(p.gallery) ? p.gallery : [])) {
      if (typeof g?.src === "string") urls.push(g.src);
    }
    const ourUrls = urls.filter(isOurUrl);
    if (ourUrls.length === 0) { newList.push(p); continue; }

    const checks = await Promise.all(ourUrls.map(head));
    const anyBroken = checks.includes(false);
    if (!anyBroken) { newList.push(p); stats.noBroken++; continue; }

    // Match to designer_projects
    const driveKey = normalizeQanvast(p.driveUrl || p.sourceUrl || "");
    const titleKey = (p.name || p.title || "").toLowerCase().trim();
    const match = (driveKey && byUrl.get(`${slug}|${driveKey}`))
                || (titleKey && byTitle.get(`${slug}|${titleKey}`));

    if (!match || !Array.isArray(match.images) || match.images.length === 0) {
      console.log(`  ✗ [${slug}] ${p.name || p.title}: BROKEN but no healthy match in designer_projects`);
      stats.noMatch++;
      newList.push(p);
      continue;
    }

    // Verify the healthy images actually return 200 (defensive — they should already)
    const sampleOk = await head(match.images[0]);
    if (!sampleOk) {
      console.log(`  ✗ [${slug}] ${p.name || p.title}: match found but images[0] also 404`);
      stats.noMatch++;
      newList.push(p);
      continue;
    }

    const newImage = match.images[0];
    const newGallery = match.images.slice(1).map((src) => ({ src, caption: "" }));
    console.log(`  ✓ [${slug}] ${p.name || p.title}: heal hero + ${newGallery.length} gallery items (was ${p.gallery?.length || 0})`);
    newList.push({ ...p, image: newImage, gallery: newGallery });
    mutated = true;
    designerHealed++;
    stats.healed++;
  }

  if (mutated) {
    stats.designers++;
    if (APPLY) {
      const { error: updErr } = await sb.from("designer_sections")
        .update({ data: newList })
        .eq("slug", slug).eq("section", "projects");
      if (updErr) console.log(`    write error: ${updErr.message}`);
      else { stats.written++; console.log(`    [WRITTEN] ${slug} (${designerHealed} healed)`); }
    }
  }
}

console.log("");
console.log("──");
console.log(`Projects scanned:  ${stats.projectsScanned}`);
console.log(`Already healthy:   ${stats.noBroken}`);
console.log(`Healed:            ${stats.healed}`);
console.log(`No match found:    ${stats.noMatch}`);
console.log(`Designers touched: ${stats.designers}`);
if (APPLY) console.log(`Designer rows written: ${stats.written}`);
else console.log("(dry-run — pass --apply to commit)");
