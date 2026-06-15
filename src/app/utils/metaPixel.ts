/**
 * Meta Pixel helper.
 *
 * The base pixel script is loaded in index.html (init only — no automatic
 * PageView). Conversion events fire from app code at form-completion points.
 *
 * `trackLead(source)` is a thin wrapper around `fbq('track', 'Lead', …)` that
 * tags every event with a `source` so we can tell which form fired it inside
 * Meta Events Manager.
 *
 * Every Lead also carries a `value` + `currency` so Meta can model ROAS —
 * without these, Events Manager flags "missing value/currency" on Lead events.
 * The value is a flat estimate of what one lead is worth to the business;
 * adjust DEFAULT_LEAD_VALUE_SGD to your real average, or pass a per-lead
 * `value` (e.g. derived from the budget tier the lead selected).
 */

// Estimated value of a single lead, in SGD. Placeholder — tune to your
// actual average lead value (CAC / close-rate based) when you have it.
const DEFAULT_LEAD_VALUE_SGD = 50;
const LEAD_CURRENCY = "SGD";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackLead(source: string, value: number = DEFAULT_LEAD_VALUE_SGD): void {
  try {
    if (typeof window === "undefined") return;
    const fbq = window.fbq;
    if (typeof fbq !== "function") return;
    fbq("track", "Lead", { source, value, currency: LEAD_CURRENCY });
  } catch {
    // Never let analytics break the form flow.
  }
}
