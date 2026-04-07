/**
 * Supabase configuration — reads from environment variables.
 * Values are set in .env.local (not committed to git).
 * The anon key is a public key designed for frontend use (protected by RLS).
 */
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";