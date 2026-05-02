#!/usr/bin/env node
// One-off: heal broken designers.data.images.cover URLs.
// When the cover file is 404, replaces it with the first healthy image from
// the designer's projects (designer_sections.projects[N].image / coverImage /
// gallery[0].src).
//
// USAGE
//   read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
//   node scripts/heal-broken-designer-covers.mjs            # dry-run
//   node scripts/heal-broken-designer-covers.mjs --apply

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

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

const isOurUrl = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);
async function head(u) { try { const r = await fetch(u, {method:"HEAD"}); return r.ok; } catch { return false; } }

function pickProjectThumb(p) {
  if (!p || typeof p !== "object") return "";
  for (const k of ["image", "coverImage", "featuredImage"]) {
    const v = p[k];
    if (typeof v === "string" && v) return v;
  }
  const g0 = Array.isArray(p.gallery) ? p.gallery[0] : null;
  if (typeof g0 === "string") return g0;
  if (g0 && typeof g0 === "object" && typeof g0.src === "string") return g0.src;
  return "";
}

const [{ data: designers }, { data: secs }] = await Promise.all([
  sb.from("designers").select("slug, name, data"),
  sb.from("designer_sections").select("slug, data").eq("section", "projects"),
]);

const projectsBySlug = new Map();
for (const s of secs || []) projectsBySlug.set(s.slug, Array.isArray(s.data) ? s.data : []);

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
console.log(`Designers: ${designers?.length || 0}`);
console.log("");

const stats = { ok: 0, missing: 0, healed: 0, failed: 0, written: 0 };

for (const d of designers || []) {
  const data = d.data || {};
  const cover = data.images?.cover;
  const isMissing = !cover || typeof cover !== "string";
  const isBroken = cover && isOurUrl(cover) && !(await head(cover));

  if (!isMissing && !isBroken) { stats.ok++; continue; }
  if (isMissing) stats.missing++;

  // Find a healthy replacement from projects
  const projects = projectsBySlug.get(d.slug) || [];
  let replacement = "";
  for (const p of projects) {
    const candidate = pickProjectThumb(p);
    if (candidate && await head(candidate)) { replacement = candidate; break; }
  }

  if (!replacement) {
    console.log(`  ✗ [${d.slug}] no healthy project image to use (cover ${isMissing ? "missing" : "404"})`);
    stats.failed++;
    continue;
  }

  console.log(`  ✓ [${d.slug}] ${isMissing ? "missing" : "broken"} cover → ${replacement.slice(-50)}`);
  stats.healed++;

  if (APPLY) {
    const newData = { ...data, images: { ...(data.images || {}), cover: replacement } };
    const { error } = await sb.from("designers").update({ data: newData }).eq("slug", d.slug);
    if (error) console.log(`    write error: ${error.message}`);
    else stats.written++;
  }
}

console.log("");
console.log("──");
console.log(`OK:           ${stats.ok}`);
console.log(`Missing:      ${stats.missing}`);
console.log(`Healed:       ${stats.healed}`);
console.log(`No project to use: ${stats.failed}`);
if (APPLY) console.log(`Written: ${stats.written}`);
else console.log("(dry-run — pass --apply to commit)");
