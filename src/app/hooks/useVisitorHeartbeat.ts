import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;
const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

// Pages to exclude from tracking
const EXCLUDED_PREFIXES = ["/admin", "/designer-dashboard"];

function generateVisitorId(): string {
  const stored = sessionStorage.getItem("network_visitor_id");
  if (stored) return stored;
  const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem("network_visitor_id", id);
  return id;
}

function sendHeartbeat(page: string) {
  // Don't track admin or designer dashboard pages
  if (EXCLUDED_PREFIXES.some((p) => page.startsWith(p))) return;

  const visitorId = generateVisitorId();
  fetch(`${API}/visitor-heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ visitorId, page }),
  }).catch(() => {
    // Silently ignore — never impact user experience
  });
}

export function useVisitorHeartbeat() {
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Send heartbeat on every route change
  useEffect(() => {
    sendHeartbeat(location.pathname);
  }, [location.pathname]);

  // Set up interval for ongoing heartbeats
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      sendHeartbeat(window.location.pathname);
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}
