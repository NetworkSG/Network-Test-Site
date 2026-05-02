#!/usr/bin/env node
// One-off backfill: re-fetch existing Qanvast / Drive project photos at 2048px
// and replace the URLs stored in `designer_projects.images`.
//
// Saved images live in Supabase storage with random UUIDs — the originals
// (cloudfront / lh3 URLs) aren't preserved on the row, so we have to
// re-derive them from `source_url` (Qanvast page) or `drive_url` (Drive
// folder), then re-mirror at the new resolution.
//
// USAGE
//   # dry-run first (no writes), see what would happen
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/backfill-images-2048.mjs
//
//   # apply for real
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/backfill-images-2048.mjs --apply
//
//   # narrow scope while testing
//   SUPABASE_SERVICE_ROLE_KEY=… node scripts/backfill-images-2048.mjs \
//     --apply --slug=craftmakers-interior-design --limit=2
//
// FLAGS
//   --apply               Default is dry-run. Pass this to write changes.
//   --limit=N             Process at most N rows.
//   --slug=<slug>         Only this designer.
//   --only=qanvast|drive  Only one source type.
//   --keep-old            Don't delete the old image files from storage.
//
// REQUIRES
//   SUPABASE_SERVICE_ROLE_KEY  in env (NOT in .env.local — get from Supabase dashboard)
//   .env.local with VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── env ──────────────────────────────────────────────────────────────────
async function loadDotEnvLocal() {
  try {
    const txt = await readFile(join(root, ".env.local"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
await loadDotEnvLocal();

const PROJECT_ID = process.env.VITE_SUPABASE_PROJECT_ID || process.env.SUPABASE_PROJECT_ID;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROJECT_ID || !ANON_KEY) { console.error("Missing VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_ANON_KEY in .env.local"); process.exit(1); }
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var. Get it from the Supabase dashboard (Project settings → API → service_role key)."); process.exit(1); }

const SUPABASE_URL = `https://${PROJECT_ID}.supabase.co`;
const FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/make-server-4808de5e`;
const BUCKET = "make-4808de5e-designers";

// ── flags ────────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const argMap = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.includes("=")).map((a) => a.replace(/^--/, "").split("="))
);
const APPLY = args.has("--apply");
const KEEP_OLD = args.has("--keep-old");
const LIMIT = argMap.limit ? Number(argMap.limit) : Infinity;
const ONLY = argMap.only;
const SLUG = argMap.slug;

// ── clients ──────────────────────────────────────────────────────────────
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── helpers ──────────────────────────────────────────────────────────────
function isQanvastSource(row) { return /qanvast\.com/i.test(row.source_url || ""); }
function isDriveSource(row) { return /drive\.google\.com/i.test(row.drive_url || row.source_url || ""); }
function isOurStorageUrl(u) { return typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`); }
function storagePathFromPublicUrl(u) {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  return u.startsWith(prefix) ? decodeURIComponent(u.slice(prefix.length)) : null;
}

async function callFn(path, body) {
  const res = await fetch(`${FUNCTION_BASE}${path}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) throw new Error(`${path} → ${res.status}: ${json.message || JSON.stringify(json).slice(0, 200)}`);
  return json;
}

async function downloadAndUpload(sourceUrl) {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "image/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${sourceUrl} → ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (!/^image\//i.test(contentType)) throw new Error(`not an image: ${contentType}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 500) throw new Error(`too small: ${bytes.byteLength}b`);
  const ext = (contentType.split("/")[1] || "jpg").split(";")[0].replace(/[^a-z0-9]/gi, "") || "jpg";
  const filePath = `imported/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(filePath, bytes, { contentType, upsert: false });
  if (error) throw new Error(`upload: ${error.message}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filePath}`;
}

async function deleteOldFiles(oldUrls) {
  const paths = oldUrls.map(storagePathFromPublicUrl).filter(Boolean);
  if (paths.length === 0) return 0;
  const { error } = await sb.storage.from(BUCKET).remove(paths);
  if (error) console.warn(`  cleanup warning: ${error.message}`);
  return paths.length;
}

// ── per-source backfills ────────────────────────────────────────────────
async function backfillQanvastRow(row) {
  const scrape = await callFn("/qanvast-scrape", { url: row.source_url });
  const newSourceUrls = (scrape.imported?.[0]?.images || []).filter((u) => /\/2048-width$/.test(u));
  if (newSourceUrls.length === 0) throw new Error("scrape returned no 2048-width URLs");
  const mirrored = [];
  for (const u of newSourceUrls) {
    const m = await downloadAndUpload(u);
    mirrored.push(m);
  }
  return mirrored;
}

async function backfillDriveRow(row) {
  const driveUrl = row.drive_url || row.source_url;
  const preview = await callFn("/firm-onboarding/drive-folder-preview", { url: driveUrl });
  const fileIds = (preview.images || []).map((x) => x.id).filter(Boolean);
  if (fileIds.length === 0) throw new Error("drive folder returned no images");
  const mirrored = [];
  for (const id of fileIds) {
    const r = await callFn("/firm-onboarding/ingest-drive-image", { fileId: id });
    if (r.url) mirrored.push(r.url);
  }
  if (mirrored.length === 0) throw new Error("no drive images ingested");
  return mirrored;
}

// ── main ─────────────────────────────────────────────────────────────────
console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY-RUN (no writes — pass --apply to commit)"}`);
console.log(`Filter: only=${ONLY || "any"}, slug=${SLUG || "any"}, limit=${LIMIT === Infinity ? "all" : LIMIT}, keepOld=${KEEP_OLD}`);
console.log("");

let q = sb.from("designer_projects")
  .select("id, designer_slug, title, source_url, drive_url, images")
  .order("submitted_at", { ascending: false });
if (SLUG) q = q.eq("designer_slug", SLUG);
const { data: rows, error } = await q;
if (error) { console.error("query error:", error.message); process.exit(1); }

const stats = { total: rows?.length || 0, qanvast: 0, drive: 0, skipped: 0, ok: 0, failed: 0, deletedFiles: 0 };
let processed = 0;

for (const row of rows || []) {
  if (processed >= LIMIT) break;
  if (!Array.isArray(row.images) || row.images.length === 0) { stats.skipped++; continue; }

  const qanvast = isQanvastSource(row);
  const drive = !qanvast && isDriveSource(row);
  if (!qanvast && !drive) { stats.skipped++; continue; }
  if (ONLY === "qanvast" && !qanvast) { stats.skipped++; continue; }
  if (ONLY === "drive" && !drive) { stats.skipped++; continue; }

  processed++;
  const tag = qanvast ? "qanvast" : "drive";
  const label = `[${row.designer_slug}] ${(row.title || "").slice(0, 60)}`;
  console.log(`(${processed}) ${tag}  ${label}`);
  console.log(`  current: ${row.images.length} images, source=${(row.source_url || row.drive_url || "").slice(0, 80)}`);

  if (!APPLY) {
    console.log(`  would re-fetch and re-mirror`);
    if (qanvast) stats.qanvast++; else stats.drive++;
    continue;
  }

  try {
    const newImages = qanvast ? await backfillQanvastRow(row) : await backfillDriveRow(row);
    console.log(`  re-mirrored ${newImages.length} images`);

    const oldOurUrls = row.images.filter(isOurStorageUrl);
    const { error: updErr } = await sb.from("designer_projects").update({ images: newImages }).eq("id", row.id);
    if (updErr) throw new Error(`update row: ${updErr.message}`);

    if (!KEEP_OLD) {
      const removed = await deleteOldFiles(oldOurUrls);
      stats.deletedFiles += removed;
      console.log(`  cleaned up ${removed} old files`);
    }
    if (qanvast) stats.qanvast++; else stats.drive++;
    stats.ok++;
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    stats.failed++;
  }
}

console.log("");
console.log("──");
console.log(`Total rows in table: ${stats.total}`);
console.log(`Processed: ${processed}  (qanvast=${stats.qanvast}, drive=${stats.drive})`);
console.log(`Skipped (no images / unknown source / filter): ${stats.skipped}`);
if (APPLY) {
  console.log(`OK: ${stats.ok}, FAILED: ${stats.failed}`);
  if (!KEEP_OLD) console.log(`Old files deleted from storage: ${stats.deletedFiles}`);
} else {
  console.log("(dry-run — no writes performed; pass --apply to commit)");
}
