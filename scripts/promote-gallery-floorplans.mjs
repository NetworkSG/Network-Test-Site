#!/usr/bin/env node
// One-off: detect floor-plan images that are sitting inside a project's
// gallery (often the last item) and promote them to the `floorPlan` field.
// Removes the image from the gallery so it doesn't appear twice.
//
// Uses the same heuristic as src/app/utils/floor-plan-detect.ts:
//   - Downscale image to 60px wide
//   - Floor plan if: lowSat ≥ 95% AND nearWhite ≥ 40% AND dark ≥ 0.5%
//
// USAGE
//   read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
//   node scripts/promote-gallery-floorplans.mjs            # dry-run
//   node scripts/promote-gallery-floorplans.mjs --apply
//   node scripts/promote-gallery-floorplans.mjs --apply --slug=craftmakers
//
// FLAGS
//   --apply              Default is dry-run.
//   --slug=<slug>        Restrict to one designer.
//   --overwrite          Replace existing floorPlan even if it works.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8").split("\n")
    .map((l) => l.split("=")).filter((p) => p[0]),
);
const SUPABASE_URL = `https://${env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const OVERWRITE = args.has("--overwrite");
const SLUG = (process.argv.slice(2).find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const isOurUrl = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);
async function head(u) { try { const r = await fetch(u, {method:"HEAD"}); return r.ok; } catch { return false; } }

// Mirror of classifyFloorPlan in src/app/utils/floor-plan-detect.ts.
async function isFloorPlan(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    const W = 60;
    const meta = await sharp(buf).metadata();
    const H = Math.max(1, Math.round((W * (meta.height || 1)) / Math.max(1, meta.width || 1)));
    const { data } = await sharp(buf).resize(W, H, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    let lowSat = 0, nearWhite = 0, dark = 0, total = 0;
    for (let i = 0; i < data.length; i += meta.channels || 3) {
      const R = data[i], G = data[i + 1], B = data[i + 2];
      const max = Math.max(R, G, B), min = Math.min(R, G, B);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < 0.1) lowSat++;
      if (R >= 235 && G >= 235 && B >= 235) nearWhite++;
      if (max < 90) dark++;
      total++;
    }
    const t = Math.max(1, total);
    return lowSat / t >= 0.95 && nearWhite / t >= 0.4 && dark / t >= 0.005;
  } catch (err) {
    return false;
  }
}

let q = sb.from("designer_sections").select("slug, data").eq("section", "projects");
if (SLUG) q = q.eq("slug", SLUG);
const { data: secs, error } = await q;
if (error) { console.error(error.message); process.exit(1); }

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`Designers in scope: ${secs?.length || 0}`);
console.log("");

const stats = { scanned: 0, alreadyHasFp: 0, promoted: 0, noCandidate: 0, written: 0 };

// Process one project: returns the (possibly modified) project + meta about
// what happened. Pure function — does not write to the DB.
async function processProject(p) {
  const gallery = Array.isArray(p?.gallery) ? p.gallery : [];

  if (!OVERWRITE && typeof p?.floorPlan === "string" && p.floorPlan) {
    if (await head(p.floorPlan)) return { p, status: "alreadyHasFp" };
  }

  if (gallery.length === 0) return { p, status: "noGallery" };

  // Check images in parallel for speed; pick the LAST true index (closest to
  // gallery tail, where Qanvast tends to put floor plans).
  const verdicts = await Promise.all(
    gallery.map(async (g) => (typeof g?.src === "string" ? await isFloorPlan(g.src) : false)),
  );
  let foundIdx = -1;
  for (let i = verdicts.length - 1; i >= 0; i--) {
    if (verdicts[i]) { foundIdx = i; break; }
  }

  if (foundIdx === -1) return { p, status: "noCandidate" };

  const newP = {
    ...p,
    floorPlan: gallery[foundIdx].src,
    gallery: gallery.filter((_, i) => i !== foundIdx),
  };
  return { p: newP, status: "promoted", foundIdx, total: gallery.length };
}

// Bounded-concurrency mapper.
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const PROJECT_CONCURRENCY = 8;
const totalDesigners = secs?.length || 0;
let designerIdx = 0;
for (const sec of secs || []) {
  designerIdx++;
  const slug = sec.slug;
  const list = Array.isArray(sec.data) ? sec.data : [];
  const designerStart = Date.now();
  process.stdout.write(`[${designerIdx}/${totalDesigners}] ${slug} (${list.length} projects) ... `);

  const outcomes = await mapWithConcurrency(list, PROJECT_CONCURRENCY, processProject);

  let mutated = false;
  let designerPromoted = 0;
  const newList = [];
  const promoLines = [];
  for (const o of outcomes) {
    stats.scanned++;
    if (o.status === "alreadyHasFp") { stats.alreadyHasFp++; newList.push(o.p); continue; }
    if (o.status === "noCandidate") { stats.noCandidate++; newList.push(o.p); continue; }
    if (o.status === "promoted") {
      promoLines.push(`    ✓ ${(o.p.name||o.p.title||"").slice(0,55)}: gallery[${o.foundIdx}]/${o.total} → floorPlan`);
      stats.promoted++;
      designerPromoted++;
      mutated = true;
    }
    newList.push(o.p);
  }

  const elapsed = Math.round((Date.now() - designerStart) / 1000);
  if (designerPromoted === 0) {
    process.stdout.write(`done in ${elapsed}s, no promotions\n`);
  } else {
    process.stdout.write("\n");
    for (const line of promoLines) console.log(line);
    console.log(`  [done in ${elapsed}s, promoted ${designerPromoted}]`);
  }

  if (mutated && APPLY) {
    const { error: updErr } = await sb.from("designer_sections").update({ data: newList }).eq("slug", slug).eq("section", "projects");
    if (updErr) console.log(`    write error: ${updErr.message}`);
    else { stats.written++; console.log(`    [WRITTEN] ${slug}`); }
  }
}

console.log("");
console.log("──");
console.log(`Scanned:        ${stats.scanned}`);
console.log(`Already had OK floorPlan: ${stats.alreadyHasFp}`);
console.log(`Promoted from gallery:    ${stats.promoted}`);
console.log(`No floor-plan candidate:  ${stats.noCandidate}`);
if (APPLY) console.log(`Designer rows written: ${stats.written}`);
else console.log("(dry-run — pass --apply to commit)");
