/**
 * Supabase configuration — reads from environment variables with fallback.
 * Set VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY in your .env.local or Vercel dashboard.
 * The anon key is a public key designed for frontend use (protected by RLS).
 */
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "hycxkpassywjvdqduzrx";
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y3hrcGFzc3l3anZkcWR1enJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzI3NTIsImV4cCI6MjA4OTA0ODc1Mn0.A3Ab9q9bSdTsIOHrpDjilfTGeUAm39HsgtLxSrQ138g";