// Ad/source attribution capture. When a visitor lands via a tagged ad link
// (e.g. ?utm_campaign=...&ad_id=...), we persist those params first-touch in
// localStorage, then attach them to each lead at submit time via the
// `lead-attribution` edge function. The admin Lead Magnets table reads them
// back. No-op for visitors who arrive without ad params.
import { projectId, publicAnonKey } from "/utils/supabase/info";

const STORE_KEY = "network-attribution";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // first-touch window
const PARAM_FIELDS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "ad_id", "adset_id", "campaign_id", "fbclid", "gclid",
];

type Stored = { params: Record<string, string>; landingPath: string; referrer: string; ts: number };

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

// Call once on app load. First-touch: an existing, non-expired entry is kept so
// the original ad that brought the visitor in is the one credited.
export function captureAttribution(): void {
  try {
    const sp = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    for (const f of PARAM_FIELDS) {
      const v = sp.get(f);
      if (v) params[f] = v.slice(0, 300);
    }
    if (Object.keys(params).length === 0) return; // no ad params on this URL
    const existing = read();
    if (existing && Date.now() - existing.ts < TTL_MS) return; // keep first touch
    const rec: Stored = {
      params,
      landingPath: (window.location.pathname + window.location.search).slice(0, 300),
      referrer: (document.referrer || "").slice(0, 300),
      ts: Date.now(),
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(rec));
  } catch {
    /* localStorage unavailable — capture is best-effort */
  }
}

export function getAttribution(): Record<string, string> | null {
  const r = read();
  return r ? { ...r.params, landingPath: r.landingPath, referrer: r.referrer } : null;
}

// Fire-and-forget: tie the captured ad to a freshly submitted lead (by email or
// lead id). Safe to call unconditionally — no-op when nothing was captured.
export function recordAttribution(key: string, email?: string, leadId?: string): void {
  try {
    const r = read();
    if (!r || Object.keys(r.params).length === 0) return;
    if (!email && !leadId) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/lead-attribution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
      body: JSON.stringify({
        key,
        email: email || "",
        leadId: leadId || "",
        attribution: { ...r.params, landingPath: r.landingPath, referrer: r.referrer },
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}
