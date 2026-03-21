import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { supabase } from "./supabaseClient";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { Loader2 } from "lucide-react";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/**
 * Checks if the current user is an admin.
 * If not, redirects to /admin (which has its own login gate).
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
            "X-User-Token": data.session.access_token,
          };
          const res = await fetch(`${API}/fp3d/admin/verify`, { headers });
          const json = await res.json();
          if (json.isAdmin) {
            setStatus("allowed");
            return;
          }
        }
      } catch (e) {
        console.error("[AdminGuard] Verification failed:", e);
      }
      setStatus("denied");
    })();
  }, []);

  if (status === "checking") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="size-8 text-[#09090B] animate-spin" />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}