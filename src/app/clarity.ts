// Microsoft Clarity loader — session recording + heatmaps.
// Activated only when VITE_CLARITY_ID is set, so dev/preview builds stay
// untracked unless someone explicitly opts in by populating the env var.
//
// Why dynamic injection (vs a literal <script> in index.html)?
//  • The Clarity project ID lives in Vercel env, not in the repo.
//  • Vite resolves import.meta.env at build time, so each environment
//    (prod / preview / dev) can provide its own ID — or skip loading.
//  • Lets us add gating later (e.g. disable on internal/staff IPs)
//    without touching the markup.

declare global {
  interface Window {
    clarity?: {
      (...args: any[]): void;
      q?: any[];
    };
  }
}

let initialized = false;

export function initClarity(): void {
  if (initialized) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const projectId = (import.meta as any).env?.VITE_CLARITY_ID as string | undefined;
  if (!projectId) return;

  initialized = true;

  // Standard Clarity bootstrap pulled straight from their install snippet.
  // Stub the global queue so calls before the script loads still work.
  ((c: any, l: Document, a: string, r: string, i: string) => {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = `https://www.clarity.ms/tag/${i}`;
    const y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
}

// Optional: tag the recording with our own user identifier so admins can
// jump from a homeowner row into the matching Clarity session. Call from
// post-login flows.
export function clarityIdentify(userId: string, opts?: { sessionId?: string; pageId?: string; friendlyName?: string }): void {
  if (typeof window === "undefined" || !window.clarity) return;
  try {
    window.clarity("identify", userId, opts?.sessionId, opts?.pageId, opts?.friendlyName);
  } catch (_) {
    // never let analytics break the app
  }
}
