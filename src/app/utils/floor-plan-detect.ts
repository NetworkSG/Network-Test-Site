import { useEffect, useState } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const PROXY_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e/img-proxy`;

async function fetchImageBlob(url: string): Promise<Blob> {
  // Try direct first — Supabase Storage public buckets work via fetch even
  // without explicit CORS headers. Falls back to our /img-proxy for hosts
  // (Qanvast CDN, Cloudfront) that don't allow cross-origin reads at all.
  try {
    const r = await fetch(url, { mode: "cors" });
    if (r.ok) return await r.blob();
    throw new Error(`status ${r.status}`);
  } catch {
    const proxyUrl = `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
    const r = await fetch(proxyUrl, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
    if (!r.ok) throw new Error(`proxy ${r.status}`);
    return await r.blob();
  }
}

/**
 * Module-scoped cache so multiple components share verdicts without re-fetching
 * the same image. Maps absolute URL → boolean (true = floor plan).
 */
const _cache = new Map<string, boolean>();
const _inflight = new Map<string, Promise<boolean>>();

export function classifyFloorPlan(url: string): Promise<boolean> {
  return classify(url);
}

function classify(url: string): Promise<boolean> {
  if (!url) return Promise.resolve(false);
  if (_cache.has(url)) return Promise.resolve(_cache.get(url)!);
  if (_inflight.has(url)) return _inflight.get(url)!;
  const p = (async () => {
    let objectUrl = "";
    try {
      const blob = await fetchImageBlob(url);
      objectUrl = URL.createObjectURL(blob);
      const verdict = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const w = 60;
            const h = Math.max(1, Math.round((60 * img.height) / Math.max(1, img.width)));
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext("2d", { willReadFrequently: true } as any);
            if (!ctx) return resolve(false);
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;
            // Floor plans = ink lines on paper. They have THREE features that
            // interior photos almost never combine:
            //   1. Near-grayscale (low saturation) almost everywhere.
            //   2. A large near-white background (the paper).
            //   3. A meaningful share of non-white pixels (the lines).
            //      Counts both classic black ink AND modern light-gray CAD
            //      lines (max<200), not just dark ink.
            // Bright/airy interior photos pass (1) but fail (3); dark photos
            // pass (3) but fail (2); coloured photos fail (1).
            let lowSat = 0, nearWhite = 0, ink = 0, total = 0;
            for (let i = 0; i < data.length; i += 4) {
              const R = data[i], G = data[i + 1], B = data[i + 2];
              const max = Math.max(R, G, B), min = Math.min(R, G, B);
              const sat = max === 0 ? 0 : (max - min) / max;
              if (sat < 0.1) lowSat++;
              if (R >= 235 && G >= 235 && B >= 235) nearWhite++;
              if (max < 200) ink++;
              total++;
            }
            const t = Math.max(1, total);
            const isFloorPlan =
              lowSat / t >= 0.95 &&
              nearWhite / t >= 0.4 &&
              ink / t >= 0.02;
            resolve(isFloorPlan);
          } catch { resolve(false); }
        };
        img.onerror = () => resolve(false);
        img.src = objectUrl;
      });
      _cache.set(url, verdict);
      return verdict;
    } catch {
      _cache.set(url, false);
      return false;
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      _inflight.delete(url);
    }
  })();
  _inflight.set(url, p);
  return p;
}

/** Returns true / false / null (still detecting). */
export function useIsFloorPlan(url: string): boolean | null {
  const [v, setV] = useState<boolean | null>(() => (url && _cache.has(url) ? _cache.get(url)! : null));
  useEffect(() => {
    if (!url) { setV(null); return; }
    if (_cache.has(url)) { setV(_cache.get(url)!); return; }
    let cancelled = false;
    classify(url).then((res) => { if (!cancelled) setV(res); });
    return () => { cancelled = true; };
  }, [url]);
  return v;
}

/** Given a project, returns the ordered list of candidate cover images
 *  (resolved Cover → Image → Gallery items) so callers can swap the displayed
 *  cover when the primary candidate is detected as a floor plan. */
export function projectCandidateImages(p: any): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (u: any) => {
    if (typeof u !== "string" || !u || seen.has(u)) return;
    out.push(u); seen.add(u);
  };
  push(p?.featuredImage);
  push(p?.coverImage);
  push(p?.image);
  push(p?.img);
  if (Array.isArray(p?.gallery)) {
    for (const g of p.gallery) push(g?.src ?? g);
  }
  return out;
}

/** Returns the set of URLs known (so far) to be floor plans. Re-runs as more
 *  verdicts arrive. */
export function useFloorPlanSet(urls: string[]): Set<string> {
  const key = urls.filter(Boolean).join("|");
  const [set, setSet] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const u of urls) if (u && _cache.get(u) === true) s.add(u);
    return s;
  });
  useEffect(() => {
    let cancelled = false;
    const initial = new Set<string>();
    for (const u of urls) if (u && _cache.get(u) === true) initial.add(u);
    setSet(initial);
    Promise.all(
      urls.filter(Boolean).map((u) => classify(u).then((isFp) => ({ u, isFp })))
    ).then((results) => {
      if (cancelled) return;
      const next = new Set<string>();
      for (const { u, isFp } of results) if (isFp) next.add(u);
      setSet(next);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return set;
}
