#!/usr/bin/env node
// One-off: for any project in designer_sections.projects where coverImage
// or featuredImage points to a 404, copy the (healthy) `image` field over.
//
// USAGE
//   read -s SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
//   node scripts/heal-cover-images.mjs            # dry-run
//   node scripts/heal-cover-images.mjs --apply
//   node scripts/heal-cover-images.mjs --apply --slug=divineandglitz

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
const SLUG = (process.argv.slice(2).find((a) => a.startsWith("--slug=")) || "").split("=")[1];

const isOurUrl = (u) => typeof u === "string" && u.startsWith(`${SUPABASE_URL}/storage/v1/object/public/`);
async function head(u) { try { const r = await fetch(u, {method:"HEAD"}); return r.ok; } catch { return false; } }

let q = sb.from("designer_sections").select("slug, data").eq("section", "projects");
if (SLUG) q = q.eq("slug", SLUG);
const { data: secs, error } = await q;
if (error) { console.error(error.message); process.exit(1); }

console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN (pass --apply to commit)"}`);
console.log(`Designers in scope: ${secs?.length || 0}`);
console.log("");

const stats = { scanned: 0, healed: 0, written: 0, skipped: 0 };
const FIELDS = ["coverImage", "featuredImage"];

for (const sec of secs || []) {
  const slug = sec.slug;
  const list = Array.isArray(sec.data) ? sec.data : [];
  let mutated = false;
  const newList = [];

  for (const p of list) {
    stats.scanned++;
    const updates = {};
    for (const f of FIELDS) {
      const u = p?.[f];
      if (!u || typeof u !== "string" || !isOurUrl(u)) continue;
      if (await head(u)) continue; // healthy
      // Broken — heal from `image` if that one is healthy
      const heroOk = typeof p.image === "string" && await head(p.image);
      if (heroOk) {
        updates[f] = p.image;
      } else {
        // Fall back to gallery[0].src
        const g0 = p.gallery?.[0]?.src;
        if (typeof g0 === "string" && await head(g0)) updates[f] = g0;
      }
    }
    if (Object.keys(updates).length > 0) {
      console.log(`  ✓ [${slug}] ${p.name||p.title}: heal ${Object.keys(updates).join(", ")}`);
      newList.push({ ...p, ...updates });
      stats.healed++;
      mutated = true;
    } else {
      newList.push(p);
    }
  }

  if (mutated && APPLY) {
    const { error: updErr } = await sb.from("designer_sections").update({ data: newList }).eq("slug", slug).eq("section", "projects");
    if (updErr) console.log(`    write error: ${updErr.message}`);
    else { stats.written++; console.log(`    [WRITTEN] ${slug}`); }
  }
}

console.log("");
console.log("──");
console.log(`Scanned:  ${stats.scanned}`);
console.log(`Healed:   ${stats.healed}`);
if (APPLY) console.log(`Designer rows written: ${stats.written}`);
else console.log("(dry-run — pass --apply to commit)");
