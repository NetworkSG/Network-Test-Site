import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

let lastSend = 0;
const MIN_INTERVAL = 2000; // throttle to 1 error / 2s / tab

interface ErrorPayload {
  message: string;
  stack?: string;
  url: string;
}

function report(payload: ErrorPayload) {
  const now = Date.now();
  if (now - lastSend < MIN_INTERVAL) return;
  lastSend = now;

  try {
    fetch(`${API}/client-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        message: (payload.message || "").slice(0, 500),
        stack: (payload.stack || "").slice(0, 2000),
        url: payload.url || (typeof location !== "undefined" ? location.pathname : ""),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let reporter crash the page
  }
}

/**
 * Hook window error + unhandledrejection once per session.
 * Errors get POSTed to /client-error so the admin Debug panel can surface them.
 */
export function initErrorReporter() {
  if (typeof window === "undefined") return;
  if ((window as any).__errorReporterInit) return;
  if (typeof navigator !== "undefined" && /HeadlessChrome|bot|crawler|spider/i.test(navigator.userAgent)) return;
  (window as any).__errorReporterInit = true;

  window.addEventListener("error", (e: ErrorEvent) => {
    report({
      message: e.message || "Unknown error",
      stack: e.error?.stack,
      url: typeof location !== "undefined" ? location.pathname + location.search : "",
    });
  });

  window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
    const reason: any = e.reason;
    report({
      message: String(reason?.message || reason || "Unhandled rejection").slice(0, 500),
      stack: reason?.stack,
      url: typeof location !== "undefined" ? location.pathname + location.search : "",
    });
  });
}
