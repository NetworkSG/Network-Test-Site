/**
 * Meta Pixel + Conversions API helper.
 *
 * The base pixel script is loaded in index.html (init only — no automatic
 * PageView). Conversion events fire from app code at form-completion points
 * via `trackLead`.
 *
 * Every Lead is now sent TWICE, deduplicated by a shared `event_id`:
 *   1) Browser pixel  — fbq('track','Lead', …, { eventID })
 *   2) Server-side CAPI mirror — POST /capi-lead, which forwards to Meta's
 *      Conversions API. This recovers leads the browser pixel loses to ad
 *      blockers / iOS. Meta de-dupes the pair by event_id, so you don't get
 *      double-counting.
 *
 * Each Lead carries `value` + `currency` (SGD) so Meta can model ROAS, and a
 * `source` tag so forms are distinguishable in Events Manager. Pass `email` /
 * `phone` when the form has them — the server hashes them (SHA-256) for
 * stronger ad-match quality; raw PII is sent only over HTTPS and never stored.
 */

import { projectId, publicAnonKey } from "/utils/supabase/info";

// Estimated value of a single lead, in SGD. Placeholder — tune to your
// actual average lead value (CAC / close-rate based) when you have it.
const DEFAULT_LEAD_VALUE_SGD = 50;
const LEAD_CURRENCY = "SGD";
const CAPI_ENDPOINT = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e/capi-lead`;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type LeadOpts = {
  /** Override the lead value (defaults to DEFAULT_LEAD_VALUE_SGD). */
  value?: number;
  /** Raw email — hashed server-side for ad matching. */
  email?: string;
  /** Raw phone — hashed server-side for ad matching. */
  phone?: string;
};

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const m = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// Use the _fbc cookie if the pixel already wrote it; otherwise reconstruct it
// from an `fbclid` in the URL so the very first ad click still matches.
function deriveFbc(): string {
  try {
    const cookie = readCookie("_fbc");
    if (cookie) return cookie;
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : "";
  } catch {
    return "";
  }
}

function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Fire-and-forget POST to the server-side Conversions API relay.
function sendCapiLead(payload: Record<string, unknown>): void {
  try {
    fetch(CAPI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let analytics break the form flow */
  }
}

export function trackLead(source: string, opts: LeadOpts = {}): void {
  if (typeof window === "undefined") return;
  const value = opts.value ?? DEFAULT_LEAD_VALUE_SGD;
  const eventId = newEventId();

  // 1) Browser pixel — tagged with eventID so Meta dedupes it with the server event.
  try {
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", { source, value, currency: LEAD_CURRENCY }, { eventID: eventId });
    }
  } catch {
    /* never let analytics break the form flow */
  }

  // 2) Server-side Conversions API mirror (recovers blocked / iOS leads).
  sendCapiLead({
    eventId,
    source,
    value,
    currency: LEAD_CURRENCY,
    email: opts.email,
    phone: opts.phone,
    eventSourceUrl: window.location.href,
    fbp: readCookie("_fbp"),
    fbc: deriveFbc(),
  });
}
