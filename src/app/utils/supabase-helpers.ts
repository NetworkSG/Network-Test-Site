import { projectId, publicAnonKey } from "/utils/supabase/info"

// Edge function API base
export const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`

// Standard auth headers for API calls
export function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${publicAnonKey}`,
  }
}

// Auth headers with homeowner token
export function getAuthHeaders() {
  const token = localStorage.getItem("homeowner-token") || ""
  return {
    ...getApiHeaders(),
    "X-Homeowner-Token": token,
  }
}
