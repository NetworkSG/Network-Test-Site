// PostHog loader — session recording, heatmaps, and product analytics.
// Replaces the previous Microsoft Clarity integration.
//
// Mirrors the old clarity.ts pattern: a small, env-gated initializer so each
// environment can point at its own project (or skip loading). The key + host
// fall back to the live Network project so it works out of the box, and can be
// overridden via VITE_POSTHOG_KEY / VITE_POSTHOG_HOST (e.g. EU region).
//
// The project ("phc_…") key is a PUBLIC client-side key by design — it ships in
// the browser bundle, so committing the default is safe (same as the Supabase
// anon key in utils/supabase/info.tsx).
import posthog from "posthog-js";

const DEFAULT_KEY = "phc_Cwzs6mc4somZj2hGrxSjdHcTb5K3vbuqbBwfsuLfu5yB";
const DEFAULT_HOST = "https://us.i.posthog.com"; // set VITE_POSTHOG_HOST to https://eu.i.posthog.com for EU

let initialized = false;

export function initPostHog(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;

  // Only track real production traffic. Skip the Vite dev server (PROD is false
  // under `vite dev`) and any localhost host, so developer sessions never reach
  // the live PostHog project. Set VITE_POSTHOG_FORCE=1 to override locally.
  const forced = ((import.meta as any).env?.VITE_POSTHOG_FORCE as string | undefined) === "1";
  const isProd = (import.meta as any).env?.PROD === true;
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  if (!forced && (!isProd || isLocal)) return;

  const key = ((import.meta as any).env?.VITE_POSTHOG_KEY as string | undefined) || DEFAULT_KEY;
  const apiHost = ((import.meta as any).env?.VITE_POSTHOG_HOST as string | undefined) || DEFAULT_HOST;
  if (!key) return;

  initialized = true;

  posthog.init(key, {
    api_host: apiHost,
    person_profiles: "identified_only", // only create person profiles for identified users
    capture_pageview: true,
    capture_pageleave: true,
    // Session replay is controlled by the project's settings in PostHog;
    // posthog-js records when enabled there. Nothing extra needed here.
  });
}

// Tag the current session/person with our user id so we can jump from a record
// into the matching PostHog session replay. Call from post-login flows.
export function posthogIdentify(userId: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !initialized) return;
  try {
    posthog.identify(userId, props);
  } catch (_) {
    // never let analytics break the app
  }
}

export { posthog };
