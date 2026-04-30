/**
 * Meta Pixel helper.
 *
 * The base pixel script is loaded in index.html (init only — no automatic
 * PageView). Conversion events fire from app code at form-completion points.
 *
 * `trackLead(source)` is a thin wrapper around `fbq('track', 'Lead', …)` that
 * tags every event with a `source` so we can tell which form fired it inside
 * Meta Events Manager.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackLead(source: string): void {
  try {
    if (typeof window === "undefined") return;
    const fbq = window.fbq;
    if (typeof fbq !== "function") return;
    fbq("track", "Lead", { source });
  } catch {
    // Never let analytics break the form flow.
  }
}
