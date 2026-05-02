#!/usr/bin/env node
// One-off: heal 404 floorPlan references in designer_sections.projects.
//
// For each project whose floorPlan URL points to a deleted file:
//   - If Qanvast still surfaces a floor plan for that project → re-mirror it.
//   - If not → clear the field (so the page stops rendering a broken thumb).
//
// USAGE
//   read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
//   node scripts/heal-broken-floorplans.mjs            # dry-run
//   node scripts/heal-broken-floorplans.mjs --apply
//   node scripts/heal-broken-floorplans.mjs --apply --slug=divineandglitz

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
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error("Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/make-server-4808de5e`;
const BUCKET = "make-4808de5e-designers";
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const SLUG = (process.argv.slice(2).find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const isOurUrl = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);
async function head(url) { try { const r = await fetch(url, {method:"HEAD"}); return r.ok; } catch { return false; } }

async function downloadAndUpload(sourceUrl) {
  const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" }, redirect: "follow" });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/png";
  if (!/^image\//i.test(contentType)) throw new Error(`not an image: ${contentType}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 500) throw new Error("too small");
  const ext = (contentType.split("/")[1] || "png").split(";")[0].replace(/[^a-z0-9]/gi, "") || "png";
  const filePath = `imported/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(filePath, bytes, { contentType, upsert: false });
  if (error) throw new Error(`upload: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

async function fetchQanvastFloorPlan(qanvastUrl) {
  const res = await fetch(`${FUNCTION_BASE}/qanvast-scrape`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: qanvastUrl }),
  });
  const json = await res.json().catch(() => ({}));
  return typeof json?.imported?.[0]?.floorPlan === "string" ? json.imported[0].floorPlan : "";
}

let secsQuery = sb.from("designer_sections").select("slug, data").eq("section", "projects");
if (SLUG) secsQuery = secsQuery.eq("slug", SLUG);
const { data: secs, error } = await secsQuery;
if (error) { console.error(error.message); process.exit(1); }

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN (pass --apply to commit)"}`);
console.log(`Designers in scope: ${secs?.length || 0}`);
console.log("");

const stats = { scanned: 0, healed: 0, cleared: 0, ok: 0, written: 0, failed: 0 };

for (const sec of secs || []) {
  const slug = sec.slug;
  const list = Array.isArray(sec.data) ? sec.data : [];
  let mutated = false;
  const newList = [];

  for (const p of list) {
    stats.scanned++;
    const fp = p?.floorPlan;
    if (!fp || typeof fp !== "string" || !isOurUrl(fp)) { newList.push(p); continue; }
    const ok = await head(fp);
    if (ok) { stats.ok++; newList.push(p); continue; }

    // Floor plan is 404. Try to re-fetch from Qanvast.
    const qUrl = p.driveUrl || p.sourceUrl || "";
    let newFp = "";
    if (/qanvast\.com/i.test(qUrl)) {
      try {
        const candidate = await fetchQanvastFloorPlan(qUrl);
        if (candidate) {
          newFp = await downloadAndUpload(candidate);
        }
      } catch (err) {
        console.log(`  ✗ [${slug}] ${p.name||p.title}: re-fetch failed (${err.message})`);
        stats.failed++;
        newList.push(p);
        continue;
      }
    }

    if (newFp) {
      console.log(`  ✓ [${slug}] ${p.name||p.title}: re-mirrored floor plan`);
      newList.push({ ...p, floorPlan: newFp });
      stats.healed++;
    } else {
      console.log(`  · [${slug}] ${p.name||p.title}: no floor plan from Qanvast → clearing field`);
      newList.push({ ...p, floorPlan: "" });
      stats.cleared++;
    }
    mutated = true;
  }

  if (mutated && APPLY) {
    const { error: updErr } = await sb.from("designer_sections").update({ data: newList }).eq("slug", slug).eq("section", "projects");
    if (updErr) { console.log(`    write error: ${updErr.message}`); stats.failed++; }
    else { stats.written++; console.log(`    [WRITTEN] ${slug}`); }
  }
}

console.log("");
console.log("──");
console.log(`Scanned:  ${stats.scanned}`);
console.log(`Already OK: ${stats.ok}`);
console.log(`Re-mirrored: ${stats.healed}`);
console.log(`Cleared (no Qanvast floor plan): ${stats.cleared}`);
console.log(`Failed: ${stats.failed}`);
if (APPLY) console.log(`Designer rows written: ${stats.written}`);
else console.log("(dry-run — pass --apply to commit)");
