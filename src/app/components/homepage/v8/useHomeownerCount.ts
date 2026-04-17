import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

// Module-level cache so the fetch only fires once across all components
let cached: number | null = null;
let fetching: Promise<number> | null = null;

function doFetch(): Promise<number> {
  if (!fetching) {
    fetching = fetch(`${API}/homeowner-count`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const count = typeof d.count === "number" ? d.count : 3214;
        cached = count;
        return count;
      })
      .catch(() => 3214);
  }
  return fetching;
}

/**
 * Returns the live homeowner count (formatted string like "2,629").
 * Falls back to "3,214" while loading or on error.
 */
export function useHomeownerCount(): string {
  const [count, setCount] = useState<number>(cached ?? 3214);

  useEffect(() => {
    if (cached !== null) {
      setCount(cached);
      return;
    }
    let cancelled = false;
    doFetch().then((c) => { if (!cancelled) setCount(c); });
    return () => { cancelled = true; };
  }, []);

  return count.toLocaleString();
}

/** Whether the live count has been loaded (for showing live indicator). */
export function useHomeownerCountLoaded(): boolean {
  const [loaded, setLoaded] = useState(cached !== null);

  useEffect(() => {
    if (cached !== null) { setLoaded(true); return; }
    let cancelled = false;
    doFetch().then(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  return loaded;
}
