import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

export function useDesignerData(slug: string | undefined) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const preview = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
    fetch(`${API}/designers/${slug}${preview ? "?preview=1" : ""}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          console.log("Designer API data loaded:", slug, json.data ? "OK" : "EMPTY");
          setData(json.data || null);
          setLoading(false);
          // Fire-and-forget profile view tracking. Dedupe per browser session
          // per slug so navigating back to a profile doesn't double-count.
          // Server also dedupes per IP per day. Skipped on preview / admin
          // routes — those readers shouldn't pollute the count.
          if (!preview && typeof window !== "undefined" && !window.location.pathname.startsWith("/admin")) {
            const sessionKey = `designer-view-tracked:${slug}`;
            try {
              if (!sessionStorage.getItem(sessionKey)) {
                sessionStorage.setItem(sessionKey, "1");
                fetch(`${API}/designer-views/${encodeURIComponent(slug)}`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${publicAnonKey}` },
                }).catch(() => {});
              }
            } catch {}
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch designer data:", err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { data, loading, error };
}
