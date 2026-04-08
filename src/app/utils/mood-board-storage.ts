import { projectId, publicAnonKey } from "/utils/supabase/info"

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`

function getToken() {
  return localStorage.getItem("homeowner-token") || ""
}

/**
 * Upload an image file to Supabase Storage via the edge function.
 * Requires the user to be logged in (homeowner-token).
 */
export async function uploadMoodBoardImage(
  file: File,
  _userEmail: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const token = getToken()
    if (!token) return { url: null, error: "Not logged in" }

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch(`${API}/mood-board-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        "X-Homeowner-Token": token,
      },
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) {
      return { url: null, error: data.error || "Upload failed" }
    }

    return { url: data.url, error: null }
  } catch (e: unknown) {
    return { url: null, error: e instanceof Error ? e.message : "Upload failed" }
  }
}

/**
 * Upload an image from a URL to Supabase Storage via the edge function.
 * Falls back to original URL on any error.
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  _userEmail: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Skip if already a Supabase storage URL
    if (imageUrl.includes("supabase.co/storage")) {
      return { url: imageUrl, error: null }
    }

    const token = getToken()
    if (!token) return { url: imageUrl, error: null }

    const res = await fetch(`${API}/mood-board-upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
        "X-Homeowner-Token": token,
      },
      body: JSON.stringify({ imageUrl }),
    })

    const data = await res.json()
    return { url: data.url || imageUrl, error: null }
  } catch {
    // On any error, return the original URL
    return { url: imageUrl, error: null }
  }
}
