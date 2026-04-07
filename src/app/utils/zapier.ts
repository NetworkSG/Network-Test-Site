import { projectId, publicAnonKey } from "/utils/supabase/info";

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

/**
 * Send data to a Zapier webhook via the server-side proxy.
 * Webhook URLs are never exposed to the frontend.
 */
export async function sendToZapier(
  hook: "hero-lead" | "render-lead" | "cost-guide-lead" | "handshake-lead",
  data: Record<string, string>
): Promise<void> {
  try {
    await fetch(`${API_BASE}/zapier-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ hook, data }),
    });
  } catch (err) {
    console.error("Zapier proxy error:", err);
  }
}
