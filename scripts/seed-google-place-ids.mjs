#!/usr/bin/env node
// One-off: seed Google Place IDs for designers so the Google Reviews stack
// (Outscraper-backed) can fetch reviews per slug.
//
// INPUT
//   scripts/google-place-ids.csv  (header optional)
//   slug,url
//   studio-foo,https://www.google.com/maps/place/...
//   studio-bar,ChIJN1t_tDeuEmsRUsoyG83frY4   ← place ID also accepted
//
// USAGE
//   node scripts/seed-google-place-ids.mjs           # dry-run, prints what would be sent
//   node scripts/seed-google-place-ids.mjs --apply   # POSTs each row to /seed

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8").split("\n")
    .map((l) => l.split("=")).filter((p) => p[0]),
);
const PROJECT_ID = env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!PROJECT_ID || !ANON_KEY) {
  console.error("Missing VITE_SUPABASE_PROJECT_ID / VITE_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const API = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-4808de5e`;
const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");

const csvPath = join(root, "scripts/google-place-ids.csv");
let csv;
try {
  csv = readFileSync(csvPath, "utf8");
} catch {
  console.error(`Missing ${csvPath}. Create it with rows: slug,url`);
  process.exit(1);
}

const rows = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  .map((line) => {
    const [slug, ...rest] = line.split(",");
    return { slug: slug.trim(), value: rest.join(",").trim() };
  })
  .filter((r) => r.slug && r.value && r.slug.toLowerCase() !== "slug");

if (rows.length === 0) {
  console.error("No rows found in CSV.");
  process.exit(1);
}

const looksLikePlaceId = (v) => /^ChIJ[A-Za-z0-9_-]+$/.test(v);

console.log(`${APPLY ? "Seeding" : "Dry-run"} ${rows.length} designers…`);
let ok = 0;
let fail = 0;

for (const { slug, value } of rows) {
  const body = looksLikePlaceId(value) ? { placeId: value } : { url: value };
  if (!APPLY) {
    console.log(`  ${slug} → ${JSON.stringify(body)}`);
    continue;
  }
  try {
    const res = await fetch(`${API}/google-reviews/${encodeURIComponent(slug)}/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`  ✗ ${slug}: HTTP ${res.status} ${json.error || ""}`);
      fail++;
    } else {
      const data = json.data || {};
      console.log(`  ✓ ${slug}: source=${data.source} count=${data.reviews?.length ?? 0} placeId=${json.placeId}`);
      ok++;
    }
  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
    fail++;
  }
}

if (APPLY) console.log(`Done. ${ok} ok, ${fail} failed.`);
else console.log(`(re-run with --apply to actually seed)`);
