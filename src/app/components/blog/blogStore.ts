// Supabase-backed blog store. The seed data in posts.ts is the starting
// set; admin edits, drafts, deletions, and view counts are persisted on
// the edge function (`/blog/state`, `/blog/save`, etc.) so the data
// survives reloads, syncs across devices, and is shared across visitors.
//
// localStorage is still used as a *cache* — it backs the very first paint
// before the network round-trip resolves, and survives offline reloads.
// On every fetch we overwrite the cache with the canonical server state.

import { projectId, publicAnonKey } from "/utils/supabase/info";
import { POSTS as SEED, type Post, type BlogCategory } from "./posts";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const CACHE_KEY = "network-blog-cache-v2";
const VIEWED_KEY = "network-blog-viewed-v1";

interface RemoteState {
  overrides: Record<string, Post>;
  tombstones: string[];
  status: Record<string, "draft" | "published">;
  views: Record<string, number>;
}

const EMPTY_STATE: RemoteState = {
  overrides: {},
  tombstones: [],
  status: {},
  views: {},
};

let memState: RemoteState = readCache();
let fetchInFlight: Promise<RemoteState> | null = null;
let initialised = false;

function readCache(): RemoteState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return {
      overrides: parsed.overrides || {},
      tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
      status: parsed.status || {},
      views: parsed.views || {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

function writeCache(state: RemoteState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("network-blog-changed"));
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
}

async function fetchState(): Promise<RemoteState> {
  if (fetchInFlight) return fetchInFlight;
  fetchInFlight = (async () => {
    try {
      const res = await fetch(`${API}/blog/state`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const next: RemoteState = {
        overrides: data.overrides || {},
        tombstones: Array.isArray(data.tombstones) ? data.tombstones : [],
        status: data.status || {},
        views: data.views || {},
      };
      memState = next;
      writeCache(next);
      emitChange();
      return next;
    } catch (err) {
      console.warn("[blogStore] fetch failed, using cache", err);
      return memState;
    } finally {
      fetchInFlight = null;
    }
  })();
  return fetchInFlight;
}

/** Triggers a background refresh from the server. Returns immediately so
 *  callers can render from cache; subscribers fire when the data lands. */
export function ensureLoaded(): void {
  if (initialised) return;
  initialised = true;
  fetchState();
}

/** Forces a refresh; used after admin writes to pull canonical state. */
export async function refresh(): Promise<void> {
  await fetchState();
}

export type AdminPost = Post & {
  status: "draft" | "published";
  views: number;
};

/** Merges seed + server overrides + tombstones into the working list,
 *  then layers status + view counts. */
export function getAllPostsForAdmin(): AdminPost[] {
  const state = memState;
  const tombstoned = new Set(state.tombstones);
  const seedSlugs = new Set(SEED.map((p) => p.slug));
  const merged: Post[] = [];

  for (const seed of SEED) {
    if (tombstoned.has(seed.slug)) continue;
    merged.push(state.overrides[seed.slug] ?? seed);
  }
  for (const [slug, post] of Object.entries(state.overrides)) {
    if (!seedSlugs.has(slug)) merged.push(post);
  }

  merged.sort((a, b) => (a.publishedOn < b.publishedOn ? 1 : -1));

  return merged.map((p) => ({
    ...p,
    status: state.status[p.slug] ?? "published",
    views: state.views[p.slug] ?? 0,
  }));
}

export function getPublishedPosts(): Post[] {
  return getAllPostsForAdmin()
    .filter((p) => p.status === "published")
    .map(({ status: _s, views: _v, ...post }) => post);
}

export function findPublishedPost(slug: string): Post | undefined {
  return getPublishedPosts().find((p) => p.slug === slug);
}

/** Returns whether a slug is part of the shipped seed — needed so the
 *  delete API knows whether to tombstone or just remove. */
function isSeedSlug(slug: string): boolean {
  return SEED.some((p) => p.slug === slug);
}

/** Optimistically updates local state, then writes to the server. */
async function mutate(
  optimistic: (s: RemoteState) => RemoteState,
  request: () => Promise<Response>
) {
  const before = memState;
  memState = optimistic(before);
  writeCache(memState);
  emitChange();
  try {
    const res = await request();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Pull canonical state so we stay in sync if another writer raced us.
    await fetchState();
  } catch (err) {
    console.warn("[blogStore] mutation failed, rolling back", err);
    memState = before;
    writeCache(memState);
    emitChange();
    throw err;
  }
}

export function savePost(post: Post, status: "draft" | "published") {
  return mutate(
    (s) => ({
      ...s,
      overrides: { ...s.overrides, [post.slug]: post },
      status: { ...s.status, [post.slug]: status },
      tombstones: s.tombstones.filter((t) => t !== post.slug),
    }),
    () =>
      fetch(`${API}/blog/save`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ post, status }),
      })
  );
}

export function deletePost(slug: string) {
  const seed = isSeedSlug(slug);
  return mutate(
    (s) => {
      const overrides = { ...s.overrides };
      delete overrides[slug];
      const status = { ...s.status };
      delete status[slug];
      const views = { ...s.views };
      delete views[slug];
      const tombstones = seed
        ? Array.from(new Set([...s.tombstones, slug]))
        : s.tombstones;
      return { ...s, overrides, status, views, tombstones };
    },
    () =>
      fetch(`${API}/blog/delete`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slug, isSeed: seed }),
      })
  );
}

export function setPostStatus(slug: string, status: "draft" | "published") {
  return mutate(
    (s) => ({ ...s, status: { ...s.status, [slug]: status } }),
    () =>
      fetch(`${API}/blog/status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ slug, status }),
      })
  );
}

/** Records a view, deduped per session in localStorage so refresh-spam
 *  doesn't inflate the count. Best-effort — never throws. */
export async function bumpView(slug: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(VIEWED_KEY);
    const seen: Record<string, number> = raw ? JSON.parse(raw) : {};
    const last = seen[slug] || 0;
    // Throttle: don't count the same slug twice within 30 minutes.
    if (Date.now() - last < 30 * 60 * 1000) return;
    seen[slug] = Date.now();
    window.localStorage.setItem(VIEWED_KEY, JSON.stringify(seen));
  } catch {
    /* private mode / quota — record anyway */
  }
  try {
    const res = await fetch(`${API}/blog/view`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ slug }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && typeof data.views === "number") {
        memState = { ...memState, views: { ...memState.views, [slug]: data.views } };
        writeCache(memState);
        emitChange();
      }
    }
  } catch (err) {
    console.warn("[blogStore] view bump failed", err);
  }
}

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function subscribe(handler: () => void): () => void {
  ensureLoaded();
  if (typeof window === "undefined") return () => {};
  const onCustom = () => handler();
  const onStorage = (e: StorageEvent) => {
    if (e.key === CACHE_KEY) {
      // Another tab updated the cache; pull it into memory.
      memState = readCache();
      handler();
    }
  };
  window.addEventListener("network-blog-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("network-blog-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Cost Guides",
  "Designer Tips",
  "Renovation Process",
  "Style & Layout",
  "Protect Your Money",
];
