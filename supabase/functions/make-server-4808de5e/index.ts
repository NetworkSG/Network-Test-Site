import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

// ═══════════════════════════════════════════════════════
// FP3D Database Helpers — uses dedicated tables instead of KV store
// Tables: fp3d_projects, fp3d_templates, fp3d_template_versions, fp3d_users, fp3d_admins, fp3d_leads
// ═══════════════════════════════════════════════════════
function fp3dClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

const fp3dDb = {
  // --- Projects ---
  async getProject(id: string) {
    const { data, error } = await fp3dClient().from("fp3d_projects").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { id: data.id, userId: data.user_id, title: data.title, thumbnailUrl: data.thumbnail_url, sourceType: data.source_type, sourceFileId: data.source_file_id, projectData: data.project_data || {}, createdAt: data.created_at, updatedAt: data.updated_at };
  },
  async listUserProjects(userId: string) {
    const { data, error } = await fp3dClient().from("fp3d_projects").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => ({ id: d.id, userId: d.user_id, title: d.title, thumbnailUrl: d.thumbnail_url, sourceType: d.source_type, sourceFileId: d.source_file_id, projectData: d.project_data || {}, createdAt: d.created_at, updatedAt: d.updated_at }));
  },
  async upsertProject(project: any) {
    const row = { id: project.id, user_id: project.userId, title: project.title, thumbnail_url: project.thumbnailUrl || null, source_type: project.sourceType || "upload", source_file_id: project.sourceFileId || null, project_data: project.projectData || {}, created_at: project.createdAt, updated_at: project.updatedAt };
    const { error } = await fp3dClient().from("fp3d_projects").upsert(row);
    if (error) throw new Error(error.message);
  },
  async deleteProject(id: string) {
    const { error } = await fp3dClient().from("fp3d_projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // --- Templates ---
  async getTemplate(id: string) {
    const { data, error } = await fp3dClient().from("fp3d_templates").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { id: data.id, userId: data.user_id, name: data.name, category: data.category, unitType: data.unit_type, description: data.description, dwgFileUrl: data.dwg_file_url, thumbnailUrl: data.thumbnail_url, projectData: data.project_data, isActive: data.is_active, createdAt: data.created_at, updatedAt: data.updated_at };
  },
  async listTemplates() {
    const { data, error } = await fp3dClient().from("fp3d_templates").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => ({ id: d.id, userId: d.user_id, name: d.name, category: d.category, unitType: d.unit_type, description: d.description, dwgFileUrl: d.dwg_file_url, thumbnailUrl: d.thumbnail_url, projectData: d.project_data, isActive: d.is_active, createdAt: d.created_at, updatedAt: d.updated_at }));
  },
  async upsertTemplate(template: any) {
    const row = { id: template.id, user_id: template.userId || null, name: template.name, category: template.category || null, unit_type: template.unitType || null, description: template.description || null, dwg_file_url: template.dwgFileUrl || null, thumbnail_url: template.thumbnailUrl || null, project_data: template.projectData || null, is_active: template.isActive !== false, created_at: template.createdAt, updated_at: template.updatedAt };
    const { error } = await fp3dClient().from("fp3d_templates").upsert(row);
    if (error) throw new Error(error.message);
  },
  async deleteTemplate(id: string) {
    const { error } = await fp3dClient().from("fp3d_templates").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  // --- Template Versions ---
  async getVersion(templateId: string, versionId: string) {
    const { data, error } = await fp3dClient().from("fp3d_template_versions").select("*").eq("id", versionId).eq("template_id", templateId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { versionId: data.id, templateId: data.template_id, ...(data.data || {}) };
  },
  async listVersions(templateId: string) {
    const { data, error } = await fp3dClient().from("fp3d_template_versions").select("*").eq("template_id", templateId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => ({ versionId: d.id, templateId: d.template_id, ...(d.data || {}) }));
  },
  async insertVersion(templateId: string, versionId: string, versionData: any) {
    const row = { id: versionId, template_id: templateId, data: versionData, created_at: new Date().toISOString() };
    const { error } = await fp3dClient().from("fp3d_template_versions").insert(row);
    if (error) throw new Error(error.message);
  },
  async deleteVersion(templateId: string, versionId: string) {
    const { error } = await fp3dClient().from("fp3d_template_versions").delete().eq("id", versionId).eq("template_id", templateId);
    if (error) throw new Error(error.message);
  },
  async deleteAllVersions(templateId: string) {
    const { error } = await fp3dClient().from("fp3d_template_versions").delete().eq("template_id", templateId);
    if (error) throw new Error(error.message);
  },

  // --- Users ---
  async getUser(userId: string) {
    const { data, error } = await fp3dClient().from("fp3d_users").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return data.data;
  },
  async upsertUser(userId: string, userData: any) {
    const { error } = await fp3dClient().from("fp3d_users").upsert({ user_id: userId, data: userData });
    if (error) throw new Error(error.message);
  },

  // --- Admins ---
  async getAdmin(userId: string) {
    const { data, error } = await fp3dClient().from("fp3d_admins").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return data.data;
  },
  async listAdmins() {
    const { data, error } = await fp3dClient().from("fp3d_admins").select("*");
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => d.data).filter(Boolean);
  },
  async upsertAdmin(userId: string, adminData: any) {
    const { error } = await fp3dClient().from("fp3d_admins").upsert({ user_id: userId, data: adminData });
    if (error) throw new Error(error.message);
  },
  async deleteAdmin(userId: string) {
    const { error } = await fp3dClient().from("fp3d_admins").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
  },

  // --- Leads ---
  async insertLead(lead: any) {
    const row = { id: lead.id || crypto.randomUUID(), name: lead.name, email: lead.email, contact_number: lead.contactNumber || null, key_collection_period: lead.keyCollectionPeriod || null, created_at: new Date().toISOString() };
    const { error } = await fp3dClient().from("fp3d_leads").insert(row);
    if (error) throw new Error(error.message);
  },
};

// Built-in base64 decode (no external dependency)
function base64Decode(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

const app = new Hono();

// =============================================
// SECURITY LAYER
// =============================================

// --- Structured Security Audit Logger ---
function securityLog(event: string, severity: "info" | "warn" | "error", ip: string, route: string, details?: Record<string, any>) {
  const ts = new Date().toISOString();
  const entry = { event, severity, ip, route, ...details, ts };
  console.log(JSON.stringify(entry));
  // Also persist errors/warnings to KV for the admin debug dashboard (fire-and-forget)
  if (severity === "error" || severity === "warn") {
    const key = `error-log:${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    kv.set(key, { source: "server", ...entry }).catch(() => {});
  }
}

// --- Failed Login Tracker (brute-force protection) ---
const failedLoginMap = new Map<string, { count: number; firstAttempt: number }>();
const LOGIN_LOCKOUT_THRESHOLD = 5;
const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginLockout(ip: string): { locked: boolean; remaining: number } {
  const now = Date.now();
  const entry = failedLoginMap.get(ip);
  if (!entry) return { locked: false, remaining: LOGIN_LOCKOUT_THRESHOLD };
  if (now - entry.firstAttempt > LOGIN_LOCKOUT_WINDOW_MS) {
    failedLoginMap.delete(ip);
    return { locked: false, remaining: LOGIN_LOCKOUT_THRESHOLD };
  }
  if (entry.count >= LOGIN_LOCKOUT_THRESHOLD) {
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: LOGIN_LOCKOUT_THRESHOLD - entry.count };
}

function recordFailedLogin(ip: string) {
  const now = Date.now();
  const entry = failedLoginMap.get(ip);
  if (!entry || now - entry.firstAttempt > LOGIN_LOCKOUT_WINDOW_MS) {
    failedLoginMap.set(ip, { count: 1, firstAttempt: now });
  } else {
    entry.count++;
  }
}

function clearFailedLogins(ip: string) {
  failedLoginMap.delete(ip);
}

// --- Rate Limiter (in-memory, per IP) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMITS: Record<string, number> = {
  // --- AI / Resource-intensive ---
  "render-upload": 5,       // 5 uploads per minute
  "render-task": 3,         // 3 AI renders per minute
  "render-status": 30,      // 30 polls per minute
  "editor-render": 3,       // 3 editor renders per minute
  "analyze-floorplan": 3,   // 3 AI analyses per minute
  // --- Lead forms ---
  "quote-request": 5,       // 5 quote requests per minute
  "cost-guide": 5,          // 5 cost guide submissions per minute
  "designer-inquiry": 5,    // 5 designer inquiries per minute
  "zapier-proxy": 5,        // 5 webhook calls per minute
  "pinterest-fetch": 6,     // 6 Pinterest board fetches per minute
  // --- Auth ---
  "signup": 3,              // 3 signups per minute (anti-bot)
  "login": 10,              // 10 login attempts per minute
  "session": 20,            // 20 session checks per minute
  "credentials": 3,         // 3 credential setup attempts per minute
  // --- Data endpoints ---
  "projects": 15,           // 15 project operations per minute
  "templates": 15,          // 15 template operations per minute
  "scrape-designers": 8,    // 8 designer list fetches per minute
  "scrape-profile": 15,     // 15 profile views per minute
  "profile-update": 10,     // 10 profile updates per minute
  "saved-projects": 15,     // 15 saved project operations per minute
  // --- Callbacks (external services) ---
  "callback": 10,           // 10 callback deliveries per minute
  // --- Drive folder ingest (per-image, one request each) ---
  "drive-ingest": 60,       // 60 images per minute — supports a 40-image folder with retries
  default: 20,              // 20 requests per minute for everything else
};

// --- Global IP abuse tracker (escalating blocks) ---
const abuseMap = new Map<string, { violations: number; blockedUntil: number }>();
const ABUSE_THRESHOLD = 5;        // 5 rate limit violations → temporary IP block
const ABUSE_BLOCK_MS = 10 * 60 * 1000; // 10 minute block
const ABUSE_WINDOW_MS = 30 * 60 * 1000; // 30 minute tracking window

function trackAbuse(ip: string): boolean {
  const now = Date.now();
  const entry = abuseMap.get(ip);
  if (entry && now < entry.blockedUntil) return true; // still blocked
  if (!entry || now - (entry.blockedUntil - ABUSE_BLOCK_MS) > ABUSE_WINDOW_MS) {
    abuseMap.set(ip, { violations: 1, blockedUntil: 0 });
    return false;
  }
  entry.violations++;
  if (entry.violations >= ABUSE_THRESHOLD) {
    entry.blockedUntil = now + ABUSE_BLOCK_MS;
    securityLog("ip_blocked", "error", ip, "global", { violations: entry.violations, blockMinutes: 10 });
    return true;
  }
  return false;
}

function isIpBlocked(ip: string): boolean {
  const entry = abuseMap.get(ip);
  if (!entry) return false;
  if (Date.now() < entry.blockedUntil) return true;
  return false;
}

// --- Bot detection helpers ---
const KNOWN_BOT_PATTERNS = [
  /curl/i, /wget/i, /python-requests/i, /python-urllib/i, /scrapy/i,
  /httpclient/i, /java\//i, /go-http-client/i, /node-fetch/i, /axios/i,
  /postman/i, /insomnia/i, /httpie/i,
];

function isSuspiciousUA(userAgent: string | undefined): boolean {
  if (!userAgent || userAgent.length < 10) return true; // missing or very short UA
  return KNOWN_BOT_PATTERNS.some(p => p.test(userAgent));
}

function getRateLimitKey(ip: string, route: string): string {
  return `${ip}:${route}`;
}

// --- ntfy push for client errors ---
const NTFY_IGNORE_PATTERNS = [
  /webkit\.messageHandlers/i,
  /ResizeObserver loop/i,
  /Non-Error promise rejection captured/i,
  /Script error\.?$/i,
  /Load failed/i,
  /Failed to fetch/i,
];
const NTFY_IGNORE_UA = [
  /FBAN|FBAV|FB_IAB/i, // Facebook in-app browser
  /Instagram/i,
  /Line\//i,
  /bot|crawl|spider|facebookexternalhit|slurp/i,
];
const ntfyDedupe = new Map<string, number>();
const NTFY_DEDUPE_MS = 5 * 60 * 1000;

async function sendNtfyError(opts: { message: string; url: string; userAgent: string }) {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) return;

  const { message, url, userAgent } = opts;
  if (NTFY_IGNORE_PATTERNS.some((r) => r.test(message))) return;
  if (NTFY_IGNORE_UA.some((r) => r.test(userAgent))) return;

  const fingerprint = message.slice(0, 120);
  const now = Date.now();
  const last = ntfyDedupe.get(fingerprint) || 0;
  if (now - last < NTFY_DEDUPE_MS) return;
  ntfyDedupe.set(fingerprint, now);
  if (ntfyDedupe.size > 200) {
    for (const [k, t] of ntfyDedupe) {
      if (now - t > NTFY_DEDUPE_MS) ntfyDedupe.delete(k);
    }
  }

  const body = `${message}\n\nRoute: ${url || "/"}\nUA: ${userAgent.slice(0, 80)}`;
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        Title: "Network site error",
        Priority: "default",
        Tags: "warning",
      },
      body,
    });
  } catch {
    // best-effort only
  }
}

function checkRateLimit(ip: string, route: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const limit = RATE_LIMITS[route] || RATE_LIMITS.default;
  const key = getRateLimitKey(ip, route);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  // Inline cleanup of this entry if stale
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(key);
  }

  const current = rateLimitMap.get(key);
  if (!current) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (current.count >= limit) {
    trackAbuse(ip); // escalate repeated rate limit violations
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count++;
  return { allowed: true, remaining: limit - current.count, retryAfterMs: 0 };
}

// --- Daily usage cap (AI render tasks only) ---
const DAILY_RENDER_CAP = 50; // max 50 AI renders per day globally
async function checkDailyRenderCap(): Promise<{ allowed: boolean; used: number }> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `render-daily-count:${today}`;
  const current = (await kv.get(key)) || 0;
  if (current >= DAILY_RENDER_CAP) {
    return { allowed: false, used: current };
  }
  await kv.set(key, current + 1);
  return { allowed: true, used: current + 1 };
}

// --- Per-IP daily render cap (5 renders per IP per day for the public AI Render landing page) ---
// Bumped from 3 → 5 as part of the user-prompted render revamp. Adjustments also
// re-enter /render-task and deduct from the same cap, so a user gets 5 render ops total.
const IP_DAILY_RENDER_CAP = 5;
async function checkIpDailyRenderCap(ip: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `render-ip-daily:${ip}:${today}`;
  const current = (await kv.get(key)) || 0;
  if (current >= IP_DAILY_RENDER_CAP) {
    return { allowed: false, used: current, limit: IP_DAILY_RENDER_CAP };
  }
  await kv.set(key, current + 1);
  return { allowed: true, used: current + 1, limit: IP_DAILY_RENDER_CAP };
}

// --- Per-user daily render cap (3 renders per user per day for editor) ---
const USER_DAILY_RENDER_CAP = 3;
async function checkUserDailyRenderCap(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `render-user-daily:${userId}:${today}`;
  const current = (await kv.get(key)) || 0;
  if (current >= USER_DAILY_RENDER_CAP) {
    return { allowed: false, used: current, limit: USER_DAILY_RENDER_CAP };
  }
  await kv.set(key, current + 1);
  return { allowed: true, used: current + 1, limit: USER_DAILY_RENDER_CAP };
}

// --- Periodic cleanup of in-memory maps (prevent memory leaks) ---
setInterval(() => {
  const now = Date.now();
  // Clean rate limit map
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
  // Clean failed login map
  for (const [ip, entry] of failedLoginMap) {
    if (now - entry.firstAttempt > LOGIN_LOCKOUT_WINDOW_MS) failedLoginMap.delete(ip);
  }
  // Clean abuse map
  for (const [ip, entry] of abuseMap) {
    if (entry.blockedUntil > 0 && now > entry.blockedUntil + ABUSE_WINDOW_MS) abuseMap.delete(ip);
    else if (entry.blockedUntil === 0 && now > ABUSE_WINDOW_MS) abuseMap.delete(ip);
  }
}, 5 * 60 * 1000); // every 5 minutes

// --- Input Validation & Sanitization ---
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILENAME_LENGTH = 200;

const ALLOWED_PROPERTY_TYPES = ["HDB", "Condo", "Landed", "Commercial"];
const ALLOWED_ROOM_TYPES = ["Living Room", "Bathroom", "Kitchen", "Dining Room", "Bedroom"];
const ALLOWED_DESIGN_STYLES = ["Modern", "Japandi", "Scandinavian", "Wabi-sabi", "Minimalist", "Industrial"];
const ALLOWED_TIMELINES = [
  "Already have keys",
  "Within 3 months",
  "3 – 6 months",
  "6 – 12 months",
  "Just exploring",
  // RenderToolForm values
  "I've already collected my keys / ready to start",
  "In 1–3 months",
  "In 3–6 months",
  "In 6 months or later",
];
const ALLOWED_BUDGETS = [
  "Below $30,000",
  "$30,000 – $50,000",
  "$50,000 – $80,000",
  "$80,000 – $120,000",
  "Above $120,000",
  // RenderToolForm values
  "$30K – $50K",
  "$50K – $80K",
  "$80K – $100K",
  "$100K – $200K",
  "$200K – $400K",
  "$400K & Above",
];

function sanitizeString(str: string, maxLength = 500): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>'"`;\\]/g, "")          // strip dangerous chars
    .replace(/javascript\s*:/gi, "")      // block JS protocol
    .replace(/on\w+\s*=/gi, "")           // block event handlers (onclick=, onerror=, etc.)
    .replace(/&#/g, "")                   // block HTML entities
    .replace(/\x00/g, "")                 // strip null bytes
    .trim()
    .slice(0, maxLength);
}

// ═══════════════════════════════════════════════════════
// PROMPT MODERATION — keyword blocklist + interior allowlist + OpenAI moderation
// Used by /render-task to reject prompts before we spend money on kie.ai.
// ═══════════════════════════════════════════════════════
const BLOCKED_KEYWORDS = [
  // Explicit / sexual
  "nude", "naked", "nsfw", "porn", "pornographic", "sex", "sexual", "erotic", "fetish",
  "lingerie", "bikini", "topless", "underwear", "genital", "breast", "nipple",
  // Violence / weapons
  "gore", "bloody", "murder", "weapon", "gun", "rifle", "pistol", "knife", "bomb",
  "explosive", "kill", "killing", "torture", "decapitat", "mutilat",
  // Hate / ideology
  "nazi", "hitler", "isis", "terrorist", "swastika", "kkk",
  // Drugs
  "cocaine", "heroin", "meth", "marijuana dispensary",
  // Off-topic personas (people / characters)
  "celebrity", "politician", "anime character", "cartoon character", "superhero",
];

const INTERIOR_KEYWORDS = [
  // Rooms & spaces
  "room", "rooms", "kitchen", "bathroom", "bedroom", "living", "dining", "office",
  "study", "hallway", "foyer", "entryway", "nook", "pantry", "closet", "walk-in",
  "balcony", "patio", "terrace", "lobby", "loft", "attic", "basement",
  // Furniture
  "sofa", "couch", "chair", "armchair", "table", "coffee table", "desk", "bed",
  "shelf", "shelves", "cabinet", "cabinets", "counter", "countertop", "island",
  "lamp", "lighting", "pendant", "chandelier", "wardrobe", "dresser", "ottoman",
  "bookshelf", "headboard", "sideboard", "vanity", "bathtub", "shower", "vanity",
  // Materials & finishes
  "wall", "walls", "floor", "flooring", "ceiling", "window", "door", "tile", "tiles",
  "wood", "oak", "walnut", "marble", "granite", "concrete", "brick", "plaster",
  "paint", "wallpaper", "fabric", "leather", "velvet", "linen",
  // Styles
  "modern", "contemporary", "minimalist", "minimalism", "japandi", "scandinavian",
  "scandi", "industrial", "bohemian", "boho", "rustic", "mid-century", "midcentury",
  "traditional", "transitional", "wabi-sabi", "wabi sabi", "coastal", "farmhouse",
  "eclectic", "art deco", "luxury", "muji",
  // Context / property
  "interior", "design", "renovation", "reno", "remodel", "hdb", "condo", "landed",
  "apartment", "home", "house", "studio apartment", "bto", "resale",
  // Decor / accents
  "decor", "furniture", "plant", "plants", "greenery", "rug", "carpet", "curtain",
  "curtains", "blinds", "cushion", "throw pillow", "artwork", "mirror",
  "color palette", "color scheme", "color", "colour",
  // Architecture
  "architecture", "architectural", "floorplan", "floor plan", "layout",
  "render", "visualization", "visualisation", "perspective", "elevation", "3d",
];

async function moderatePrompt(userPrompt: string): Promise<{ ok: boolean; reason?: string }> {
  const normalized = (userPrompt || "").toLowerCase();

  // Length guard
  if (userPrompt.length < 5) {
    return { ok: false, reason: "Please describe your render in more detail." };
  }
  if (userPrompt.length > 500) {
    return { ok: false, reason: "Please keep your description under 500 characters." };
  }

  // Stage 1: blocklist — fast, zero-cost
  for (const bad of BLOCKED_KEYWORDS) {
    if (normalized.includes(bad)) {
      return { ok: false, reason: "That prompt isn't supported. Please describe an interior design or architectural scene only." };
    }
  }

  // Stage 2: allowlist — prompt must contain at least one interior-design keyword
  const hasInteriorTerm = INTERIOR_KEYWORDS.some((k) => normalized.includes(k));
  if (!hasInteriorTerm) {
    return {
      ok: false,
      reason: "Please describe an interior design scene — include a room type, style, material, or furniture element.",
    };
  }

  // Stage 3: Kie.ai gpt-5-4 classifier (Responses API) — best-effort semantic check.
  // Uses the existing `ai_model_keys` secret (same one as kie.ai image gen). If the call
  // fails or the response is unparseable, we soft-allow — stages 1+2 already caught the worst.
  const kieKey = Deno.env.get("ai_model_keys");
  if (kieKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const systemPrompt =
        "You are a strict content moderator for an interior-design render tool. " +
        "Classify the user's prompt. Reply with ONLY a single-line JSON object: " +
        '{"ok": true} if the prompt describes an interior space, room, furniture, materials, ' +
        "lighting, architectural scene, or design style, OR " +
        '{"ok": false, "reason": "<short user-facing reason>"} if the prompt is: ' +
        "sexual/explicit, violent, contains real people or recognizable celebrities, is political, " +
        "is off-topic (not interior design or architecture), requests copyrighted characters, " +
        "or is otherwise unsafe. Do NOT include any text outside the JSON object.";
      const res = await fetch("https://api.kie.ai/codex/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${kieKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-4",
          stream: false,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: systemPrompt }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: userPrompt }],
            },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        // Responses API returns { output: [{ content: [{ text: "..." }] }], ... } or output_text
        // Try several common shapes defensively.
        let raw: string | null = null;
        if (typeof data?.output_text === "string") {
          raw = data.output_text;
        } else if (Array.isArray(data?.output)) {
          for (const item of data.output) {
            const parts = item?.content;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                if (typeof p?.text === "string") { raw = p.text; break; }
                if (typeof p?.output_text === "string") { raw = p.output_text; break; }
              }
            }
            if (raw) break;
          }
        } else if (Array.isArray(data?.choices)) {
          raw = data.choices[0]?.message?.content ?? null;
        }
        if (raw) {
          // Extract first JSON object from the string (model may wrap in prose)
          const match = raw.match(/\{[\s\S]*?\}/);
          if (match) {
            try {
              const verdict = JSON.parse(match[0]);
              if (verdict?.ok === false) {
                const reason = typeof verdict.reason === "string" && verdict.reason.trim().length > 0
                  ? verdict.reason.trim().slice(0, 200)
                  : "That prompt isn't supported. Please describe an interior design or architectural scene only.";
                return { ok: false, reason };
              }
            } catch (_parseErr) {
              // Unparseable — soft-allow
            }
          }
        }
      } else {
        console.log("Kie.ai moderation non-200 (soft-allow):", res.status);
      }
    } catch (err) {
      console.log("Kie.ai moderation failed (soft-allow):", err instanceof Error ? err.message : err);
      // Fall through — stages 1+2 have already run
    }
  }

  return { ok: true };
}

// Build the final prompt sent to kie.ai. Anchors the task to floorplan→3D
// interior rendering so the user-written description doesn't drift into
// off-topic territory, and lets optional hint chips narrow the style/room/property.
function buildFinalPrompt(args: {
  userPrompt: string;
  adjustmentPrompt?: string;
  hints: { style?: string; room?: string; property?: string };
}): string {
  const anchors = [
    "This is a photorealistic interior design and architectural visualization task.",
    "Preserve the architectural geometry of the input image: walls, windows, doors, openings, and overall proportions must stay intact.",
    "Camera at eye-level (~1.6m). Natural, realistic lighting. Accurate scale and materials.",
  ];
  const hintParts: string[] = [];
  if (args.hints.style) hintParts.push(`Design style: ${args.hints.style}.`);
  if (args.hints.room) hintParts.push(`Room type: ${args.hints.room}.`);
  if (args.hints.property) hintParts.push(`Property type: ${args.hints.property}.`);
  const hintLine = hintParts.join(" ");
  const base = `${anchors.join(" ")} ${hintLine ? hintLine + " " : ""}User request: ${args.userPrompt}`.trim();
  if (args.adjustmentPrompt && args.adjustmentPrompt.trim().length > 0) {
    return `${base} Adjustment to apply on top of the user request: ${args.adjustmentPrompt}`;
  }
  return base;
}

// ═══════════════════════════════════════════════════════
// Watermark pipeline — imagescript-based
// Bakes a semi-transparent tiled diagonal "NETWORK · AI PREVIEW" wordmark across the
// image + a larger bottom-right "NETWORK" corner mark. Called from /render-callback
// before the public signed URL is published. The clean (un-watermarked) bytes are
// stored in a separate private path and NEVER returned to the frontend.
//
// Dynamic import so the module is only loaded on callback (kie.ai → us) and doesn't
// slow down unrelated routes.  Font is cached across invocations in a warm Deno
// isolate to keep p50 watermark time under ~600ms.
// ═══════════════════════════════════════════════════════
let WATERMARK_FONT_CACHE: Uint8Array | null = null;
async function loadWatermarkFont(): Promise<Uint8Array> {
  if (WATERMARK_FONT_CACHE) return WATERMARK_FONT_CACHE;
  // Google Fonts raw — Inter Bold. Small (~170KB), widely mirrored, CORS-friendly.
  const fontSources = [
    "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Bold.woff",
    "https://github.com/google/fonts/raw/main/ofl/inter/static/Inter-Bold.ttf",
    "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2",
  ];
  for (const src of fontSources) {
    try {
      const res = await fetch(src);
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        WATERMARK_FONT_CACHE = bytes;
        return bytes;
      }
    } catch (err) {
      console.log(`Watermark font source failed (${src}):`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error("No watermark font source available");
}

async function watermarkImage(rawBytes: Uint8Array): Promise<Uint8Array> {
  // Dynamic import so this heavy module only loads on callbacks.
  const { Image } = await import("https://deno.land/x/imagescript@1.2.17/mod.ts");

  const img = await Image.decode(rawBytes);
  const W = img.width;
  const H = img.height;

  let font: Uint8Array;
  try {
    font = await loadWatermarkFont();
  } catch (err) {
    // Fall back to shipping the raw image if we can't even load a font — caller
    // catches and uses the unmarked URL.
    throw new Error(`Watermark font unavailable: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Tiled diagonal wordmark ─────────────────────────────
  const wordmark = "NETWORK · AI PREVIEW";
  const tileFontPx = Math.max(18, Math.round(W * 0.028));
  try {
    const textLayer = (Image as any).renderText
      ? await (Image as any).renderText(font, tileFontPx, wordmark, 0xFFFFFF55)
      : null;
    if (textLayer) {
      const rotated = textLayer.rotate ? textLayer.rotate(-30) : textLayer;
      const stepX = Math.max(1, Math.round(W / 3));
      const stepY = Math.max(1, Math.round(H / 4));
      for (let y = -stepY; y < H + stepY; y += stepY) {
        for (let x = -stepX; x < W + stepX; x += stepX) {
          try { img.composite(rotated, x, y); } catch { /* off-edge composite is fine */ }
        }
      }
    }
  } catch (err) {
    console.log("Watermark tile render failed (continuing to corner mark):", err instanceof Error ? err.message : err);
  }

  // ── Corner NETWORK mark (bottom-right, higher opacity) ──
  try {
    const cornerFontPx = Math.max(28, Math.round(W * 0.045));
    const cornerText = (Image as any).renderText
      ? await (Image as any).renderText(font, cornerFontPx, "NETWORK", 0xFFFFFFCC)
      : null;
    if (cornerText) {
      const padX = Math.round(W * 0.025);
      const padY = Math.round(H * 0.03);
      const x = Math.max(0, W - cornerText.width - padX);
      const y = Math.max(0, H - cornerText.height - padY);
      img.composite(cornerText, x, y);
    }
  } catch (err) {
    console.log("Watermark corner render failed:", err instanceof Error ? err.message : err);
  }

  return await img.encodeJPEG(88);
}

// Redact PII from objects before logging
function redactPII(obj: Record<string, any>): Record<string, any> {
  const redacted = { ...obj };
  const sensitive = ["email", "whatsapp", "phone", "password", "name", "contact"];
  for (const key of Object.keys(redacted)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      redacted[key] = typeof redacted[key] === "object" ? "[REDACTED]" : "[REDACTED]";
    }
  }
  return redacted;
}

// Validate image magic bytes to prevent content-type spoofing
function validateImageMagicBytes(base64: string): boolean {
  try {
    const bytes = Uint8Array.from(atob(base64.slice(0, 24)), c => c.charCodeAt(0));
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    // WebP: 52 49 46 46 (RIFF)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
    return false;
  } catch { return false; }
}

// Strict sanitizer for KV keys — only allows alphanumeric, dash, underscore, dot
function sanitizeKvKey(str: string, maxLength = 100): string {
  if (typeof str !== "string") return "";
  return str.replace(/[^a-zA-Z0-9_\-\.]/g, "").slice(0, maxLength);
}

// Validate UUID format (v4)
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Validate session token format (UUID)
function isValidToken(str: string): boolean {
  if (typeof str !== "string" || str.length > 200) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(str);
}

// Check if a session has expired (returns true if valid/not expired)
function isSessionValid(session: any): boolean {
  if (!session) return false;
  if (session.expiresAt && Date.now() > session.expiresAt) return false;
  return true;
}

// Strict URL validation — only allow HTTPS URLs from known domains
function isValidStorageUrl(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return allowedHosts.some(host => parsed.hostname === host);
  } catch { return false; }
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
}

function isValidWhatsapp(phone: string): boolean {
  return /^\d{8}$/.test(phone);
}

// --- Auth middleware: verify Supabase anon key ---
async function verifyAuth(c: any): Promise<boolean> {
  const authHeader = c.req.header("Authorization");
  const ip = getClientIp(c);
  const route = c.req.path || "unknown";
  if (!authHeader) {
    securityLog("auth_missing_header", "warn", ip, route);
    return false;
  }
  // Robustly extract token: handle "Bearer" prefix case-insensitively and trim
  const token = authHeader.replace(/^bearer\s+/i, "").trim();

  if (!token) {
    securityLog("auth_empty_token", "warn", ip, route);
    return false;
  }

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();

  // Direct match with anon key
  if (anonKey && token === anonKey) return true;

  // Accept any well-formed JWT from our Supabase project
  const jwtParts = token.split(".");
  if (jwtParts.length === 3 && jwtParts[0].startsWith("eyJ")) {
    try {
      const payload = JSON.parse(atob(jwtParts[1]));
      if (payload.iss && payload.iss.includes("supabase")) {
        return true;
      }
    } catch (_) {
      // If we can't decode, fall through to other checks
    }
  }

  // Validate JWT via Supabase auth (cryptographic signature verification)
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data } = await supabase.auth.getUser(token);
    if (data?.user?.id) return true;
  } catch (_) {}

  securityLog("auth_invalid_token", "warn", ip, route, { tokenLen: token.length });
  return false;
}

// --- Get client IP ---
function getClientIp(c: any): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

// --- Deep URL finder: recursively search any object for http URLs ---
function findUrlsInObject(obj: any, depth = 0): string[] {
  if (depth > 5) return []; // prevent infinite recursion
  const urls: string[] = [];
  if (typeof obj === "string" && obj.startsWith("http") && obj.length > 10 && obj.length < 2000) {
    urls.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...findUrlsInObject(item, depth + 1));
    }
  } else if (obj && typeof obj === "object") {
    for (const val of Object.values(obj)) {
      urls.push(...findUrlsInObject(val, depth + 1));
    }
  }
  return urls;
}

// --- Helper: Extract result URL from kie.ai response ---
// kie.ai stores the output in data.resultJson (a JSON string) with resultUrls array
function extractKieResultUrl(data: any): string | null {
  try {
    // Primary path: data.resultJson is a JSON string containing { resultUrls: [...] }
    if (data?.resultJson && typeof data.resultJson === "string") {
      const parsed = JSON.parse(data.resultJson);
      if (parsed?.resultUrls?.[0] && typeof parsed.resultUrls[0] === "string") {
        return parsed.resultUrls[0];
      }
      // Also check resultUrl (singular)
      if (parsed?.resultUrl && typeof parsed.resultUrl === "string") {
        return parsed.resultUrl;
      }
      // Deep search the parsed resultJson
      const parsedUrls = findUrlsInObject(parsed);
      if (parsedUrls.length > 0) return parsedUrls[0];
    }
  } catch (e) {
    console.log("Failed to parse resultJson:", e);
  }

  // Fallback: check common direct paths
  const directUrl =
    data?.output?.[0] ||
    data?.result?.[0] ||
    data?.image_url ||
    data?.imageUrl ||
    data?.images?.[0] ||
    data?.url ||
    null;

  if (directUrl && typeof directUrl === "string" && directUrl.startsWith("http") && directUrl.length < 2000) {
    return directUrl;
  }

  return null;
}

// --- Helper: Extract status from kie.ai response ---
// kie.ai uses data.state (lowercase: "success", "failed", "processing")
function extractKieStatus(data: any): string {
  const raw = (
    data?.state ||
    data?.status ||
    data?.taskStatus ||
    ""
  ).toString().toLowerCase();
  return raw;
}

// =============================================
// MIDDLEWARE
// =============================================

// Enable logger
app.use('*', logger(console.log));

// Global abuse protection — block IPs with repeated violations
app.use("*", async (c, next) => {
  const ip = getClientIp(c);
  if (isIpBlocked(ip)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }
  await next();
});

// Global auto rate limiting — maps URL patterns to rate limit keys
// This catches all endpoints, even those without explicit rate limit calls
app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") { await next(); return; }
  const ip = getClientIp(c);
  const path = c.req.path || "";

  // Map URL patterns to rate limit keys
  let rlKey = "default";
  if (path.includes("/render-upload")) rlKey = "render-upload";
  else if (path.includes("/render-task")) rlKey = "render-task";
  else if (path.includes("/render-status")) rlKey = "render-status";
  else if (path.includes("/render-callback") || path.includes("/editor-render-callback")) rlKey = "callback";
  else if (path.includes("/editor-render")) rlKey = "editor-render";
  else if (path.includes("/analyze-floorplan")) rlKey = "analyze-floorplan";
  else if (path.includes("/quote-request")) rlKey = "quote-request";
  else if (path.includes("/cost-guide")) rlKey = "cost-guide";
  else if (path.includes("/designer-inquiry")) rlKey = "designer-inquiry";
  else if (path.includes("/zapier-proxy")) rlKey = "zapier-proxy";
  else if (path.includes("/signup") || path.includes("/homeowner-signup")) rlKey = "signup";
  else if (path.includes("/login") || path.includes("/admin/login")) rlKey = "login";
  else if (path.includes("/session") || path.includes("/verify")) rlKey = "session";
  else if (path.includes("/credentials")) rlKey = "credentials";
  else if (path.includes("/fp3d/projects")) rlKey = "projects";
  else if (path.includes("/fp3d/templates")) rlKey = "templates";
  else if (path.includes("/designers") && !path.includes("/designer-")) rlKey = "scrape-designers";
  else if (path.includes("/homeowner-profile") || path.includes("/homeowner-saved")) rlKey = "profile-update";
  else if (path.includes("/health")) { await next(); return; } // skip health check

  const rl = checkRateLimit(ip, rlKey);
  if (!rl.allowed) {
    securityLog("global_rate_limit", "warn", ip, path, { rlKey });
    return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
  }
  await next();
});

// Bot detection middleware — reject suspicious User-Agents on sensitive endpoints
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    const path = c.req.path || "";
    // Apply bot detection to form submissions, signups, logins, and lead capture
    const sensitivePatterns = ["/signup", "/login", "/quote-request", "/cost-guide", "/designer-inquiry", "/render-upload", "/render-task", "/zapier-proxy", "/homeowner-signup"];
    if (sensitivePatterns.some(p => path.includes(p))) {
      const ua = c.req.header("user-agent");
      if (isSuspiciousUA(ua)) {
        const ip = getClientIp(c);
        securityLog("bot_detected", "warn", ip, path, { ua: (ua || "").slice(0, 50) });
        return c.json({ error: "Request blocked" }, 403);
      }
    }
  }
  await next();
});

// Honeypot field validation middleware — reject submissions with filled honeypot
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    const path = c.req.path || "";
    const formPaths = ["/quote-request", "/cost-guide", "/designer-inquiry", "/signup", "/homeowner-signup"];
    if (formPaths.some(p => path.includes(p))) {
      try {
        const cloned = c.req.raw.clone();
        const body = await cloned.json();
        // If honeypot field is filled, silently reject (bot filled the hidden field)
        if (body._hp_field) {
          const ip = getClientIp(c);
          securityLog("honeypot_triggered", "warn", ip, path);
          // Return success to not alert the bot
          return c.json({ success: true, id: crypto.randomUUID() });
        }
      } catch { /* ignore parse errors — will be caught by handler */ }
    }
  }
  await next();
});

// Content-Type validation — reject non-JSON POST requests (except callbacks)
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    const path = c.req.path || "";
    // Skip content-type check for callback endpoints (external services may send different types)
    if (!path.includes("/render-callback") && !path.includes("/editor-render-callback")) {
      const ct = c.req.header("content-type") || "";
      if (!ct.includes("application/json") && !ct.includes("multipart/form-data")) {
        return c.json({ error: "Invalid content type. Expected application/json" }, 415);
      }
    }
  }
  await next();
});

// Enable CORS — restricted to known origins
const ALLOWED_ORIGINS = [
  "https://www.networksg.net",
  "https://networksg.net",
  "https://www.orangenetworkstudios.com",
  "https://orangenetworkstudios.com",
  "https://test-site.networksg.net",
  "https://www.test-site.networksg.net",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(
  "/*",
  cors({
    origin: ALLOWED_ORIGINS,
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token", "X-Designer-Token", "X-Homeowner-Token", "X-Onboarding-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-RateLimit-Remaining"],
    maxAge: 600,
  }),
);

// Global security headers
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.kie.ai; frame-ancestors 'none'");
});

// Health check endpoint
app.get("/make-server-4808de5e/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Image proxy ──────────────────────────────────────────────────
// Tiny same-origin pass-through used by the client-side floor-plan detector.
// Qanvast's CDN (d1hy6t2xeg0mdl.cloudfront.net) doesn't return CORS headers,
// so the browser can't readPixels from those images. This endpoint fetches the
// upstream bytes server-side and re-emits them with `Access-Control-Allow-Origin: *`.
// Allow-list only known image hosts to prevent open-proxy abuse.
const IMG_PROXY_HOSTS = [
  /(^|\.)qanvast\.com$/i,
  /(^|\.)cloudfront\.net$/i,
  /(^|\.)supabase\.co$/i,
];
app.get("/make-server-4808de5e/img-proxy", async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.text("Too many requests", 429);
    const raw = c.req.query("url");
    if (!raw) return c.text("Missing url", 400);
    let parsed: URL;
    try { parsed = new URL(raw); } catch { return c.text("Invalid url", 400); }
    if (!/^https?:$/.test(parsed.protocol)) return c.text("Bad protocol", 400);
    if (!IMG_PROXY_HOSTS.some((re) => re.test(parsed.hostname))) {
      return c.text("Host not allowed", 400);
    }
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (img-proxy)",
        "Accept": "image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });
    if (!upstream.ok || !upstream.body) {
      return c.text(`Upstream ${upstream.status}`, 502);
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") || "image/jpeg",
        "cache-control": "public, max-age=600",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err: any) {
    return c.text("Proxy error: " + (err?.message || String(err)), 502);
  }
});

// --- Zapier webhook proxy ---
// Webhook URLs are server-side only, never exposed to frontend
const ZAPIER_WEBHOOKS: Record<string, string> = {
  "hero-lead": "https://hooks.zapier.com/hooks/catch/20249199/2c5b7ea/",
  "render-lead": "https://hooks.zapier.com/hooks/catch/20249199/uzpio2p/",
  "cost-guide-lead": "https://hooks.zapier.com/hooks/catch/20249199/ujejbhx/",
  "handshake-lead": "https://hooks.zapier.com/hooks/catch/20249199/u72cnij/",
  "concierge-match-lead": "https://hooks.zapier.com/hooks/catch/20249199/uvmm8f4/",
  "designer-profile-lead": "https://hooks.zapier.com/hooks/catch/20249199/uvmnj1y/",
};

// Upload a Cost Guide PDF (base64) to public storage, return its URL so the
// client can forward it to Zapier along with the lead data.
// Pinterest board fetch — calls Outscraper's Pinterest scraper to pull pin
// data for a public board URL, then upgrades each image URL to the highest
// available resolution (Pinterest's `originals/` size segment) so the
// frontend can offer a high-quality bulk download. Falls back to a direct
// Pinterest HTML scrape if the Outscraper key isn't configured.
app.post("/make-server-4808de5e/pinterest-board/fetch", async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "pinterest-fetch");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json().catch(() => null);
    const rawUrl: string = typeof body?.url === "string" ? body.url.trim() : "";
    const limit: number = Math.max(1, Math.min(500, Number(body?.limit) || 100));
    if (!rawUrl) return c.json({ error: "Missing url" }, 400);

    // Accept both pinterest.com/<user>/<board>/ and pin.it short links.
    let boardUrl = rawUrl;
    if (!/^https?:\/\//i.test(boardUrl)) boardUrl = "https://" + boardUrl;
    let host = "";
    try { host = new URL(boardUrl).host.toLowerCase(); }
    catch { return c.json({ error: "Invalid url" }, 400); }
    if (!/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/i.test(host)) {
      return c.json({ error: "Not a Pinterest URL" }, 400);
    }

    // Pinterest serves each image at multiple sizes via i.pinimg.com/<size>/...
    // Replacing the size segment with `originals` returns the highest-quality
    // copy. The frontend then targets ~2048px on download.
    const upgrade = (u: string): string => {
      if (!u || typeof u !== "string") return u;
      try {
        const parsed = new URL(u);
        if (!parsed.host.includes("pinimg.com")) return u;
        parsed.pathname = parsed.pathname.replace(
          /^\/(originals|236x|474x|736x|2048x|orig|\d+x|\d+x\d+)\//,
          "/originals/",
        );
        return parsed.toString();
      } catch { return u; }
    };

    let images: { id: string; url: string; alt?: string }[] = [];
    let boardName = "";
    let source: "pinterest-api" | "direct" = "direct";

    // Browser-shaped headers — Pinterest serves the embedded JSON state and
    // the public BoardFeedResource only to clients that look like real
    // browsers. A generic User-Agent gets a stripped landing page.
    const browserHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    // Helper — does this URL look like an actual *pin* image (not an avatar,
    // store badge, or UI asset)?
    const isPinUrl = (u: string): boolean => {
      try {
        const p = new URL(u);
        if (!p.host.endsWith("pinimg.com")) return false;
        const path = p.pathname;
        if (/^\/(avatars|videos|customer_convo|business|favicons|logos)\//i.test(path)) return false;
        if (!/[a-f0-9]{24,}\.(?:jpg|jpeg|png|gif|webp)$/i.test(path)) return false;
        return true;
      } catch { return false; }
    };

    // Step 1 — fetch the board HTML once to extract board_id (needed for
    // the paginated BoardFeedResource calls) and board name.
    let boardId = "";
    let initialHtml = "";
    try {
      const initial = await fetch(boardUrl, { headers: browserHeaders, redirect: "follow" });
      if (initial.ok) {
        initialHtml = await initial.text();
        const titleMatch = initialHtml.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) boardName = titleMatch[1].replace(/\s*\|\s*Pinterest\s*$/i, "").trim();
        // The board_id is embedded multiple places in the initial JSON.
        // Match the explicit `"board_id":"123…"` shape and the more general
        // `"id":"…","type":"board"` shape as a fallback.
        const idMatch =
          initialHtml.match(/"board_id"\s*:\s*"(\d{6,})"/) ||
          initialHtml.match(/"id"\s*:\s*"(\d{6,})"\s*,\s*"type"\s*:\s*"board"/);
        if (idMatch) boardId = idMatch[1];
      }
    } catch (err) {
      console.log("Pinterest initial HTML fetch error:", String(err));
    }

    // Step 2 — if we have a board_id, paginate through BoardFeedResource.
    // Pinterest's own UI uses this exact endpoint; it returns up to 25 pins
    // per page plus a `bookmark` cursor that gets passed back to fetch the
    // next batch. `-end-` means we've consumed every pin on the board.
    if (boardId) {
      try {
        // Pinterest expects the URL path component in `source_url` — keep
        // the URL pathname (e.g. /RNACREATIVECO/384a-yishun-ave-6/) intact.
        const sourceUrl = (() => {
          try { return new URL(boardUrl).pathname; } catch { return "/"; }
        })();
        let bookmark = "";
        let safety = 0; // hard cap on pages so a misbehaving cursor can't loop
        const seen = new Map<string, { id: string; url: string; alt?: string }>();
        while (safety < 40 && seen.size < limit) {
          safety++;
          const dataPayload = {
            options: {
              board_id: boardId,
              board_url: sourceUrl,
              page_size: 25,
              ...(bookmark ? { bookmarks: [bookmark] } : {}),
            },
            context: {},
          };
          const params = new URLSearchParams({
            source_url: sourceUrl,
            data: JSON.stringify(dataPayload),
            _: String(Date.now()),
          });
          const feedUrl = `https://www.pinterest.com/resource/BoardFeedResource/get/?${params.toString()}`;
          const r = await fetch(feedUrl, {
            headers: {
              ...browserHeaders,
              "Accept": "application/json, text/javascript, */*; q=0.01",
              "X-Requested-With": "XMLHttpRequest",
              "X-Pinterest-AppState": "active",
              "X-Pinterest-Source-Url": sourceUrl,
              "Referer": boardUrl,
            },
          });
          if (!r.ok) {
            console.log("Pinterest BoardFeedResource HTTP", r.status);
            break;
          }
          const j: any = await r.json().catch(() => null);
          const pins: any[] = j?.resource_response?.data || [];
          if (!Array.isArray(pins) || pins.length === 0) break;
          for (const pin of pins) {
            const img =
              pin?.images?.orig?.url ||
              pin?.images?.["736x"]?.url ||
              pin?.images?.["474x"]?.url;
            const id = typeof pin?.id === "string" ? pin.id : "";
            if (typeof img === "string" && id && isPinUrl(img) && !seen.has(id)) {
              seen.set(id, {
                id,
                url: upgrade(img),
                alt: typeof pin.grid_title === "string" && pin.grid_title
                  ? pin.grid_title
                  : (typeof pin.description === "string" ? pin.description.slice(0, 140) : undefined),
              });
            }
          }
          const nextBookmark: string =
            j?.resource_response?.bookmark ||
            j?.resource?.options?.bookmarks?.[0] ||
            "";
          if (!nextBookmark || nextBookmark === "-end-" || nextBookmark === bookmark) break;
          bookmark = nextBookmark;
        }
        for (const v of seen.values()) {
          if (images.length >= limit) break;
          images.push(v);
        }
        if (images.length > 0) source = "pinterest-api";
      } catch (err) {
        console.log("Pinterest BoardFeedResource error:", String(err));
      }
    }

    // Fallback / supplement: scrape the public board HTML directly. Pinterest
    // embeds initial state JSON inside <script id="__PWS_INITIAL_PROPS__">
    // (and sometimes <script id="initial-state">). Pulling pins from that
    // JSON is far more reliable than regex'ing every i.pinimg.com URL on the
    // page — that approach grabs avatars, "More like this" recommendations,
    // and logos along with the actual board.
    if (images.length === 0) {
      try {
        const res = await fetch(boardUrl, {
          headers: {
            // Pinterest serves the embedded pin JSON only to clients it
            // recognises as a real browser. A generic User-Agent gets a
            // stripped landing page with no useful data.
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          redirect: "follow",
        });
        if (res.ok) {
          const html = await res.text();
          // Title — best effort.
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && !boardName) boardName = titleMatch[1].replace(/\s*\|\s*Pinterest\s*$/i, "").trim();

          // Helper — does this URL look like an actual *pin* image (not an
          // avatar, store badge, or UI asset)?
          const isPinUrl = (u: string): boolean => {
            try {
              const p = new URL(u);
              if (!p.host.endsWith("pinimg.com")) return false;
              const path = p.pathname;
              // Block known non-pin paths.
              if (/^\/(avatars|videos|customer_convo|business|favicons|logos)\//i.test(path)) return false;
              // Pinterest pin filenames are 28+ char hex hashes. UI/branding
              // assets and avatars don't match this pattern.
              if (!/[a-f0-9]{24,}\.(?:jpg|jpeg|png|gif|webp)$/i.test(path)) return false;
              return true;
            } catch { return false; }
          };

          // Pass 1 — pull pin objects out of the embedded JSON state. Each
          // pin entry has the canonical `images.orig.url`, which is exactly
          // the file we want. We collect by pin id so duplicates from the
          // multiple JSON blobs Pinterest ships collapse cleanly.
          const seen = new Map<string, { id: string; url: string; alt?: string }>();
          const scriptRe = /<script[^>]*(?:id="__PWS_INITIAL_PROPS__"|id="initial-state"|id="__PWS_DATA__"|type="application\/json")[^>]*>([\s\S]*?)<\/script>/gi;
          let scriptMatch: RegExpExecArray | null;
          // Walk the scripts, JSON.parse what we can, and collect pin-shaped
          // objects (any { id, images: { orig: { url } } }). This is loose
          // intentionally — Pinterest's bundle structure shifts often.
          const collectPins = (node: any) => {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) { for (const v of node) collectPins(v); return; }
            const orig = node?.images?.orig?.url || node?.images?.["736x"]?.url;
            const id = node?.id || node?.pin_id;
            if (typeof orig === "string" && typeof id === "string" && isPinUrl(orig)) {
              if (!seen.has(id)) {
                seen.set(id, {
                  id,
                  url: upgrade(orig),
                  alt: typeof node.title === "string" && node.title
                    ? node.title
                    : (typeof node.description === "string" ? node.description.slice(0, 140) : undefined),
                });
              }
            }
            for (const k of Object.keys(node)) collectPins((node as any)[k]);
          };
          while ((scriptMatch = scriptRe.exec(html)) !== null) {
            const raw = scriptMatch[1].trim();
            if (!raw || raw.length < 200) continue;
            try {
              const parsed = JSON.parse(raw);
              collectPins(parsed);
            } catch { /* not JSON, skip */ }
            if (seen.size >= limit) break;
          }

          // Pass 2 — only if the JSON pass found nothing, fall back to a
          // strict regex over the whole HTML, still filtered by the pin-URL
          // shape so we don't grab avatars or related-pin badges.
          if (seen.size === 0) {
            const re = /https:\/\/i\.pinimg\.com\/[^\s"'\\]+\.(?:jpg|jpeg|png|gif|webp)/gi;
            let m: RegExpExecArray | null;
            while ((m = re.exec(html)) !== null && seen.size < limit) {
              if (!isPinUrl(m[0])) continue;
              const upgraded = upgrade(m[0]);
              // Use the file hash as the dedupe key so multiple sizes of the
              // same pin don't show up twice.
              const hash = (upgraded.match(/([a-f0-9]{24,})\.(?:jpg|jpeg|png|gif|webp)$/i) || [])[1] || upgraded;
              if (!seen.has(hash)) seen.set(hash, { id: hash, url: upgraded });
            }
          }

          for (const v of seen.values()) {
            if (images.length >= limit) break;
            images.push(v);
          }
        }
      } catch (err) {
        console.log("Pinterest direct scrape error:", String(err));
      }
    }

    if (images.length === 0) {
      return c.json({ error: "No images found. Make sure the board URL is public.", source }, 404);
    }

    return c.json({
      board: { url: boardUrl, name: boardName || "Pinterest board", count: images.length },
      images,
      source,
    });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Pinterest image proxy — i.pinimg.com responses are not consistently
// CORS-friendly when fetched directly from the browser, so we proxy them
// through our function (same-origin) and stream the bytes back. Locked to
// pinimg.com hosts to prevent the endpoint being used as a generic open
// proxy.
app.get("/make-server-4808de5e/pinterest-image-proxy", async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "pinterest-fetch");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    const target = c.req.query("url");
    if (!target) return c.json({ error: "Missing url" }, 400);
    let host = "";
    try { host = new URL(target).host.toLowerCase(); }
    catch { return c.json({ error: "Invalid url" }, 400); }
    if (!host.endsWith("pinimg.com")) {
      return c.json({ error: "Only pinimg.com URLs allowed" }, 400);
    }

    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": "https://www.pinterest.com/",
      },
      redirect: "follow",
    });
    if (!upstream.ok || !upstream.body) {
      return c.json({ error: `Upstream returned ${upstream.status}` }, 502);
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const contentLength = upstream.headers.get("content-length") || "";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "public, max-age=86400",
        // The function host already sets a permissive ACAO via CORS middleware
        // — repeating it explicitly here keeps it from being stripped by any
        // intermediate streaming wrapper.
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/cost-guide-upload", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "cost-guide");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    const body = await c.req.json().catch(() => null);
    const pdfBase64 = typeof body?.pdfBase64 === "string" ? body.pdfBase64 : "";
    const suppliedName = typeof body?.filename === "string" ? body.filename : "cost-guide.pdf";
    if (!pdfBase64) return c.json({ error: "Missing pdfBase64" }, 400);

    // Strip data URL prefix if present.
    const clean = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    let bytes: Uint8Array;
    try {
      bytes = base64Decode(clean);
    } catch {
      return c.json({ error: "Invalid base64" }, 400);
    }
    // Hard cap: 5 MB — cost guide PDFs are ~60 KB.
    if (bytes.byteLength < 300 || bytes.byteLength > 5 * 1024 * 1024) {
      return c.json({ error: "PDF size out of range" }, 400);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const safeName = sanitizeString(suppliedName, 100).replace(/[^a-zA-Z0-9._-]/g, "_") || "cost-guide.pdf";
    const filePath = `cost-guide/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from(DESIGNER_BUCKET_NAME)
      .upload(filePath, bytes, { contentType: "application/pdf", upsert: false });
    if (uploadErr) {
      console.log("cost-guide-upload error:", uploadErr);
      return c.json({ error: `Upload failed: ${uploadErr.message}` }, 500);
    }
    const publicUrl = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${DESIGNER_BUCKET_NAME}/${filePath}`;
    return c.json({ ok: true, pdfUrl: publicUrl, filePath });
  } catch (err: any) {
    console.log("cost-guide-upload error:", err);
    return c.json({ error: "Upload failed: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

app.post("/make-server-4808de5e/zapier-proxy", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "zapier-proxy");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    const body = await c.req.json();
    const { hook, data } = body;

    if (!hook || !ZAPIER_WEBHOOKS[hook]) {
      return c.json({ error: "Invalid webhook identifier" }, 400);
    }

    // Sanitize all values in data before forwarding as JSON
    const sanitizedData: Record<string, any> = {};
    if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        const cleanKey = sanitizeString(key, 50);
        if (typeof value === "string") {
          sanitizedData[cleanKey] = sanitizeString(value, 2000);
        } else if (typeof value === "number" || typeof value === "boolean") {
          sanitizedData[cleanKey] = value;
        } else if (Array.isArray(value)) {
          sanitizedData[cleanKey] = value.map((v: any) => typeof v === "string" ? sanitizeString(v, 500) : v).slice(0, 50);
        } else if (value && typeof value === "object") {
          sanitizedData[cleanKey] = JSON.stringify(value).slice(0, 2000);
        }
      }
    }

    console.log("Zapier proxy forwarding data:", JSON.stringify(sanitizedData).slice(0, 500));
    const t0 = Date.now();
    let status = 0;
    let ok = false;
    let errorMsg: string | undefined;
    try {
      const response = await fetch(ZAPIER_WEBHOOKS[hook], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });
      status = response.status;
      ok = response.ok;
    } catch (fetchErr: any) {
      errorMsg = String(fetchErr?.message || fetchErr).slice(0, 200);
    }
    // Log to KV for debug dashboard (fire-and-forget; keys only, not values).
    // We also persist `Source` (a free-text discriminator added by lead-page
    // forms — e.g. "Escrow Landing" vs "Get Matched Landing") so the admin
    // Lead Magnets panel can split traffic by funnel even when several pages
    // share the same Zapier hook.
    const logKey = `zapier-log:${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const sourceLabel = typeof (sanitizedData as any)?.Source === "string"
      ? String((sanitizedData as any).Source).slice(0, 80)
      : undefined;
    kv.set(logKey, {
      hook,
      status,
      ok,
      latencyMs: Date.now() - t0,
      ts: new Date().toISOString(),
      payloadKeys: Object.keys(sanitizedData),
      ...(sourceLabel ? { source: sourceLabel } : {}),
      ...(errorMsg ? { error: errorMsg } : {}),
    }).catch(() => {});
    if (!ok) {
      securityLog("zapier_forward_failed", "warn", ip, "zapier-proxy", { hook, status, error: errorMsg });
    }
    return c.json({ success: ok, status });
  } catch (err) {
    console.log("Zapier proxy error:", err);
    securityLog("zapier_proxy_error", "error", getClientIp(c), "zapier-proxy", { message: String(err).slice(0, 300) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// LIVE VISITOR TRACKING
// =============================================
const VISITOR_TTL_MS = 5 * 60_000; // Visitor considered gone after 5 minutes without heartbeat

// Heartbeat — called every 30s by the client (no auth required, public pages only)
app.post("/make-server-4808de5e/visitor-heartbeat", async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-status"); // reuse a lenient limiter
    if (!rl.allowed) return c.json({ ok: true }); // silently drop if rate limited

    const body = await c.req.json().catch(() => ({}));
    const page = sanitizeString(body.page || "/", 200);
    const visitorId = sanitizeKvKey(body.visitorId || "", 64);

    if (!visitorId) return c.json({ error: "visitorId required" }, 400);

    // Exclude admin and designer dashboard pages
    if (page.startsWith("/admin") || page.match(/^\/designer\/[^/]+\/dashboard/)) {
      return c.json({ ok: true, excluded: true });
    }

    await kv.set(`visitor:${visitorId}`, {
      visitorId,
      page,
      ip,
      lastSeen: Date.now(),
    });

    return c.json({ ok: true });
  } catch (err) {
    console.log("Error in visitor-heartbeat:", err);
    return c.json({ ok: true }); // never fail the client
  }
});

// Get live visitors — admin only
app.get("/make-server-4808de5e/live-visitors", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);

    // Fetch all visitor keys
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabaseAdmin.from("kv_store_4808de5e")
      .select("key, value")
      .like("key", "visitor:%");

    if (error) {
      console.log("Error fetching live visitors:", error);
      return c.json({ visitors: [], count: 0 });
    }

    const now = Date.now();
    const activeVisitors: any[] = [];
    const expiredKeys: string[] = [];

    for (const row of data || []) {
      const v = row.value;
      if (v && v.lastSeen && (now - v.lastSeen) < VISITOR_TTL_MS) {
        activeVisitors.push({
          visitorId: v.visitorId,
          page: v.page,
          lastSeen: v.lastSeen,
        });
      } else {
        // Mark for cleanup
        expiredKeys.push(row.key);
      }
    }

    // Clean up expired visitors (fire and forget)
    if (expiredKeys.length > 0) {
      kv.mdel(expiredKeys).catch(() => {});
    }

    return c.json({
      count: activeVisitors.length,
      visitors: activeVisitors.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 50),
    });
  } catch (err) {
    console.log("Error in live-visitors:", err);
    return c.json({ visitors: [], count: 0 });
  }
});

// =============================================
// VERCEL ANALYTICS PROXY
// =============================================
const VERCEL_TOKEN = Deno.env.get("VERCEL_TOKEN") || "";
const VERCEL_PROJECT_ID = "prj_KcWg8PKziCzC2Slto8BoFWbTimQy";
const VERCEL_TEAM_ID = "team_ZbvmQZ8nr6yUnIMsCjMTq7At";

// Proxy Vercel Web Analytics API — admin only
// Uses the timeseries endpoint with groupBy for breakdowns
app.get("/make-server-4808de5e/vercel-analytics", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    if (!VERCEL_TOKEN) return c.json({ error: "VERCEL_TOKEN not configured" }, 500);

    const url = new URL(c.req.url);
    const from = url.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = url.searchParams.get("to") || new Date().toISOString();
    const tz = url.searchParams.get("tz") || "Asia/Singapore";

    const base = "https://vercel.com/api/web-analytics/timeseries";
    const qs = `projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&timezone=${encodeURIComponent(tz)}&environment=production&latest=true`;
    const headers = { Authorization: `Bearer ${VERCEL_TOKEN}` };

    // Fetch timeseries + groupBy breakdowns in parallel
    const [overallRes, pagesRes, referrersRes, countriesRes, devicesRes, browsersRes, osRes] = await Promise.allSettled([
      fetch(`${base}?${qs}`, { headers }),
      fetch(`${base}?${qs}&groupBy=path`, { headers }),
      fetch(`${base}?${qs}&groupBy=referrer`, { headers }),
      fetch(`${base}?${qs}&groupBy=country`, { headers }),
      fetch(`${base}?${qs}&groupBy=device_type`, { headers }),
      fetch(`${base}?${qs}&groupBy=client_name`, { headers }),
      fetch(`${base}?${qs}&groupBy=os_name`, { headers }),
    ]);

    const extract = async (r: PromiseSettledResult<Response>) => {
      if (r.status === "fulfilled" && r.value.ok) return r.value.json();
      if (r.status === "fulfilled") {
        console.log("Vercel API error:", r.value.status, await r.value.text().catch(() => ""));
      }
      return null;
    };

    const [overall, byPage, byReferrer, byCountry, byDevice, byBrowser, byOS] = await Promise.all([
      extract(overallRes),
      extract(pagesRes),
      extract(referrersRes),
      extract(countriesRes),
      extract(devicesRes),
      extract(browsersRes),
      extract(osRes),
    ]);

    // Transform grouped data into ranked lists
    // Each group key maps to an array of daily entries — sum the totals for ranking
    const rankGroups = (data: any) => {
      if (!data?.data?.groups) return [];
      const groups = data.data.groups;
      return Object.entries(groups)
        .map(([key, entries]: [string, any]) => ({
          key: key || "(direct)",
          total: (entries as any[]).reduce((s: number, e: any) => s + (e.total || 0), 0),
          devices: (entries as any[]).reduce((s: number, e: any) => s + (e.devices || 0), 0),
        }))
        .filter((g) => g.total > 0)
        .sort((a, b) => b.total - a.total);
    };

    // Overall timeseries: data.groups.all[]
    const timeseries = overall?.data?.groups?.all || [];

    return c.json({
      timeseries,
      pages: rankGroups(byPage),
      referrers: rankGroups(byReferrer),
      countries: rankGroups(byCountry),
      devices: rankGroups(byDevice),
      browsers: rankGroups(byBrowser),
      os: rankGroups(byOS),
      meta: { from, to, tz },
    });
  } catch (err) {
    console.log("Error in vercel-analytics proxy:", err);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// Vercel real-time visitors — lightweight endpoint polled every 15s
app.get("/make-server-4808de5e/vercel-realtime", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    if (!VERCEL_TOKEN) return c.json({ error: "VERCEL_TOKEN not configured" }, 500);

    const headers = { Authorization: `Bearer ${VERCEL_TOKEN}` };
    const qs = `projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}`;
    const res = await fetch(`https://vercel.com/api/web-analytics/realtime?${qs}`, { headers });
    if (!res.ok) {
      console.log("Vercel realtime error:", res.status, await res.text().catch(() => ""));
      return c.json({ total: 0, devices: 0 });
    }
    const data = await res.json();
    return c.json(data);
  } catch (err) {
    console.log("Error in vercel-realtime:", err);
    return c.json({ total: 0, devices: 0 });
  }
});

// Submit quote request
app.post("/make-server-4808de5e/quote-request", async (c) => {
  try {
    // Auth check
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Rate limit
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "quote-request");
    if (!rl.allowed) {
      securityLog("rate_limit_exceeded", "warn", ip, "/quote-request");
      return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { name, whatsapp, email, property_type, timeline, budget, inquiry } = body;
    console.log("Received quote request body:", JSON.stringify(redactPII(body)));

    // Input validation
    const cleanName = sanitizeString(name, 100);
    const cleanEmail = sanitizeString(email, 200).toLowerCase();
    const cleanWhatsapp = sanitizeString(whatsapp, 20);
    const cleanInquiry = sanitizeString(inquiry || "", 2000);

    if (!cleanName || !cleanWhatsapp || !cleanEmail || !property_type || !timeline || !budget) {
      return c.json({ error: "All fields are required" }, 400);
    }
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "Invalid email format" }, 400);
    }
    if (!isValidWhatsapp(cleanWhatsapp)) {
      return c.json({ error: "Invalid WhatsApp number (must be 8 digits)" }, 400);
    }
    if (!ALLOWED_PROPERTY_TYPES.includes(property_type)) {
      return c.json({ error: "Invalid property type" }, 400);
    }
    if (!ALLOWED_TIMELINES.includes(timeline)) {
      return c.json({ error: "Invalid timeline" }, 400);
    }
    if (!ALLOWED_BUDGETS.includes(budget)) {
      return c.json({ error: "Invalid budget range" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    console.log("Supabase URL:", supabaseUrl);
    console.log("Service role key present:", !!supabaseKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const insertPayload = {
      "ID": crypto.randomUUID(),
      "Name": cleanName,
      "Email": cleanEmail,
      "Phone Number": cleanWhatsapp,
      "Property Type": property_type,
      "Key Collection Date": timeline,
      "Renovation Budget": budget,
      "Inquiry": cleanInquiry,
      "Created Date": new Date().toISOString(),
      "Updated Date": new Date().toISOString(),
    };
    console.log("Insert payload:", JSON.stringify(redactPII(insertPayload)));

    const { data, error, status, statusText } = await supabase
      .from("Quote Request")
      .insert(insertPayload)
      .select()
      .single();

    console.log("Supabase response - status:", status, "statusText:", statusText);
    console.log("Supabase response - data:", JSON.stringify(data));
    console.log("Supabase response - error:", JSON.stringify(error));

    if (error) {
      console.log("Supabase insert error for Quote Request:", error);
      return c.json({ error: `Failed to submit quote request: ${error.message}`, details: error }, 500);
    }

    console.log("Quote request submitted successfully:", data);
    return c.json({ success: true, data });
  } catch (err) {
    console.log("Unexpected error in /quote-request:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// List quote requests (debug)
app.get("/make-server-4808de5e/quote-requests", async (c) => {
  try {
    // Auth check - this is a debug/admin endpoint
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("Quote Request")
      .select("*")
      .order("Created Date", { ascending: false })
      .limit(10);

    if (error) {
      console.log("Error fetching quote requests:", error);
      return c.json({ error: `Failed to fetch: ${error.message}` }, 500);
    }

    console.log("Quote requests found:", data?.length);
    return c.json({ count: data?.length ?? 0, data });
  } catch (err) {
    console.log("Unexpected error in GET /quote-requests:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Initialize storage bucket on startup
const BUCKET_NAME = "make-4808de5e-renders";
const TEMPLATE_BUCKET_NAME = "make-4808de5e-templates";
const DESIGNER_BUCKET_NAME = "make-4808de5e-designers";
const initBucket = async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: buckets } = await supabase.storage.listBuckets();
    for (const bName of [BUCKET_NAME, TEMPLATE_BUCKET_NAME]) {
      const bucketExists = buckets?.some((bucket: any) => bucket.name === bName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bName, { public: false });
        console.log("Created storage bucket:", bName);
      }
    }
    // Public bucket for designer profile images
    const designerExists = buckets?.some((b: any) => b.name === DESIGNER_BUCKET_NAME);
    if (!designerExists) {
      await supabase.storage.createBucket(DESIGNER_BUCKET_NAME, { public: true });
      console.log("Created public storage bucket:", DESIGNER_BUCKET_NAME);
    }
  } catch (err) {
    console.log("Error initializing storage bucket:", err);
  }
};
initBucket();

// Upload image for render tool
app.post("/make-server-4808de5e/render-upload", async (c) => {
  try {
    // Auth check
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Rate limit
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-upload");
    if (!rl.allowed) {
      securityLog("rate_limit_exceeded", "warn", ip, "/render-upload");
      return c.json({ error: "Too many upload requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { imageBase64, fileName, contentType } = body;

    if (!imageBase64 || !fileName || !contentType) {
      return c.json({ error: "imageBase64, fileName, and contentType are required" }, 400);
    }

    // Validate content type
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      console.log(`Security: Rejected upload with invalid content type: ${contentType}`);
      return c.json({ error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` }, 400);
    }

    // Validate magic bytes match claimed content type (prevent content-type spoofing)
    if (!validateImageMagicBytes(imageBase64)) {
      securityLog("upload_magic_bytes_mismatch", "warn", ip, "/render-upload", { contentType });
      return c.json({ error: "File content does not match a valid image format" }, 400);
    }

    // Validate filename
    const cleanFileName = sanitizeString(fileName, MAX_FILENAME_LENGTH).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!cleanFileName) {
      return c.json({ error: "Invalid file name" }, 400);
    }

    // Validate file size (base64 is ~33% larger than binary)
    const estimatedSize = Math.ceil(imageBase64.length * 0.75);
    if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
      console.log(`Security: Rejected upload exceeding size limit: ${estimatedSize} bytes`);
      return c.json({ error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB` }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Decode base64 to Uint8Array
    const imageData = base64Decode(imageBase64);
    const filePath = `uploads/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageData, { contentType, upsert: true });

    if (uploadError) {
      console.log("Storage upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create a signed URL (valid for 1 hour)
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600);

    if (signError || !signedData?.signedUrl) {
      console.log("Signed URL error:", signError);
      return c.json({ error: `Failed to create signed URL: ${signError?.message}` }, 500);
    }

    console.log("Image uploaded successfully:", filePath);
    return c.json({ success: true, url: signedData.signedUrl, filePath });
  } catch (err) {
    console.log("Unexpected error in /render-upload:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Upload designer profile image or video (public bucket)
// Accepts multipart/form-data (preferred) OR JSON base64 (legacy)
const ALLOWED_DESIGNER_MEDIA_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
];
const MAX_DESIGNER_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

app.post("/make-server-4808de5e/designer-upload", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "designer-upload");
    if (!rl.allowed) return c.json({ error: "Too many upload requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const ct = c.req.header("content-type") || "";

    let fileBytes: Uint8Array;
    let fileName: string;
    let contentType: string;

    if (ct.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return c.json({ error: "No file provided" }, 400);
      contentType = file.type;
      fileName = file.name;
      if (!ALLOWED_DESIGNER_MEDIA_TYPES.includes(contentType)) {
        return c.json({ error: `Invalid file type. Allowed: ${ALLOWED_DESIGNER_MEDIA_TYPES.join(", ")}` }, 400);
      }
      const isVideo = contentType.startsWith("video/");
      const maxSize = isVideo ? MAX_DESIGNER_VIDEO_SIZE : MAX_IMAGE_SIZE_BYTES;
      if (file.size > maxSize) {
        return c.json({ error: `File too large. Max ${maxSize / (1024 * 1024)}MB` }, 400);
      }
      fileBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      // Legacy JSON base64 path
      const body = await c.req.json();
      const { imageBase64 } = body;
      fileName = body.fileName;
      contentType = body.contentType;
      if (!imageBase64 || !fileName || !contentType) return c.json({ error: "imageBase64, fileName, and contentType are required" }, 400);
      if (!ALLOWED_DESIGNER_MEDIA_TYPES.includes(contentType)) return c.json({ error: `Invalid file type. Allowed: ${ALLOWED_DESIGNER_MEDIA_TYPES.join(", ")}` }, 400);
      const estimatedSize = Math.ceil(imageBase64.length * 0.75);
      const isVideo = contentType.startsWith("video/");
      const maxSize = isVideo ? MAX_DESIGNER_VIDEO_SIZE : MAX_IMAGE_SIZE_BYTES;
      if (estimatedSize > maxSize) return c.json({ error: `File too large. Max ${maxSize / (1024 * 1024)}MB` }, 400);
      fileBytes = base64Decode(imageBase64);
    }

    const cleanFileName = sanitizeString(fileName, MAX_FILENAME_LENGTH).replace(/[^a-zA-Z0-9._-]/g, "_") || "upload";
    const filePath = `uploads/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DESIGNER_BUCKET_NAME)
      .upload(filePath, fileBytes, { contentType, upsert: true });

    if (uploadError) {
      console.log("Designer media upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${DESIGNER_BUCKET_NAME}/${filePath}`;
    console.log("Designer media uploaded successfully:", filePath);
    return c.json({ success: true, url: publicUrl, filePath, contentType });
  } catch (err) {
    console.log("Unexpected error in /designer-upload:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── Firm Onboarding (hidden page) ──────────────────────────────────
async function sendNtfyOnboarding(opts: { firmName: string; variant: string; projectTitle: string }) {
  const topic = Deno.env.get("NTFY_TOPIC");
  if (!topic) return;
  const body = `Firm: ${opts.firmName || "(project-only submission)"}\nVariant: ${opts.variant}\nProject: ${opts.projectTitle}`;
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: { Title: "New firm onboarding submission", Priority: "default", Tags: "tada" },
      body,
    });
  } catch {
    // best-effort
  }
}

// ─── Firm onboarding helpers ────────────────────────────────────
async function findDesignerByPortalEmail(email: string): Promise<{ slug: string; data: any } | null> {
  if (!email) return null;
  const portalUrl = Deno.env.get("ONS_PORTAL_URL");
  const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
  if (!portalUrl || !portalKey) return null;
  try {
    const portal = createClient(portalUrl, portalKey);
    const { data: acc } = await portal
      .from("portal_accounts")
      .select("username, email, active")
      .ilike("email", email.trim())
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (!acc?.username) return null;
    const sb = getDesignerSupabase();
    const { data } = await sb
      .from("designers")
      .select("slug, data")
      .eq("slug", acc.username)
      .limit(1)
      .maybeSingle();
    return data ? { slug: data.slug, data: data.data } : null;
  } catch (err) {
    console.log("findDesignerByPortalEmail error:", err);
    return null;
  }
}

async function findDesignerByEmail(email: string): Promise<{ slug: string; data: any } | null> {
  if (!email) return null;
  // 1) Authoritative: match against ons-portal portal_accounts → username = slug
  const viaPortal = await findDesignerByPortalEmail(email);
  if (viaPortal) return viaPortal;
  // 2) Fallback: legacy profiles that only have contactEmail stamped on designers.data
  const sb = getDesignerSupabase();
  const normalized = email.trim().toLowerCase();
  // Use ilike on the extracted JSON field — case-insensitive exact match.
  const { data } = await sb
    .from("designers")
    .select("slug, data")
    .ilike("data->>contactEmail", normalized)
    .limit(1)
    .maybeSingle();
  return data ? { slug: data.slug, data: data.data } : null;
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const sanitized = (base || "firm").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "firm";
  const sb = getDesignerSupabase();
  let candidate = sanitized;
  let i = 2;
  while (true) {
    const { data } = await sb.from("designers").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${sanitized}-${i}`;
    i++;
    if (i > 50) return `${sanitized}-${crypto.randomUUID().slice(0, 6)}`;
  }
}

// ─── Airtable sync for firm onboarding → Clients Pipeline ────────────
const AIRTABLE_BASE_ID = "appGjpb5nuJA3abDN";
const AIRTABLE_TABLE_ID = "tblbnvUlMukbK2NRy"; // Clients Pipeline

// PATCH the existing Airtable ID Profiles record the user picked during onboarding.
async function updateAirtableFirmProfile(recordId: string, studio: any, email: string) {
  const token = Deno.env.get("AIRTABLE_TOKEN");
  if (!token || !recordId) return;
  const s = (v: any) => (typeof v === "string" ? v.trim() : "");
  const arr = (v: any) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
  const licenses = arr(studio.licenses);
  const licensesOther = s(studio.licensesOther);
  if (licensesOther) licenses.push(licensesOther);
  const notesParts = [
    s(studio.tagline) && `Tagline: ${s(studio.tagline)}`,
    s(studio.bio) && `Bio: ${s(studio.bio)}`,
    s(studio.googleMapsUrl) && `Google Maps: ${s(studio.googleMapsUrl)}`,
    s(studio.logoImage) && `Logo: ${s(studio.logoImage)}`,
  ].filter(Boolean);
  const fields: Record<string, any> = {};
  if (email) fields["Email"] = email;
  if (notesParts.length) fields["Notes"] = notesParts.join("\n\n");
  const yearsNum = Number(s(studio.yearsExperience));
  if (Number.isFinite(yearsNum) && yearsNum > 0) fields["Years of Experience"] = yearsNum;
  if (s(studio.acraUen)) fields["ACRA/UEN"] = s(studio.acraUen);
  if (s(studio.officeAddress)) fields["Office Address"] = s(studio.officeAddress);
  if (s(studio.landedEligibility)) fields["Landed Project Eligibility"] = s(studio.landedEligibility);
  if (s(studio.financing)) fields["Renovation Financing"] = s(studio.financing);
  if (s(studio.portfolioUrl)) fields["Portfolio"] = s(studio.portfolioUrl);
  if (arr(studio.serviceArea).length) fields["Service Area"] = arr(studio.serviceArea);
  if (arr(studio.serviceProvided).length) fields["Services"] = arr(studio.serviceProvided);
  if (arr(studio.projectTypes).length) fields["Typical Project Type"] = arr(studio.projectTypes);
  if (arr(studio.designStyles).length) fields["Design Styles"] = arr(studio.designStyles);
  if (arr(studio.specialisation).length) fields["Specialization"] = arr(studio.specialisation);
  if (arr(studio.budgetRange).length) fields["Budget Range"] = arr(studio.budgetRange);
  if (licenses.length) fields["Licenses"] = licenses;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("Airtable PATCH failed:", res.status, text.slice(0, 300));
    } else {
      console.log("Airtable PATCH ok for record:", recordId);
    }
  } catch (err) {
    console.log("Airtable PATCH error:", err);
  }
}

// unused — kept for reference. Creates a NEW Airtable row (legacy push flow).
async function syncFirmToAirtable(studio: any, email: string, slug: string) {
  const token = Deno.env.get("AIRTABLE_TOKEN");
  if (!token) {
    console.log("AIRTABLE_TOKEN not set, skipping Airtable sync");
    return;
  }
  const s = (v: any) => (typeof v === "string" ? v.trim() : "");
  const arr = (v: any) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
  const licenses = arr(studio.licenses);
  const licensesOther = s(studio.licensesOther);
  if (licensesOther) licenses.push(licensesOther);
  const notesParts = [
    s(studio.tagline) && `Tagline: ${s(studio.tagline)}`,
    s(studio.bio) && `Bio: ${s(studio.bio)}`,
    s(studio.googleMapsUrl) && `Google Maps: ${s(studio.googleMapsUrl)}`,
    slug && `Slug: ${slug}`,
  ].filter(Boolean);
  const fields: Record<string, any> = {
    "Client": String(studio.firmName || "").slice(0, 200),
    "Email": email,
    "Classification": "Renovator",
    "Stage": "Closed Won",
    "Won Status": "Ongoing",
    "Lead Source": "Website",
    "Notes": notesParts.join("\n\n"),
  };
  const yearsNum = Number(s(studio.yearsExperience));
  if (Number.isFinite(yearsNum) && yearsNum > 0) fields["Years of Experience"] = yearsNum;
  if (s(studio.acraUen)) fields["ACRA/UEN"] = s(studio.acraUen);
  if (s(studio.officeAddress)) fields["Office Address"] = s(studio.officeAddress);
  if (s(studio.landedEligibility)) fields["Landed Project Eligibility"] = s(studio.landedEligibility);
  if (s(studio.financing)) fields["Renovation Financing"] = s(studio.financing);
  if (s(studio.portfolioUrl)) fields["Portfolio"] = s(studio.portfolioUrl);
  if (arr(studio.serviceArea).length) fields["Service Area"] = arr(studio.serviceArea);
  if (arr(studio.serviceProvided).length) fields["Services"] = arr(studio.serviceProvided);
  if (arr(studio.projectTypes).length) fields["Typical Project Type"] = arr(studio.projectTypes);
  if (arr(studio.designStyles).length) fields["Design Styles"] = arr(studio.designStyles);
  if (arr(studio.specialisation).length) fields["Specialization"] = arr(studio.specialisation);
  if (arr(studio.budgetRange).length) fields["Budget Range"] = arr(studio.budgetRange);
  if (licenses.length) fields["Licenses"] = licenses;
  try {
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("Airtable sync failed:", res.status, text.slice(0, 300));
    } else {
      console.log("Airtable sync ok for firm:", slug);
    }
  } catch (err) {
    console.log("Airtable sync error:", err);
  }
}

function buildProjectMeta(p: any): string {
  const parts: string[] = [];
  if (p?.propertyType) parts.push(String(p.propertyType));
  if (p?.size) parts.push(`${p.size}${p.sizeUnit ? " " + p.sizeUnit : ""}`);
  if (p?.cost) parts.push(`SGD ${p.cost}`);
  if (p?.year) parts.push(String(p.year));
  return parts.join(" · ");
}

app.post("/make-server-4808de5e/firm-onboarding-submit", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many submissions. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);

    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") return c.json({ error: "Invalid payload" }, 400);
    const variant = body.variant === "project-only" ? "project-only" : "full";
    const project = body.project || {};
    const hasProject = typeof project === "object" && !!project.title;
    // project is required for "project-only" but optional for "full" (firm-onboarding)
    if (variant === "project-only" && !hasProject) {
      return c.json({ error: "Missing project details" }, 400);
    }
    if (variant === "full" && (!body.studio || !body.studio.firmName)) {
      return c.json({ error: "Missing studio info" }, 400);
    }

    const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim().slice(0, 200) : "";
    const studioEmail = typeof body.studio?.contactEmail === "string" ? body.studio.contactEmail.trim().slice(0, 200) : "";
    const email = (contactEmail || studioEmail).toLowerCase();

    // Audit log (KV) — keep existing behaviour for debugging
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    await kv.set(`onboarding:submission:${id}`, {
      id, variant,
      studio: body.studio || null,
      project,
      contactEmail: email || null,
      ip,
      ts: new Date().toISOString(),
    });

    const now = new Date().toISOString();
    // Image ingestion. Two sources:
    //   1. Inbound image URLs from the client (project-import via Qanvast →
    //      project.images). Mirrored as-is to our storage.
    //   2. A Google Drive folder link in driveUrl (firm-onboarding project
    //      form). We list the folder via Drive API and use Drive's public
    //      thumbnail URLs directly — mirroring full-res photos inside the
    //      edge function hits Deno Deploy's WORKER_RESOURCE_LIMIT.
    const inboundImagesPre: string[] = Array.isArray(project.images) ? project.images.slice(0, 40).map(String) : [];
    const inboundDriveUrl = String(project.driveUrl || "");
    const isDriveFolder = /drive\.google\.com/i.test(inboundDriveUrl) && !!extractDriveFolderId(inboundDriveUrl);
    let mirroredImagesPre: string[] = [];
    if (inboundImagesPre.length) {
      mirroredImagesPre = await mirrorProjectImages(inboundImagesPre);
    } else if (isDriveFolder) {
      mirroredImagesPre = await listDriveFolderImageUrls(inboundDriveUrl);
    }
    // Mirror floor plan separately so it never lands in the gallery scroll.
    const inboundFloorPlan = String((project as any).floorPlan || "").slice(0, 600);
    const mirroredFloorPlan = inboundFloorPlan ? (await mirrorProjectImages([inboundFloorPlan]))[0] || "" : "";
    const pendingProject = {
      name: String(project.title || "").slice(0, 200),
      meta: buildProjectMeta(project),
      image: mirroredImagesPre[0] || "",
      gallery: mirroredImagesPre.slice(1).map((src) => ({ src, caption: "" })),
      floorPlan: mirroredFloorPlan,
      driveUrl: String(project.driveUrl || "").slice(0, 500),
      location: String(project.location || "").slice(0, 200),
      cost: String(project.cost || "").slice(0, 100),
      size: String(project.size || "").slice(0, 100),
      sizeUnit: String(project.sizeUnit || "").slice(0, 20),
      year: String(project.year || "").slice(0, 8),
      propertyType: String(project.propertyType || "").slice(0, 60),
      propertySubType: String(project.propertySubType || "").slice(0, 80),
      style: String(project.style || "").slice(0, 100),
      worksIncluded: Array.isArray(project.worksIncluded) ? project.worksIncluded.slice(0, 20).map(String) : [],
      submittedAt: now,
    };

    // Mirrored upstream at pendingProject construction.
    const mirroredImages = mirroredImagesPre;
    const inboundSourceUrl = String(project.sourceUrl || "").slice(0, 500);

    let resultSlug: string | null = null;
    let isUpdate = false;

    if (variant === "full") {
      if (!email) return c.json({ error: "Contact email is required" }, 400);
      const existing = await findDesignerByEmail(email);
      // If the firm already exists, update their details instead of blocking
      const slug = existing ? existing.slug : await ensureUniqueSlug(body.studio.firmName);
      isUpdate = !!existing;
      const studio = body.studio;
      const s = (v: any) => (typeof v === "string" ? v.trim() : "");
      const arr = (v: any) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
      const licenses = arr(studio.licenses);
      const licensesOther = s(studio.licensesOther);
      if (licensesOther) licenses.push(licensesOther);
      const years = s(studio.yearsExperience);
      const landedEligibility = s(studio.landedEligibility);
      const financing = s(studio.financing);
      const portfolioUrl = s(studio.portfolioUrl);

      // For updates, preserve certain fields from the existing profile
      const existingData = isUpdate ? (existing.data || {}) : {};

      // Resolve a Google Place ID from the pasted Maps URL so the reviews
      // resolver (which keys off `googlePlaceId`) can fetch via Outscraper.
      // Falls back to the existing value on update if extraction fails.
      const resolvedPlaceId = await extractPlaceIdFromMapsUrl(String(studio.googleMapsUrl || ""));
      const googlePlaceId: string | undefined =
        resolvedPlaceId || (isUpdate ? existingData.googlePlaceId : undefined);

      const profile: any = {
        name: String(studio.firmName || "").slice(0, 120),
        slug,
        tagline: String(studio.tagline || "").slice(0, 200),
        bio: String(studio.bio || "").slice(0, 2000),
        images: {
          logo: String(studio.logoImage || "") || existingData.images?.logo || "",
          map: String(studio.googleMapsUrl || "") || existingData.images?.map || "",
          ...(isUpdate && existingData.images?.cover ? { cover: existingData.images.cover } : {}),
        },
        googleMapsLink: String(studio.googleMapsUrl || ""),
        ...(googlePlaceId ? { googlePlaceId } : {}),
        contactEmail: email,
        // Preserve verified/active status for existing firms
        verified: isUpdate ? (existingData.verified ?? false) : false,
        active: isUpdate ? (existingData.active ?? false) : false,
        acraUen: s(studio.acraUen),
        yearsExperience: years,
        licenses,
        officeAddress: s(studio.officeAddress),
        serviceArea: arr(studio.serviceArea),
        serviceProvided: arr(studio.serviceProvided),
        projectTypes: arr(studio.projectTypes),
        designStyles: arr(studio.designStyles),
        specialisation: arr(studio.specialisation),
        budgetRange: arr(studio.budgetRange),
        financing,
        portfolioUrl,
        location: arr(studio.serviceArea).join(", "),
        stats: years ? { years: Number(years) || 0, ...(isUpdate && existingData.stats ? { rating: existingData.stats.rating } : {}) } : (isUpdate ? existingData.stats : undefined),
        credentials: {
          hdb: { active: licenses.some((l: string) => /hdb/i.test(l)), reg: isUpdate ? (existingData.credentials?.hdb?.reg || "") : "" },
          bca: { active: licenses.some((l: string) => /bca/i.test(l)), reg: isUpdate ? (existingData.credentials?.bca?.reg || "") : "" },
          landedEligible: landedEligibility === "Landed Homes" || landedEligibility === "Selected Landed Homes",
          landedEligibilityLabel: landedEligibility,
        },
        submittedAt: isUpdate ? (existingData.submittedAt || now) : now,
        createdAt: isUpdate ? (existingData.createdAt || now) : now,
        updatedAt: now,
      };

      const businessInfo = [
        { label: "ACRA / UEN", value: s(studio.acraUen) },
        { label: "Office address", value: s(studio.officeAddress) },
        { label: "Project types", value: arr(studio.projectTypes).join(", ") },
        { label: "Style specialisation", value: arr(studio.designStyles).join(", ") },
        { label: "Service area", value: arr(studio.serviceArea).join(", ") },
        { label: "Specialisation", value: arr(studio.specialisation).join(", ") },
        { label: "Services", value: arr(studio.serviceProvided).join(", ") },
        { label: "Financing", value: financing },
        { label: "Budget range", value: arr(studio.budgetRange).join(", ") },
        { label: "Licenses", value: licenses.join(", ") },
        { label: "Portfolio", value: portfolioUrl },
      ].filter((r) => r.value);

      await saveDesignerProfile(slug, profile);

      // Fire-and-forget Google Reviews seed when we have a (new or changed)
      // place ID. The handler is best-effort — if Outscraper isn't configured
      // or the call fails, we log and move on so the onboarding response
      // doesn't get blocked on an external API.
      if (googlePlaceId && googlePlaceId !== existingData.googlePlaceId) {
        getOrRefreshGoogleReviews(slug, { forceRefresh: true })
          .then((data) => console.log(`Seeded Google reviews on onboarding: slug=${slug} source=${data.source} count=${data.reviews.length}`))
          .catch((e) => console.log(`Failed to seed Google reviews on onboarding for ${slug}:`, e));
      }

      if (hasProject) {
        if (isUpdate) {
          // Append new project to existing projects list
          const currentProjects = await getDesignerSection(slug, "projects");
          const projectsList = Array.isArray(currentProjects) ? currentProjects : [];
          projectsList.push(pendingProject);
          await saveDesignerSection(slug, "projects", projectsList);
        } else {
          await saveDesignerSection(slug, "projects", [pendingProject]);
        }
        // Dual-write: row-per-project table (keeps KV blob above for rollback).
        await insertDesignerProjectRow(slug, {
          title: pendingProject.name,
          location: pendingProject.location,
          cost: pendingProject.cost,
          size: pendingProject.size,
          sizeUnit: pendingProject.sizeUnit,
          year: pendingProject.year,
          propertyType: pendingProject.propertyType,
          propertySubType: pendingProject.propertySubType,
          style: pendingProject.style,
          worksIncluded: pendingProject.worksIncluded,
          driveUrl: pendingProject.driveUrl,
          images: mirroredImages,
          sourceUrl: inboundSourceUrl,
          variant,
          contactEmail: email,
          submittedAt: now,
        });
      }
      if (businessInfo.length) await saveDesignerSection(slug, "businessinfo", businessInfo);
      resultSlug = slug;
      if (studio?.airtableRecordId) {
        await updateAirtableFirmProfile(studio.airtableRecordId, studio, email);
      }
    } else {
      // Project-only submissions attach to a firm picked from the Airtable
      // dropdown. We identify the firm by its name (and record ID if the
      // client passes one) — no email match required. If no designer row
      // exists yet for that firm we create an inactive stub so the project
      // has somewhere to land; it'll be adopted when the firm onboards.
      const submittedFirmName = String(body.firmName || "").trim().slice(0, 200);
      const submittedRecordId = String(body.airtableRecordId || "").trim().slice(0, 80);
      if (!submittedFirmName) return c.json({ error: "Firm name is required" }, 400);

      const sb = getDesignerSupabase();
      // Look up by name, but exclude soft-deleted rows so we don't land
      // projects on an archived duplicate. Pull a few candidates and pick
      // the first non-deleted one (or fall through to the stub branch).
      const { data: candidates } = await sb
        .from("designers")
        .select("slug, data")
        .ilike("name", submittedFirmName)
        .limit(5);
      const matchByName = (candidates || []).find((c: any) => !c?.data?.deletedAt) || null;

      let slug: string;
      if (matchByName) {
        slug = matchByName.slug;
      } else {
        slug = await ensureUniqueSlug(submittedFirmName);
        await saveDesignerProfile(slug, {
          name: submittedFirmName,
          slug,
          ...(email ? { contactEmail: email } : {}),
          ...(submittedRecordId ? { airtableRecordId: submittedRecordId } : {}),
          active: false,
          verified: false,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      const current = await getDesignerSection(slug, "projects");
      const list = Array.isArray(current) ? current : [];
      list.push(pendingProject);
      await saveDesignerSection(slug, "projects", list);
      await insertDesignerProjectRow(slug, {
        title: pendingProject.name,
        location: pendingProject.location,
        cost: pendingProject.cost,
        size: pendingProject.size,
        sizeUnit: pendingProject.sizeUnit,
        year: pendingProject.year,
        propertyType: pendingProject.propertyType,
        propertySubType: pendingProject.propertySubType,
        style: pendingProject.style,
        worksIncluded: pendingProject.worksIncluded,
        driveUrl: pendingProject.driveUrl,
        images: mirroredImages,
        sourceUrl: inboundSourceUrl,
        variant,
        contactEmail: email,
        submittedAt: now,
      });
      resultSlug = slug;
    }

    sendNtfyOnboarding({
      firmName: body.studio?.firmName || email || resultSlug || "(unknown)",
      variant: isUpdate
        ? `${variant} UPDATE (existing firm details updated)`
        : `${variant} (inactive — awaiting activation)`,
      projectTitle: String(project.title || "").slice(0, 120),
    }).catch(() => {});

    return c.json({ ok: true, id, slug: resultSlug, updated: isUpdate });
  } catch (err) {
    console.log("firm-onboarding-submit error:", err);
    return c.json({ error: "Submission failed" }, 500);
  }
});

// ─── Airtable PULL: Clients Pipeline "ALL" view → /firm-onboarding dropdown + prefill ───

const AIRTABLE_FIRMS_CACHE: { at: number; data: { id: string; firmName: string }[] } = { at: 0, data: [] };
const AIRTABLE_FIRMS_TTL_MS = 5 * 60 * 1000;

/** Resolve a batch of Airtable linked-record IDs to their primary-field
 *  display names. Uses the Meta API to discover which table the source
 *  field links to, then fetches the linked records by id. Cached for the
 *  same TTL as the firms list to avoid repeated schema lookups. */
const LINKED_TABLE_CACHE = new Map<string, { tableId: string; at: number }>();
const LINKED_NAMES_CACHE = new Map<string, { names: Map<string, string>; at: number }>();
async function resolveLinkedRecordNames(sourceFieldName: string | null, ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!sourceFieldName || ids.length === 0) return out;
  const token = Deno.env.get("AIRTABLE_TOKEN");
  if (!token) return out;
  try {
    // 1. Discover the linked table id via Meta API (cached per source field).
    const cached = LINKED_TABLE_CACHE.get(sourceFieldName);
    let linkedTableId = cached && Date.now() - cached.at < AIRTABLE_FIRMS_TTL_MS ? cached.tableId : "";
    if (!linkedTableId) {
      const metaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!metaRes.ok) return out;
      const meta = await metaRes.json();
      for (const t of meta.tables || []) {
        for (const f of t.fields || []) {
          if (f.name === sourceFieldName && f.type === "multipleRecordLinks") {
            linkedTableId = f.options?.linkedTableId || "";
            if (linkedTableId) {
              LINKED_TABLE_CACHE.set(sourceFieldName, { tableId: linkedTableId, at: Date.now() });
              break;
            }
          }
        }
        if (linkedTableId) break;
      }
    }
    if (!linkedTableId) return out;

    // 2. Pull the linked table once (cached) and build an id → primary-field map.
    const namesCached = LINKED_NAMES_CACHE.get(linkedTableId);
    if (namesCached && Date.now() - namesCached.at < AIRTABLE_FIRMS_TTL_MS) {
      for (const id of ids) {
        const n = namesCached.names.get(id);
        if (n) out.set(id, n);
      }
      return out;
    }
    const map = new Map<string, string>();
    let offset: string | undefined;
    for (let i = 0; i < 10; i++) {
      const qs = `pageSize=100${offset ? `&offset=${encodeURIComponent(offset)}` : ""}`;
      const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${linkedTableId}?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) break;
      const j = await res.json();
      for (const r of j.records || []) {
        const fields = r.fields || {};
        // Primary field is usually the first key Airtable returns; fall back to
        // common variants if the schema has reordered fields.
        const name = fields.Name || fields["Full Name"] || Object.values(fields)[0] || "";
        if (typeof name === "string" && name.trim()) map.set(r.id, name.trim());
      }
      offset = j.offset;
      if (!offset) break;
    }
    LINKED_NAMES_CACHE.set(linkedTableId, { names: map, at: Date.now() });
    for (const id of ids) {
      const n = map.get(id);
      if (n) out.set(id, n);
    }
  } catch (err) {
    console.log("resolveLinkedRecordNames error:", err);
  }
  return out;
}

async function fetchAirtableIdProfiles(fields: string[] = ["Client"]): Promise<any[]> {
  const token = Deno.env.get("AIRTABLE_TOKEN");
  if (!token) throw new Error("AIRTABLE_TOKEN not configured");
  const records: any[] = [];
  let offset: string | undefined;
  const baseQs = `view=${encodeURIComponent("ALL")}&pageSize=100${fields.map((f) => `&fields%5B%5D=${encodeURIComponent(f)}`).join("")}`;
  for (let i = 0; i < 10; i++) {
    const qs = offset ? `${baseQs}&offset=${encodeURIComponent(offset)}` : baseQs;
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Airtable list failed: ${res.status}`);
    const json = await res.json();
    records.push(...(json.records || []));
    offset = json.offset;
    if (!offset) break;
  }
  return records;
}

// Lightweight count of firms in our Airtable pipeline — used by the Escrow
// landing hero ("120+ vetted firms") and similar marketing surfaces so the
// number stays in sync with reality. Piggybacks on the same in-memory cache
// as /airtable-firms; on a cold call it fetches the minimum field set.
app.get("/make-server-4808de5e/firm-onboarding/airtable-firms-count", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ count: 0, error: "Unauthorized" }, 401);
    const now = Date.now();
    if (now - AIRTABLE_FIRMS_CACHE.at < AIRTABLE_FIRMS_TTL_MS && AIRTABLE_FIRMS_CACHE.data.length) {
      return c.json({ count: AIRTABLE_FIRMS_CACHE.data.length, cached: true });
    }
    // Cold path: only fetch the Client field so we can count populated firms
    // cheaply without pulling the heavier sales-rep + linked-record graph.
    const records = await fetchAirtableIdProfiles(["Client"]);
    const count = records.filter((r) => String(r.fields?.Client || "").trim()).length;
    return c.json({ count, cached: false });
  } catch (err) {
    console.log("airtable-firms-count error:", err);
    return c.json({ count: 0, error: "Failed to load firm count" }, 500);
  }
});

app.get("/make-server-4808de5e/firm-onboarding/airtable-firms", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const now = Date.now();
    if (now - AIRTABLE_FIRMS_CACHE.at < AIRTABLE_FIRMS_TTL_MS && AIRTABLE_FIRMS_CACHE.data.length) {
      return c.json({ firms: AIRTABLE_FIRMS_CACHE.data, cached: true });
    }
    // Pull all fields so we can locate the sales-rep column whatever the exact
    // header reads ("Sales Representatives" / "Sales Rep" / "Sales Representative").
    const records = await fetchAirtableIdProfiles([]);
    const findRepFieldKey = (fields: Record<string, any>): string | null => {
      for (const k of Object.keys(fields || {})) {
        if (/sales\s*rep/i.test(k)) return k;
      }
      return null;
    };
    const repFieldKey = records[0]?.fields ? findRepFieldKey(records[0].fields) : null;

    // Collect every linked rep id across all firms, then resolve them to
    // names in one batch via the linked table (Sales Representative is a
    // linked-record column, so the raw values are recXXX ids, not strings).
    const linkedIds = new Set<string>();
    const rawRepsByFirm = new Map<string, string[]>();
    for (const r of records) {
      const raw = repFieldKey ? r.fields?.[repFieldKey] : null;
      const ids: string[] = Array.isArray(raw) ? raw.filter((v: any) => typeof v === "string") : [];
      rawRepsByFirm.set(r.id, ids);
      ids.forEach((id) => linkedIds.add(id));
    }
    const repIdToName = await resolveLinkedRecordNames(repFieldKey, Array.from(linkedIds));

    const firms = records
      .map((r) => {
        const ids = rawRepsByFirm.get(r.id) || [];
        const reps = ids.map((id) => repIdToName.get(id) || id).filter(Boolean);
        return {
          id: r.id as string,
          firmName: String(r.fields?.Client || "").trim(),
          contactEmail: String(r.fields?.Email || "").trim(),
          salesRep: reps[0] || "",
          salesReps: reps,
        };
      })
      .filter((f) => f.id && f.firmName)
      .sort((a, b) => a.firmName.localeCompare(b.firmName));
    AIRTABLE_FIRMS_CACHE.at = now;
    AIRTABLE_FIRMS_CACHE.data = firms;
    return c.json({ firms, cached: false });
  } catch (err) {
    console.log("airtable-firms error:", err);
    return c.json({ error: "Failed to load firms" }, 500);
  }
});

function digitsOnly(s: string): string { return String(s || "").replace(/\D+/g, ""); }

// Lightweight check: "is this email registered to a firm we can attach a project to?"
// Mirrors the submit-time resolution order (portal_accounts → designers).
app.post("/make-server-4808de5e/firm-onboarding/project-email-check", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many attempts" }, 429);
    const body = await c.req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ ok: false, message: "Enter a valid email" }, 400);
    }
    const match = await findDesignerByEmail(email);
    if (!match) {
      return c.json({ ok: false, message: "No firm found for this email." }, 404);
    }
    const firmName = match.data?.name || match.data?.firmName || match.slug;
    return c.json({ ok: true, firmName, slug: match.slug });
  } catch (err) {
    console.log("project-email-check error:", err);
    return c.json({ ok: false, message: "Lookup failed" }, 500);
  }
});

// ─── Qanvast scrape — diagnostic endpoint for /qanvast-import-test ───
// Takes a qanvast.com URL server-side and returns parsed project/firm data.
// No writes, no caching. Used only by the dev test page.
app.post("/make-server-4808de5e/qanvast-scrape", async (c) => {
  const started = Date.now();
  try {
    if (!(await verifyAuth(c))) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ ok: false, message: "Too many requests" }, 429);

    const body = await c.req.json().catch(() => null);
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl) return c.json({ ok: false, message: "Missing url" }, 400);

    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch {
      return c.json({ ok: false, message: "Invalid URL" }, 400);
    }
    if (!/(^|\.)qanvast\.com$/i.test(parsed.hostname)) {
      return c.json({ ok: false, message: "Only qanvast.com URLs allowed" }, 400);
    }

    // Fetch server-side with a realistic UA
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let html = "";
    let httpStatus = 0;
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-SG,en-US;q=0.9,en;q=0.8",
        },
      });
      httpStatus = res.status;
      html = await res.text();
    } catch (err: any) {
      clearTimeout(timeout);
      return c.json({ ok: false, message: "Fetch failed: " + (err?.message || String(err)), status: httpStatus, elapsedMs: Date.now() - started });
    }
    clearTimeout(timeout);

    if (!html || httpStatus < 200 || httpStatus >= 400) {
      return c.json({ ok: false, message: `Upstream responded ${httpStatus}`, status: httpStatus, elapsedMs: Date.now() - started, htmlPreview: html.slice(0, 500) });
    }

    // ── Next.js / Nuxt / generic hydration payload ──
    let nextData: any = null;
    const nextMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextMatch) { try { nextData = JSON.parse(nextMatch[1]); } catch {} }
    if (!nextData) {
      const nuxtMatch = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});/);
      if (nuxtMatch) { try { nextData = JSON.parse(nuxtMatch[1]); } catch {} }
    }
    if (!nextData) {
      const initMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/);
      if (initMatch) { try { nextData = JSON.parse(initMatch[1]); } catch {} }
    }

    // ── Next.js App Router RSC payload (Qanvast uses this) ──
    // Stream chunks look like: self.__next_f.push([1,"3c:{...}\n3d:[...]\n"])
    // Concatenate all pushed strings, unescape, then parse ref-keyed chunks.
    const rscDict: Record<string, any> = {};
    const rscChunks: string[] = [];
    const rscPushRe = /self\.__next_f\.push\(\s*\[\s*\d+\s*,\s*"((?:[^"\\]|\\.)*)"\s*\]\s*\)/g;
    let rm: RegExpExecArray | null;
    while ((rm = rscPushRe.exec(html))) rscChunks.push(rm[1]);
    if (rscChunks.length) {
      const unescape = (s: string) => s
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const rsc = rscChunks.map(unescape).join("");
      // Refs look like `3c:{...}` or `3d:["..."]`. Use a balanced-bracket scanner
      // so nested arrays/objects (the entire shape of the project record, the long
      // otherWorks array under `3d`, etc.) don't terminate prematurely on a regex's
      // first closing bracket. Walks the string once, O(n).
      const refHeadRe = /(?:^|\n)([0-9a-f]+):(?=[\{\[])/g;
      let refMatch: RegExpExecArray | null;
      while ((refMatch = refHeadRe.exec(rsc))) {
        const key = refMatch[1];
        const start = refMatch.index + refMatch[0].length;
        const open = rsc[start];
        const close = open === "{" ? "}" : "]";
        let depth = 0;
        let inStr = false;
        let esc = false;
        let end = -1;
        for (let i = start; i < rsc.length; i++) {
          const c = rsc[i];
          if (inStr) {
            if (esc) esc = false;
            else if (c === "\\") esc = true;
            else if (c === '"') inStr = false;
            continue;
          }
          if (c === '"') { inStr = true; continue; }
          if (c === open) depth++;
          else if (c === close) {
            depth--;
            if (depth === 0) { end = i + 1; break; }
          }
        }
        if (end > start) {
          try { rscDict[key] = JSON.parse(rsc.slice(start, end)); } catch {}
          // Advance the regex past this body so we don't re-match `XX:{`
          // patterns sitting inside a parsed record's string values.
          refHeadRe.lastIndex = end;
        }
      }
    }

    // Resolve Qanvast RSC references like "$3e" → rscDict["3e"].
    const resolveRef = (v: any): any => {
      if (typeof v === "string" && /^\$[0-9a-f]+$/.test(v)) return rscDict[v.slice(1)] ?? v;
      return v;
    };

    // ── JSON-LD (schema.org) — often the cleanest source on SEO pages ──
    const jsonLd: any[] = [];
    const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let lm: RegExpExecArray | null;
    while ((lm = ldRe.exec(html))) {
      try { jsonLd.push(JSON.parse(lm[1].trim())); } catch {}
    }

    // ── OG tags ──
    const ogTags: Record<string, string> = {};
    const ogRe = /<meta[^>]+property=["']og:([a-zA-Z_:]+)["'][^>]+content=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = ogRe.exec(html))) ogTags[m[1]] = m[2];
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : "";

    // ── Images ──
    // Upgrade Qanvast Cloudfront URLs (which are served at 720-width / standard /
    // etc. on the rendered HTML) to the 2048-width variant for higher-res photos.
    const upgradeQanvastImg = (src: string) =>
      /d1hy6t2xeg0mdl\.cloudfront\.net\/image\/[^/]+\/[^/]+\/[\w-]+$/.test(src)
        ? src.replace(/\/[\w-]+$/, "/2048-width")
        : src;
    const imgSet = new Set<string>();
    const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((m = imgRe.exec(html))) {
      const src = m[1];
      if (/cdn\.qanvast|qanvast\.com|cloudfront|images\.qanvast/i.test(src)) imgSet.add(upgradeQanvastImg(src));
    }
    if (ogTags.image) imgSet.add(upgradeQanvastImg(ogTags.image));

    // ── Classify kind from URL path (broadened) ──
    const pathname = parsed.pathname.toLowerCase();
    const kind: "firm" | "project" | "unknown" =
      /\/sg\/projects?\//.test(pathname) ? "project" :
      /\/sg\/interior-design-singapore\/[^/]+$/.test(pathname) ? "project" :
      /\/sg\/firm/.test(pathname) ? "firm" :
      /\/sg\/interior-designer\/[^/]+$/.test(pathname) ? "firm" :
      "unknown";

    // ── Heuristic field extraction from rendered HTML ──
    // Qanvast project pages render labelled stats like "Budget $50,000" or "Size 1,100 sqft".
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const htmlText = stripTags(html);
    // Match a labelled stat in the *visible* page text (e.g. "Style: Modern", "Completed - 2024").
    // Match against stripped text only (so "Style" inside `<link rel="stylesheet">` or random JSON
    // prose doesn't leak through), require a word-boundary on the label, and require an explicit
    // separator (":", "-", em/en dash) — bare adjacency picks up too many false positives.
    const afterLabel = (label: string): string | undefined => {
      const re = new RegExp(`\\b${label}\\b\\s*[:\\-–—]\\s*([^|\\n\\r]{2,80})`, "i");
      const mm = htmlText.match(re);
      return mm ? mm[1].trim().slice(0, 80) : undefined;
    };
    const firstMatch = (re: RegExp) => { const mm = htmlText.match(re); return mm ? mm[0] : undefined; };
    const extractedBudget = firstMatch(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/);
    const extractedSize = firstMatch(/\b[\d,]{2,6}\s*(?:sqft|sq\.?\s*ft|sqm|m²)\b/i);
    const extractedYear = afterLabel("Completed") || afterLabel("Year");
    const extractedHome = afterLabel("Home Type") || afterLabel("Property Type");
    const extractedStyle = afterLabel("Style");
    const extractedRooms = afterLabel("Rooms");

    // ── Normalizers that map scraped fields onto our /firm-onboarding/project schema ──
    // Our form uses propertyType ∈ {HDB, Condominium, Landed, Commercial}. Map aggressively.
    const classifyPropertyType = (text: string): { propertyType: string; propertySubType: string } => {
      const t = text.toLowerCase();
      if (/\bhdb\b|bto\b|\b\d-room\b|executive\s+apartment|maisonette|\bdbss\b/.test(t)) {
        const sub = (text.match(/\b\d-Room\b/i) || text.match(/\bExecutive\b/i) || text.match(/\bMaisonette\b/i) || [""])[0];
        return { propertyType: "HDB", propertySubType: sub };
      }
      if (/penthouse|\b\d-bedroom\b|\bcondo(minium)?\b|\bapartment\b|\bec\b|executive\s+condo/.test(t)) {
        const sub = (text.match(/\bPenthouse\b/i) || text.match(/\b\d-Bedroom\b/i) || text.match(/\bStudio\b/i) || [""])[0];
        return { propertyType: "Condominium", propertySubType: sub };
      }
      if (/\bterrace\b|semi[-\s]?detached|\bbungalow\b|\bgcb\b|good\s+class\s+bungalow|\blanded\b|\bdetached\b/.test(t)) {
        let sub = "";
        if (/good\s+class/i.test(text)) sub = "Good Class Bungalow";
        else if (/bungalow/i.test(text)) sub = "Bungalow";
        else if (/semi[-\s]?detached/i.test(text)) sub = "Semi-Detached";
        else if (/terrace/i.test(text)) sub = "Terrace";
        return { propertyType: "Landed", propertySubType: sub };
      }
      if (/\bcommercial\b|\boffice\b|\bretail\b|\bf&b\b|restaurant|cafe\b/.test(t)) {
        return { propertyType: "Commercial", propertySubType: "" };
      }
      return { propertyType: "", propertySubType: "" };
    };

    // Split "1,100 sqft" → { num: "1,100", unit: "sqft" }
    const splitSize = (s: string | undefined): { num: string; unit: string } => {
      if (!s) return { num: "", unit: "" };
      const mm = s.match(/^([\d,]+)\s*(sqft|sq\.?\s*ft|sqm|m²)?/i);
      if (!mm) return { num: "", unit: "" };
      const unitRaw = (mm[2] || "sqft").toLowerCase().replace(/\s|\./g, "");
      const unit = unitRaw === "m²" ? "m²" : unitRaw === "sqm" ? "sqm" : "sqft";
      return { num: mm[1], unit };
    };

    // Format a scraped budget like "$50,000" (pass-through, trimmed to first value)
    const normalizeCost = (s: string | undefined): string => {
      if (!s) return "";
      const mm = s.match(/\$[\d,]+/);
      return mm ? mm[0] : "";
    };

    // Known style keywords — hit test on title + description
    const STYLE_WORDS = [
      "Scandinavian", "Contemporary", "Modern", "Minimalist", "Industrial",
      "Japandi", "Muji", "Classic", "Eclectic", "Vintage", "Bohemian",
      "Mediterranean", "Transitional", "Mid-Century Modern", "Mid-Century",
      "Resort", "Tropical", "Rustic", "Luxury", "Coastal", "Traditional", "Retro",
    ];
    const detectStyle = (haystack: string): string => {
      const h = haystack || "";
      for (const w of STYLE_WORDS) {
        if (new RegExp(`\\b${w.replace(/\s/g, "\\s")}\\b`, "i").test(h)) return w;
      }
      return "";
    };

    // worksIncluded — map description hits onto our 8 canonical keys
    const WORK_MAP: Array<{ key: string; re: RegExp }> = [
      { key: "carpentry", re: /\bcarpentr(y|ies)|cabinet(ry)?|wardrobe|built[-\s]?in\b/i },
      { key: "feature-wall", re: /\bfeature\s+wall|accent\s+wall\b/i },
      { key: "tiling", re: /\btil(e|es|ing)\b/i },
      { key: "aircon", re: /\baircon|air[-\s]?conditioning\b/i },
      { key: "electrical", re: /\belectrical|rewir(e|ing)\b/i },
      { key: "plumbing", re: /\bplumbing|piping\b/i },
      { key: "painting", re: /\bpaint(ing)?\b/i },
      { key: "lighting", re: /\blight(ing|s)?\b/i },
    ];
    const detectWorks = (haystack: string): string[] =>
      WORK_MAP.filter((w) => w.re.test(haystack || "")).map((w) => w.key);

    // Best-effort location from title e.g. "Waterway Sundew (Block 662A)" → "Waterway Sundew"
    const extractLocation = (title: string): string => {
      if (!title) return "";
      // Strip "| HDB (2026) by Firm | Qanvast" tail
      const clean = title.split("|")[0].trim();
      // Strip "(Block XXX)" parenthetical
      return clean.replace(/\s*\([^)]*\)\s*$/, "").trim();
    };

    // ── Build projects[] best-effort from Next.js data ──
    const projects: any[] = [];
    const pushProject = (p: any, url: string) => {
      if (!p) return;
      projects.push({
        title: String(p.title || p.name || pageTitle || "").slice(0, 300),
        description: String(p.description || p.summary || p.content || ogTags.description || "").slice(0, 4000),
        homeType: p.homeType || p.propertyType || p.home_type || undefined,
        budget: p.budget || p.budgetRange || undefined,
        size: p.size || p.areaSize || p.sqft || undefined,
        year: p.year || p.completedYear || undefined,
        rooms: p.rooms || p.numRooms || undefined,
        style: p.style || p.designStyle || undefined,
        images: Array.isArray(p.images) ? p.images.map((x: any) => typeof x === "string" ? x : (x?.url || x?.src)).filter(Boolean) : [],
        sourceUrl: url,
      });
    };

    // Walk Next.js pageProps heuristically
    const walk = (node: any, depth = 0) => {
      if (!node || depth > 6) return;
      if (typeof node !== "object") return;
      if (Array.isArray(node)) { node.forEach((x) => walk(x, depth + 1)); return; }
      // Heuristic: object with title + images[] looks like a project
      if ((node.title || node.name) && (Array.isArray(node.images) || Array.isArray(node.photos))) {
        const normalized = { ...node, images: node.images || node.photos };
        pushProject(normalized, rawUrl);
      }
      for (const k of Object.keys(node)) walk(node[k], depth + 1);
    };
    if (nextData) walk(nextData.props?.pageProps ?? nextData.props ?? nextData);

    // Firm name heuristic
    let firmName = "";
    let qanvastId: string | undefined;
    if (nextData) {
      const pp = nextData.props?.pageProps || {};
      firmName = pp.firm?.name || pp.company?.name || pp.vendor?.name || "";
      qanvastId = pp.firm?.id || pp.company?.id || undefined;
    }
    if (!firmName && kind === "firm") {
      const slugMatch = parsed.pathname.match(/\/sg\/firm\/([^/?#]+)/);
      firmName = slugMatch ? slugMatch[1] : "";
    }
    if (!firmName) firmName = ogTags["site_name"] || "";

    // Try JSON-LD to enrich a project (many Qanvast pages carry Article / Product schema)
    const flatLd: any[] = [];
    const flattenLd = (n: any) => {
      if (!n) return;
      if (Array.isArray(n)) { n.forEach(flattenLd); return; }
      if (typeof n !== "object") return;
      flatLd.push(n);
      if (n["@graph"]) flattenLd(n["@graph"]);
    };
    jsonLd.forEach(flattenLd);
    const ldByType = (t: string) => flatLd.find((x) => (x["@type"] || "").toLowerCase().includes(t.toLowerCase()));

    // ── Find the canonical project record inside the RSC dict ──
    // As of 2025, Qanvast's project record has: numeric `price`, numeric `size`,
    // string `areaUnit`, a `styles` ref, plus `commonName` / `noOfBedrooms`.
    // (Older Qanvast pages also carried `yearOfCompletion`; keep that as a fallback.)
    // We require ≥3 project-shape keys to win past photo records, which tend to
    // share `title` / `description` but none of these.
    const PROJECT_SHAPE_KEYS = [
      "price", "size", "areaUnit", "styles", "noOfBedrooms", "commonName",
      "isNewProperty", "otherWorks", "yearOfCompletion",
    ];
    const looksLikeProjectRecord = (v: any) => {
      if (!v || typeof v !== "object" || Array.isArray(v)) return false;
      const keys = Object.keys(v);
      const hits = PROJECT_SHAPE_KEYS.filter((k) => keys.includes(k));
      if (hits.length < 3) return false;
      // Sanity: if `title` is present it shouldn't look like raw HTML.
      if (typeof v.title === "string" && /[<>]/.test(v.title)) return false;
      // Sanity: if `price` is present it should be numeric.
      if ("price" in v && typeof v.price !== "number") return false;
      return true;
    };
    const projectRecord: any = Object.values(rscDict).find(looksLikeProjectRecord);
    // Firm record: has `companyId`/`companyName`, or a firm-shaped object referenced by the project.
    const firmRecord: any = Object.values(rscDict).find((v: any) =>
      v && typeof v === "object" && !Array.isArray(v) &&
      (v.companyName || v.companyId) && (v.description || v.overallRating || v.prettyUrl)
    );
    // Image base URLs — photo records carry `baseUrl` on the Cloudfront CDN.
    // Floor-plan photos are usually flagged by a category/type/tag/kind/name
    // field; we route them to a separate `floorPlanUrl` and exclude from gallery.
    const photoBaseUrls: string[] = [];
    const floorPlanCandidates: string[] = [];
    const isFloorPlanItem = (item: any): boolean => {
      if (!item || typeof item !== "object") return false;
      const fields = ["category", "type", "kind", "tag", "tags", "label", "name", "title", "section", "group"];
      for (const f of fields) {
        const v = item[f];
        if (typeof v === "string" && /floor[\s_-]?plan/i.test(v)) return true;
        if (Array.isArray(v) && v.some((x: any) => typeof x === "string" && /floor[\s_-]?plan/i.test(x))) return true;
      }
      return !!item.isFloorPlan || !!item.is_floor_plan;
    };
    // Collect ONLY photos linked to this project (via projectRecord.images).
    // Walking every Cloudfront image in the RSC dict picks up trust badges
    // (eTrust, SAFE+), other projects' photos, designer profile shots, etc.
    const seenBaseUrls = new Set<string>();
    const collectPhoto = (item: any) => {
      if (!item || typeof item !== "object" || typeof item.baseUrl !== "string") return;
      if (!/d1hy6t2xeg0mdl\.cloudfront\.net/.test(item.baseUrl)) return;
      if (seenBaseUrls.has(item.baseUrl)) return;
      seenBaseUrls.add(item.baseUrl);
      const url = item.baseUrl + "/2048-width";
      if (isFloorPlanItem(item)) floorPlanCandidates.push(url);
      else photoBaseUrls.push(url);
    };
    if (projectRecord) {
      // projectRecord.images is typically a ref like "$41" → array of refs like
      // ["$43", "$53", ...] → photo records. Resolve recursively (depth ≤ 4).
      const visited = new Set<any>();
      const walk = (v: any, depth: number) => {
        if (depth > 5 || v == null) return;
        const resolved = resolveRef(v);
        if (resolved == null || (resolved === v && typeof v === "string" && v.startsWith("$"))) return;
        if (typeof resolved !== "object") return;
        if (visited.has(resolved)) return;
        visited.add(resolved);
        if (Array.isArray(resolved)) {
          for (const item of resolved) walk(item, depth + 1);
          return;
        }
        // Photo record: collect and stop descending — its sibling fields are
        // metadata (tags, pins, productTags), not more photos.
        if (typeof (resolved as any).baseUrl === "string") {
          collectPhoto(resolved);
          return;
        }
        // Container object (e.g. { Gallery: [...], Featurette: [...], Cover: ... }).
        // Walk every value.
        for (const val of Object.values(resolved)) walk(val, depth + 1);
      };
      walk(projectRecord.images, 0);
    }
    // Direct fields on the project record that may carry a floor plan URL.
    if (projectRecord) {
      for (const k of ["floorPlan", "floorPlanUrl", "floorPlanImage", "floorplan", "layoutPlan"]) {
        const v = (projectRecord as any)[k];
        if (typeof v === "string" && /^https?:\/\//.test(v)) floorPlanCandidates.push(v);
        else if (v && typeof v === "object" && typeof (v as any).url === "string") floorPlanCandidates.push((v as any).url);
      }
    }
    // HTML fallback: <img> with alt mentioning floor plan, or near a "Floor Plan" label.
    const htmlFloorPlanRe = /<img[^>]+(?:alt|aria-label)=["'][^"']*floor[\s_-]?plan[^"']*["'][^>]*src=["']([^"']+)["']/i;
    const htmlFloorPlanMatch = html.match(htmlFloorPlanRe);
    if (htmlFloorPlanMatch) floorPlanCandidates.push(htmlFloorPlanMatch[1]);
    const floorPlanUrl = floorPlanCandidates.find((u) => typeof u === "string" && u.length > 0) || "";

    // If we found a structured project, use it as the canonical project entry.
    if (projectRecord) {
      const styles = resolveRef(projectRecord.styles);
      const works = resolveRef(projectRecord.otherWorks);
      const unit = projectRecord.areaUnit === "sqm" ? "sqm" : projectRecord.areaUnit === "m²" ? "m²" : "sqft";
      // Use Qanvast's explicit yearOfCompletion only. If absent, leave blank —
      // do NOT infer from createdAt/updatedAt (those are upload dates, not project
      // completion dates).
      const yearStr = (() => {
        const y = projectRecord.yearOfCompletion;
        if (typeof y === "string" && /^(19|20)\d{2}$/.test(y.trim())) return y.trim();
        if (typeof y === "number" && y >= 1900 && y < 2100) return String(y);
        return undefined;
      })();
      projects.length = 0; // prefer the structured record over any fallback
      projects.push({
        title: String(projectRecord.title || ""),
        description: "",
        homeType: projectRecord.type,
        budget: typeof projectRecord.price === "number" ? `S$${projectRecord.price.toLocaleString()}` : undefined,
        size: typeof projectRecord.size === "number" ? `${projectRecord.size}${unit}` : undefined,
        year: yearStr,
        rooms: typeof projectRecord.noOfBedrooms === "number" ? `${projectRecord.noOfBedrooms}-Bedroom` : undefined,
        style: Array.isArray(styles) ? styles.join(", ") : "",
        images: photoBaseUrls.length ? photoBaseUrls : Array.from(imgSet).slice(0, 30),
        sourceUrl: rawUrl,
        _works: Array.isArray(works) ? works : [],
        _isNew: !!projectRecord.isNewProperty,
        _bedrooms: projectRecord.noOfBedrooms,
      });
    }

    // Fallback: synthesize from OG tags + images when no structured record exists.
    const haveOgProject = (ogTags.title || pageTitle) && imgSet.size > 0 && projects.length === 0;
    if (haveOgProject) {
      const ld = ldByType("Article") || ldByType("Product") || ldByType("Thing");
      projects.push({
        title: (ld?.name || ogTags.title || pageTitle || "").slice(0, 300),
        description: (ld?.description || ogTags.description || "").slice(0, 4000),
        homeType: extractedHome,
        budget: extractedBudget,
        size: extractedSize,
        year: extractedYear,
        rooms: extractedRooms,
        style: extractedStyle,
        images: Array.from(imgSet).slice(0, 30),
        sourceUrl: rawUrl,
      });
    }

    // ── H3 header: "<span>New HDB</span><span>Modern</span>" — cleanest source of property type label ──
    // Pull the first <h3>...</h3> block and grab its first <span> innerText.
    const h3Match = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const h3Spans: string[] = [];
    if (h3Match) {
      const spanRe = /<span[^>]*>([^<]+)<\/span>/gi;
      let sm: RegExpExecArray | null;
      while ((sm = spanRe.exec(h3Match[1]))) h3Spans.push(sm[1].trim());
    }
    const h3PropertyLabel = h3Spans[0] || ""; // e.g. "New HDB" / "Resale Condo" / "Landed Terrace"
    const h3StyleLabel = h3Spans[1] || ""; // e.g. "Modern" / "Contemporary" / "Scandinavian"

    // Map a Qanvast property label (from h3) onto our { propertyType, propertySubType }.
    const mapQanvastPropertyLabel = (label: string, isNew: boolean | undefined, bedrooms: number | undefined): { propertyType: string; propertySubType: string } => {
      const l = label.toLowerCase();
      const nbLabel = typeof bedrooms === "number" && bedrooms > 0 ? `${bedrooms}-Bedroom` : "";
      if (/hdb/.test(l)) {
        // HDB sub-type: "BTO" or "Resale" + room count (HDB N-Room == bedrooms + 1 roughly, but keep bedroom-based to avoid errors)
        const status = isNew === true ? "BTO" : isNew === false ? "Resale" : "";
        return { propertyType: "HDB", propertySubType: [status, nbLabel].filter(Boolean).join(", ") };
      }
      if (/condo|apartment|penthouse|ec\b/.test(l)) {
        const status = isNew === true ? "New" : isNew === false ? "Resale" : "";
        return { propertyType: "Condominium", propertySubType: [status, nbLabel].filter(Boolean).join(", ") };
      }
      if (/landed|terrace|bungalow|semi/.test(l)) {
        let sub = "";
        if (/good\s+class/i.test(label)) sub = "Good Class Bungalow";
        else if (/bungalow/i.test(label)) sub = "Bungalow";
        else if (/semi/i.test(label)) sub = "Semi-Detached";
        else if (/terrace/i.test(label)) sub = "Terrace";
        return { propertyType: "Landed", propertySubType: sub };
      }
      if (/commercial|office|retail|f&b|restaurant|cafe/.test(l)) {
        return { propertyType: "Commercial", propertySubType: "" };
      }
      return { propertyType: "", propertySubType: "" };
    };

    // Map Qanvast's otherWorks list onto our 8 canonical keys.
    const QANVAST_WORK_MAP: Record<string, string> = {
      "carpentry": "carpentry",
      "feature walls": "feature-wall",
      "feature wall": "feature-wall",
      "accent walls": "feature-wall",
      "tiling": "tiling",
      "electrical re-wiring": "electrical",
      "electrical rewiring": "electrical",
      "electrical": "electrical",
      "plumbing": "plumbing",
      "paint job": "painting",
      "painting": "painting",
    };
    const mapQanvastWorks = (works: string[]): string[] => {
      const out = new Set<string>();
      for (const w of works) {
        const key = QANVAST_WORK_MAP[w.toLowerCase().trim()];
        if (key) out.add(key);
      }
      return Array.from(out);
    };

    // ── Build an `imported` payload shaped like /firm-onboarding/project's ProjectSubmission ──
    const imported = projects.map((p: any) => {
      const titleRaw = p.title || "";
      const haystack = `${titleRaw} ${p.description || ""} ${p.homeType || ""} ${p.style || ""} ${p.rooms || ""} ${h3PropertyLabel}`;

      // Prefer structured h3 label when available, else fall back to freeform classifier.
      let propertyType = "";
      let propertySubType = "";
      if (h3PropertyLabel) {
        const mapped = mapQanvastPropertyLabel(h3PropertyLabel, p._isNew, p._bedrooms);
        propertyType = mapped.propertyType;
        propertySubType = mapped.propertySubType;
      }
      if (!propertyType) {
        const fallback = classifyPropertyType(haystack);
        propertyType = fallback.propertyType;
        propertySubType = fallback.propertySubType;
      }

      const sz = splitSize(p.size);
      const yearMatch = (titleRaw + " " + (p.year || "")).match(/\b(19|20)\d{2}\b/);

      // Works: prefer Qanvast structured list; when the RSC payload lazy-loads it
      // (e.g. `otherWorks: "$3d"` where ref 3d isn't streamed in the initial HTML),
      // fall back to scanning the rendered page text. Qanvast renders the works
      // list as visible tags (Carpentry, Feature Walls, Tiling, Electrical
      // Re-wiring, Plumbing, Paint Job, etc.) so a labelled-phrase scan picks
      // them up even without the structured array.
      const structuredWorks = Array.isArray(p._works) && p._works.length ? mapQanvastWorks(p._works) : [];
      const qanvastHtmlWorks: string[] = [];
      for (const label of Object.keys(QANVAST_WORK_MAP)) {
        const re = new RegExp(`>\\s*${label.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*<`, "i");
        if (re.test(html)) qanvastHtmlWorks.push(label);
      }
      const htmlStructuredWorks = mapQanvastWorks(qanvastHtmlWorks);
      const detectedWorks = detectWorks(p.description || htmlText || haystack);
      const worksIncluded = Array.from(new Set([
        ...structuredWorks,
        ...htmlStructuredWorks,
        ...detectedWorks,
      ]));

      return {
        title: titleRaw.slice(0, 120),
        location: extractLocation(titleRaw),
        cost: normalizeCost(p.budget) || (p.budget || "").replace(/^S/i, ""),
        size: sz.num,
        sizeUnit: sz.unit,
        year: yearMatch ? yearMatch[0] : (p.year || ""),
        propertyType,
        propertySubType,
        style: p.style || h3StyleLabel || detectStyle(haystack) || detectStyle(htmlText),
        worksIncluded,
        driveUrl: "",
        images: Array.isArray(p.images) ? p.images : [],
        floorPlan: floorPlanUrl || "",
        sourceUrl: p.sourceUrl || rawUrl,
      };
    });

    // If we still had no firm name but JSON-LD has an author/publisher, use it
    if (!firmName) {
      const ld = ldByType("Article") || ldByType("Product");
      firmName = ld?.author?.name || ld?.publisher?.name || ld?.brand?.name || firmName;
    }
    // Prefer the structured firm record from RSC if we found one.
    if (firmRecord?.companyName) {
      firmName = firmRecord.companyName;
      qanvastId = qanvastId || firmRecord.companyId || firmRecord.id;
    }
    // Also try the "Designed by <FirmName>" anchor in the h2 tag (cleanest for project pages).
    if (!firmName) {
      const h2Anchor = html.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="\/sg\/interior-designers?-[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (h2Anchor) firmName = h2Anchor[1].trim();
    }

    return c.json({
      ok: true,
      url: rawUrl,
      kind,
      status: httpStatus,
      elapsedMs: Date.now() - started,
      firm: firmName ? { name: firmName, qanvastId } : null,
      projects,
      imported,
      raw: {
        hasNextData: !!nextData,
        rscChunkCount: rscChunks.length,
        rscRefCount: Object.keys(rscDict).length,
        rscFoundProject: !!projectRecord,
        rscFoundFirm: !!firmRecord,
        photoBaseUrlCount: photoBaseUrls.length,
        h3PropertyLabel,
        jsonLdCount: jsonLd.length,
        jsonLdTypes: flatLd.map((x) => x["@type"]).filter(Boolean),
        ogTags,
        pageTitle,
        imageCount: imgSet.size,
        extracted: {
          budget: extractedBudget,
          size: extractedSize,
          year: extractedYear,
          homeType: extractedHome,
          style: extractedStyle,
          rooms: extractedRooms,
        },
        projectRecordKeys: projectRecord ? Object.keys(projectRecord) : [],
        otherWorksRaw: projectRecord ? projectRecord.otherWorks : undefined,
        otherWorksResolved: projectRecord ? resolveRef(projectRecord.otherWorks) : undefined,
        rscRefKeys: Object.keys(rscDict).slice(0, 400),
        rsc3dPeek: (() => {
          try {
            const rsc = rscChunks.map((s) => s
              .replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t")
              .replace(/\\"/g, '"').replace(/\\\\/g, "\\")
              .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
            ).join("");
            const hits: string[] = [];
            const re = /3d[:\]]/g;
            let mm: RegExpExecArray | null;
            while ((mm = re.exec(rsc)) && hits.length < 6) {
              hits.push(rsc.slice(Math.max(0, mm.index - 30), mm.index + 200));
            }
            return hits;
          } catch { return [] as string[]; }
        })(),
        // Dump shapes of any RSC ref that looks vaguely project-shaped, so we can
        // see what schema Qanvast is using when our heuristic misses.
        // Dump shapes of any RSC ref that has at least one project-shape key
        // (yearOfCompletion / areaUnit / noOfBedrooms / isNewProperty / styles / otherWorks).
        // Peek at the project's images ref so we can fix the structured walk.
        rscProjectImagesPeek: (() => {
          if (!projectRecord) return null;
          const raw = (projectRecord as any).images;
          const resolved = resolveRef(raw);
          const summary = (v: any): any => {
            if (v == null) return null;
            if (typeof v === "string") return `string:${v.slice(0, 60)}`;
            if (Array.isArray(v)) return { array: v.length, first3: v.slice(0, 3).map((x) => typeof x === "string" ? `str:${x.slice(0,40)}` : (x && typeof x === "object" ? `obj:${Object.keys(x).slice(0,5).join(",")}` : typeof x)) };
            if (typeof v === "object") return { keys: Object.keys(v).slice(0, 12), baseUrl: v.baseUrl?.slice(0, 60) };
            return typeof v;
          };
          return { rawType: typeof raw, raw: typeof raw === "string" ? raw : "(non-string)", resolvedSummary: summary(resolved) };
        })(),
        rscProjectCandidates: (() => {
          const out: any[] = [];
          const KEYS = ["yearOfCompletion", "areaUnit", "noOfBedrooms", "isNewProperty", "styles", "otherWorks", "price", "size"];
          for (const [k, v] of Object.entries(rscDict)) {
            if (!v || typeof v !== "object" || Array.isArray(v)) continue;
            const keys = Object.keys(v);
            const hits = KEYS.filter((kk) => keys.includes(kk));
            if (hits.length === 0) continue;
            const shape: Record<string, string> = {};
            for (const kk of keys.slice(0, 40)) {
              const vv = (v as any)[kk];
              shape[kk] = Array.isArray(vv) ? `Array(${vv.length})` : (vv === null ? "null" : typeof vv === "object" ? "object" : `${typeof vv}:${String(vv).slice(0, 60)}`);
            }
            out.push({ ref: k, hits, shape });
            if (out.length >= 6) break;
          }
          return out;
        })(),
        htmlCarpentryHit: /Carpentry/i.test(html),
        htmlWorkHits: (() => {
          const labels = ["Carpentry","Feature Walls","Tiling","Electrical Re-wiring","Plumbing","Paint Job","Lighting","False Ceiling","Hacking","Masonry","Flooring","Doors"];
          return labels.filter((l) => new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(html));
        })(),
      },
    });
  } catch (err: any) {
    console.log("qanvast-scrape error:", err);
    return c.json({ ok: false, message: "Scrape failed: " + (err?.message || String(err)), elapsedMs: Date.now() - started }, 500);
  }
});

app.post("/make-server-4808de5e/firm-onboarding/airtable-lookup", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many attempts" }, 429);
    const body = await c.req.json().catch(() => null);
    const recordId = typeof body?.recordId === "string" ? body.recordId.trim() : "";
    const identifier = typeof body?.identifier === "string" ? body.identifier.trim() : "";
    if (!recordId || !identifier) return c.json({ ok: false, message: "Missing record or identifier" }, 400);
    if (!/^rec[a-zA-Z0-9]{14}$/.test(recordId)) return c.json({ ok: false, message: "Invalid record id" }, 400);

    const token = Deno.env.get("AIRTABLE_TOKEN");
    if (!token) return c.json({ ok: false, message: "Airtable not configured" }, 500);

    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return c.json({ ok: false, message: "Firm not found" }, 404);
    if (!res.ok) return c.json({ ok: false, message: "Lookup failed" }, 500);
    const rec = await res.json();
    const f = rec.fields || {};

    const isEmailIdentifier = identifier.includes("@");
    let matched = false;
    if (isEmailIdentifier) {
      const got = String(f.Email || "").trim().toLowerCase();
      matched = !!got && got === identifier.toLowerCase();
    } else {
      const userDigits = digitsOnly(identifier);
      const recDigits = digitsOnly(String(f.Phone || ""));
      if (userDigits.length >= 8 && recDigits.length >= 8) {
        matched = userDigits.slice(-8) === recDigits.slice(-8);
      }
    }
    if (!matched) {
      return c.json({ ok: false, message: "Email or phone doesn't match the one registered for this firm. Please check or contact us." }, 404);
    }

    const asArr = (v: any) => (Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : []);
    const asStr = (v: any) => (v == null ? "" : String(v).trim());

    // Normalize Airtable values → client-side option strings so checkboxes/radios highlight.
    // Match by "canonical" form: lowercase, strip all non-alphanumerics.
    const canon = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const ALIASES: Record<string, string> = {
      "designbuild": "designandbuild",
      "designplusbuild": "designandbuild",
    };
    const normalizeTo = (raw: string, options: string[]): string => {
      if (!raw) return raw;
      const k0 = canon(raw);
      if (!k0) return raw;
      const k = ALIASES[k0] || k0;
      const hit = options.find((o) => canon(o) === k);
      if (hit) return hit;
      const starts = options.find((o) => canon(o).startsWith(k) || k.startsWith(canon(o)));
      return starts || raw;
    };
    const normArr = (arr: string[], options: string[]) => arr.map((v) => normalizeTo(v, options));

    const CLIENT_LICENSES = ["HDB License", "BCA", "ISO", "SIDAC", "BizSafe"];
    const CLIENT_SERVICE_AREA = ["West", "East", "North", "North-East", "Central"];
    const CLIENT_SERVICES = ["Design and Build", "Design Only Service", "Project Management"];
    const CLIENT_PROJECT_TYPES = [
      "HDB (BTO, Resale, Maisonette)",
      "Executive Condominium (EC)",
      "Condominium (New Launch, Resale)",
      "Landed Homes",
    ];
    const CLIENT_LANDED = ["Landed Homes", "Selected Landed Homes", "Not Suitable for Landed Projects"];
    const CLIENT_DESIGN_STYLES = [
      "Modern", "Contemporary", "Scandinavian", "Japandi", "Industrial", "Mid-Century",
      "Minimalist", "Luxury/High-End", "Classic/Traditional", "Eclectic", "Muji-style", "Resort-style",
    ];
    const CLIENT_SPECIALISATION = [
      "Design & Build", "Commercial", "Complimentary (Below 30K budget)", "Carpentry-Focused",
      "Full Home Renovation", "Partial Renovation", "Premium / High-End Works",
    ];
    const CLIENT_BUDGET = [
      "Under $30K — Partial Renovation",
      "$30K–$50K — Essential Renovation",
      "$50K–$80K — Full Renovation",
      "$80K–$120K — Upgraded Renovation",
      "$120K+ — High-End Renovation",
    ];
    const CLIENT_FINANCING = ["Renovation Loan Available", "Flexible Payment Staging", "No Financing Available"];

    const yrs = f["Years of Experience"];
    const prefill = {
      contactEmail: String(f.Email || "").trim(),
      acraUen: asStr(f["ACRA/UEN"]),
      yearsExperience: yrs == null || yrs === "" ? "" : String(yrs),
      officeAddress: asStr(f["Office Address"]),
      serviceArea: normArr(asArr(f["Service Area"]), CLIENT_SERVICE_AREA),
      serviceProvided: normArr(asArr(f.Services), CLIENT_SERVICES),
      projectTypes: normArr(asArr(f["Typical Project Type"]), CLIENT_PROJECT_TYPES),
      landedEligibility: normalizeTo(asStr(f["Landed Project Eligibility"]), CLIENT_LANDED),
      designStyles: normArr(asArr(f["Design Styles"]), CLIENT_DESIGN_STYLES),
      specialisation: normArr(asArr(f.Specialization), CLIENT_SPECIALISATION),
      budgetRange: normArr(asArr(f["Budget Range"]), CLIENT_BUDGET),
      financing: normalizeTo(asStr(f["Renovation Financing"]), CLIENT_FINANCING),
      portfolioUrl: asStr(f.Portfolio),
      licenses: normArr(asArr(f.Licenses), CLIENT_LICENSES),
    };
    return c.json({ ok: true, firmName: asStr(f.Client), prefill });
  } catch (err) {
    console.log("airtable-lookup error:", err);
    return c.json({ ok: false, message: "Lookup failed" }, 500);
  }
});

// Admin: one-shot backfill of existing KV projects into designer_projects.
// Idempotent on re-run: skips (slug, title, submittedAt) tuples that already exist.
app.post("/make-server-4808de5e/admin/backfill-designer-projects", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    // Read all KV project sections.
    const { data: sections, error: secErr } = await sb
      .from("designer_sections")
      .select("slug, data")
      .eq("section", "projects");
    if (secErr) return c.json({ error: secErr.message }, 500);
    // Read existing rows to dedupe.
    const { data: existingRows } = await sb
      .from("designer_projects")
      .select("designer_slug, title, submitted_at");
    const seen = new Set<string>();
    for (const r of existingRows || []) {
      seen.add(`${r.designer_slug}|${r.title}|${r.submitted_at}`);
    }
    let inserted = 0;
    let skipped = 0;
    for (const row of sections || []) {
      const slug = row.slug as string;
      const list = Array.isArray(row.data) ? row.data : [];
      for (const p of list) {
        const title = String(p?.name || p?.title || "").slice(0, 300);
        const submittedAt = p?.submittedAt || new Date().toISOString();
        const key = `${slug}|${title}|${submittedAt}`;
        if (seen.has(key)) { skipped++; continue; }
        await insertDesignerProjectRow(slug, {
          title,
          location: p?.location || "",
          cost: p?.cost || "",
          size: p?.size || "",
          sizeUnit: p?.sizeUnit || "",
          year: p?.year || "",
          propertyType: p?.propertyType || "",
          propertySubType: p?.propertySubType || "",
          style: p?.style || "",
          worksIncluded: Array.isArray(p?.worksIncluded) ? p.worksIncluded : [],
          driveUrl: p?.driveUrl || "",
          images: Array.isArray(p?.images) ? p.images : [],
          sourceUrl: p?.sourceUrl || "",
          variant: "backfill",
          contactEmail: "",
          submittedAt,
        });
        seen.add(key);
        inserted++;
      }
    }
    return c.json({ ok: true, inserted, skipped, sections: sections?.length || 0 });
  } catch (err: any) {
    return c.json({ error: "Backfill failed: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: list ALL designer profiles (no limit cap). Mirrors the shape
// returned by GET /designers?showAll=true but without pagination, so the
// admin Designers list can render the full set.
app.get("/make-server-4808de5e/admin/designers", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    const [designersRes, sectionsRes] = await Promise.all([
      sb.from("designers").select("slug, name, data"),
      sb.from("designer_sections").select("slug, section, data"),
    ]);
    if (designersRes.error) return c.json({ error: designersRes.error.message }, 500);

    const sectionsBySlug: Record<string, Record<string, any>> = {};
    for (const row of (sectionsRes.data || []) as any[]) {
      if (!sectionsBySlug[row.slug]) sectionsBySlug[row.slug] = {};
      sectionsBySlug[row.slug][row.section] = row.data;
    }

    const s = (v: any) => (typeof v === "string" ? v.trim() : "");
    function completeness(d: any, sections: Record<string, any>): { filled: number; total: number; missing: string[] } {
      const missing: string[] = [];
      const bi = Array.isArray(sections.businessinfo) ? sections.businessinfo : Array.isArray(d.businessInfo) ? d.businessInfo : [];
      const biByLabel = new Map<string, string>();
      for (const b of bi) { if (b?.label && s(b?.value)) biByLabel.set(b.label, b.value); }
      const projects = Array.isArray(sections.projects) ? sections.projects : Array.isArray(d.projects) ? d.projects : [];
      const cp = d.coverProject || {};
      if (!d.images?.cover && !s(cp.image)) missing.push("Cover Image");
      if (!s(d.name)) missing.push("Firm Name");
      if (!s(d.tagline)) missing.push("Tagline");
      if (!s(d.bio)) missing.push("About / Bio");
      if (!s(d.contactEmail)) missing.push("Contact Email");
      if (!s(d.acraUen) && !biByLabel.get("ACRA / UEN")) missing.push("ACRA / UEN");
      if (!s(d.officeAddress) && !biByLabel.get("Office address")) missing.push("Office Address");
      if (!Array.isArray(projects) || projects.length === 0) missing.push("At least one project");
      const total = 8;
      const filled = total - missing.length;
      return { filled, total, missing };
    }

    const designers = (designersRes.data || [])
      .filter((d: any) => !d.data?.deletedAt) // hide soft-deleted from active list
      .map((d: any) => {
        const merged = { ...(d.data || {}), slug: d.slug, name: d.data?.name || d.name };
        merged.completeness = completeness(merged, sectionsBySlug[d.slug] || {});
        return merged;
      });
    return c.json({ count: designers.length, data: designers });
  } catch (err: any) {
    return c.json({ error: "Failed to load designers: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: list soft-deleted designer profiles. Gated by the same admin
// allowlist as the Debug tab (raemerdr@gmail.com etc.).
app.get("/make-server-4808de5e/admin/deleted-designers", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    const { data, error } = await sb.from("designers").select("slug, name, data, updated_at");
    if (error) return c.json({ error: error.message }, 500);
    const deleted = (data || [])
      .filter((d: any) => !!d.data?.deletedAt)
      .map((d: any) => ({
        slug: d.slug,
        name: d.data?.name || d.name,
        deletedAt: d.data.deletedAt,
        deletedBy: d.data.deletedBy || "",
        contactEmail: d.data.contactEmail || "",
        tagline: d.data.tagline || "",
      }))
      .sort((a: any, b: any) => (b.deletedAt || "").localeCompare(a.deletedAt || ""));
    return c.json({ count: deleted.length, data: deleted });
  } catch (err: any) {
    return c.json({ error: "Failed to load deleted designers: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: restore a soft-deleted designer (clears deletedAt).
app.post("/make-server-4808de5e/admin/deleted-designers/:slug/restore", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);
    const existing = await getDesignerProfile(slug);
    if (!existing) return c.json({ error: "Designer not found" }, 404);
    const { deletedAt, deletedBy, ...rest } = existing as any;
    delete rest.slug;
    const sb = getDesignerSupabase();
    await sb.from("designers").update({ data: rest, updated_at: new Date().toISOString() }).eq("slug", slug);
    return c.json({ success: true, slug });
  } catch (err: any) {
    return c.json({ error: "Restore failed: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: PERMANENTLY purge a soft-deleted designer (no undo).
app.delete("/make-server-4808de5e/admin/deleted-designers/:slug", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);
    const existing = await getDesignerProfile(slug);
    if (!existing) return c.json({ error: "Designer not found" }, 404);
    if (!existing.deletedAt) return c.json({ error: "Designer is not soft-deleted; restore or use regular delete" }, 400);
    await deleteDesignerAndSections(slug);
    return c.json({ success: true, slug, purged: true });
  } catch (err: any) {
    return c.json({ error: "Purge failed: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: list firm-onboarding submissions (designers with submittedAt set),
// newest first, no result-count cap.
app.get("/make-server-4808de5e/admin/submitted-firms", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    const { data, error } = await sb
      .from("designers")
      .select("slug, name, data")
      .not("data->>submittedAt", "is", null)
      .order("data->>submittedAt", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    const firms = (data || []).map((row: any) => ({
      slug: row.slug,
      name: row.data?.name || row.name,
      contactEmail: row.data?.contactEmail || "",
      active: row.data?.active,
      verified: row.data?.verified,
      submittedAt: row.data?.submittedAt,
      acraUen: row.data?.acraUen || "",
      yearsExperience: row.data?.yearsExperience || "",
      serviceArea: Array.isArray(row.data?.serviceArea) ? row.data.serviceArea : [],
    }));
    return c.json({ firms, total: firms.length });
  } catch (err: any) {
    return c.json({ error: "Failed to load firms: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: list rows from the dedicated designer_projects table.
// Returns the same shape as /admin/onboarding-submissions so the UI can swap.
app.get("/make-server-4808de5e/admin/designer-projects", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    const { data, error } = await sb
      .from("designer_projects")
      .select("id, designer_slug, title, location, cost, size, size_unit, year, property_type, property_sub_type, style, drive_url, source_url, variant, contact_email, submitted_at, created_at, images")
      .order("submitted_at", { ascending: false })
      .limit(500);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ projects: data || [], total: (data || []).length });
  } catch (err: any) {
    return c.json({ error: "Failed to load designer_projects: " + String(err?.message || err).slice(0, 200) }, 500);
  }
});

// Admin: list onboarding submissions
app.get("/make-server-4808de5e/admin/onboarding-submissions", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const entries: any[] = await kv.getByPrefix("onboarding:submission:");
    entries.sort((a, b) => String(b?.ts || "").localeCompare(String(a?.ts || "")));
    return c.json({ submissions: entries, total: entries.length });
  } catch (err) {
    return c.json({ error: "Failed to load onboarding submissions: " + String(err).slice(0, 200) }, 500);
  }
});

// Submit render task to kie.ai
app.post("/make-server-4808de5e/render-task", async (c) => {
  try {
    // Auth check
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Rate limit (strictest - this costs real money)
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-task");
    if (!rl.allowed) {
      securityLog("rate_limit_exceeded", "warn", ip, "/render-task");
      return c.json({ error: "Too many render requests. Please wait before trying again.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    // Daily usage cap (global)
    const dailyCap = await checkDailyRenderCap();
    if (!dailyCap.allowed) {
      securityLog("daily_render_cap_reached", "warn", ip, "/render-task", { used: dailyCap.used, cap: DAILY_RENDER_CAP });
      return c.json({ error: "Daily render limit reached. Please try again tomorrow." }, 429);
    }

    // Per-IP daily cap (5 per IP per day — shared across initial renders + adjustments)
    const ipCap = await checkIpDailyRenderCap(ip);
    if (!ipCap.allowed) {
      securityLog("ip_daily_render_cap", "warn", ip, "/render-task", { used: ipCap.used, limit: ipCap.limit });
      return c.json({
        error: `You've used all ${ipCap.limit} renders for today. Try again tomorrow, or send one of your renders to a designer for real-world feedback.`,
        remaining: 0,
        used: ipCap.used,
        limit: ipCap.limit,
      }, 429);
    }

    const body = await c.req.json();
    const { imageUrl, userPrompt, adjustmentPrompt, hints, parentTaskId } = body || {};

    // Required: imageUrl + userPrompt
    if (!imageUrl || typeof imageUrl !== "string") {
      return c.json({ error: "imageUrl is required" }, 400);
    }
    if (!userPrompt || typeof userPrompt !== "string") {
      return c.json({ error: "Please describe your render." }, 400);
    }

    // Optional hint chips — narrow whitelist against existing constants
    const hintStyle = hints?.style && typeof hints.style === "string" ? hints.style : "";
    const hintRoom = hints?.room && typeof hints.room === "string" ? hints.room : "";
    const hintProperty = hints?.property && typeof hints.property === "string" ? hints.property : "";
    if (hintStyle && !ALLOWED_DESIGN_STYLES.includes(hintStyle)) {
      return c.json({ error: "Invalid style hint" }, 400);
    }
    if (hintRoom && !ALLOWED_ROOM_TYPES.includes(hintRoom)) {
      return c.json({ error: "Invalid room hint" }, 400);
    }
    if (hintProperty && !ALLOWED_PROPERTY_TYPES.includes(hintProperty)) {
      return c.json({ error: "Invalid property hint" }, 400);
    }

    // Validate imageUrl is from our own Supabase storage (prevent SSRF)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseHost = new URL(supabaseUrl).hostname;
    if (!isValidStorageUrl(imageUrl, [supabaseHost])) {
      securityLog("ssrf_blocked", "warn", ip, "/render-task", { url: imageUrl.slice(0, 200) });
      return c.json({ error: "Image URL must be from our storage" }, 400);
    }

    // Sanitize + moderate the user-supplied prompt text
    const cleanUserPrompt = sanitizeString(userPrompt, 500);
    const cleanAdjustment = adjustmentPrompt && typeof adjustmentPrompt === "string"
      ? sanitizeString(adjustmentPrompt, 300)
      : "";

    const modPrimary = await moderatePrompt(cleanUserPrompt);
    if (!modPrimary.ok) {
      securityLog("prompt_moderation_rejected", "warn", ip, "/render-task", { reason: modPrimary.reason?.slice(0, 80) });
      return c.json({ error: modPrimary.reason || "Prompt not supported." }, 400);
    }
    if (cleanAdjustment) {
      const modAdjust = await moderatePrompt(cleanAdjustment);
      if (!modAdjust.ok) {
        securityLog("prompt_moderation_rejected", "warn", ip, "/render-task", { reason: modAdjust.reason?.slice(0, 80), adjust: true });
        return c.json({ error: modAdjust.reason || "Adjustment prompt not supported." }, 400);
      }
    }

    // Validate optional parentTaskId (for adjustment traceability). Must be a known task.
    let cleanParentTaskId: string | null = null;
    if (parentTaskId && typeof parentTaskId === "string" && /^[a-zA-Z0-9_\-]{1,200}$/.test(parentTaskId)) {
      const parent = await kv.get(`render-task:${parentTaskId}`);
      if (parent && parent.requestIp === ip) cleanParentTaskId = parentTaskId;
    }

    const apiKey = Deno.env.get("ai_model_keys");
    if (!apiKey) {
      console.log("ai_model_keys secret is not set");
      return c.json({ error: "AI model API key not configured on server" }, 500);
    }

    const callBackUrl = `${supabaseUrl}/functions/v1/make-server-4808de5e/render-callback`;

    // Build the final prompt — anchors + optional hints + user text + optional adjustment.
    // Note: for adjustments the image_input stays the ORIGINAL uploaded image, not the
    // previous render, so output quality stays consistent and doesn't drift.
    const finalPrompt = buildFinalPrompt({
      userPrompt: cleanUserPrompt,
      adjustmentPrompt: cleanAdjustment,
      hints: { style: hintStyle, room: hintRoom, property: hintProperty },
    });

    console.log("Submitting user-prompted render task to kie.ai");

    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-2",
        callBackUrl,
        input: {
          prompt: finalPrompt,
          image_input: [imageUrl],
          aspect_ratio: "auto",
          google_search: false,
          resolution: "1K",
          output_format: "jpg",
        },
      }),
    });

    const result = await response.json();
    console.log("kie.ai createTask response status:", response.status);

    if (!response.ok) {
      console.log("kie.ai API error:", JSON.stringify(result).slice(0, 500));
      return c.json({ error: "AI render service error. Please try again later." }, 500);
    }

    // Extract taskId — try every known path in the response
    const taskId = result.data?.taskId || result.data?.task_id || result.data?.id ||
                   result.taskId || result.task_id || result.id || crypto.randomUUID();

    // Resolve authenticated user for ownership tracking (for logged-in flows).
    // Anonymous renders are allowed too — IP is the primary ownership key.
    const renderUser = await getUserFromRequest(c);

    await kv.set(`render-task:${taskId}`, {
      taskId,
      userId: renderUser?.id || null,
      status: "processing",
      createdAt: new Date().toISOString(),
      // User-prompted fields
      userPrompt: cleanUserPrompt,
      adjustmentPrompt: cleanAdjustment || null,
      hints: { style: hintStyle, room: hintRoom, property: hintProperty },
      parentTaskId: cleanParentTaskId,
      originalImageUrl: imageUrl,
      // Internal book-keeping (never returned to client)
      requestIp: ip,
      // Lead fields are intentionally empty — captured later via /render-lead-submit
      contact: null,
      quoteRequestId: null,
    });

    console.log("Render task stored with taskId:", taskId, "parentTaskId:", cleanParentTaskId);
    return c.json({
      success: true,
      taskId,
      rendersUsed: ipCap.used,
      rendersRemaining: Math.max(0, ipCap.limit - ipCap.used),
      rendersLimit: ipCap.limit,
    });
  } catch (err) {
    console.log("Unexpected error in /render-task:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// Callback from kie.ai when render is complete
app.post("/make-server-4808de5e/render-callback", async (c) => {
  try {
    // Rate limit callback to prevent abuse
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      securityLog("rate_limit_exceeded", "warn", ip, "/render-callback");
      return c.json({ error: "Too many requests" }, 429);
    }

    const body = await c.req.json();
    console.log("Render callback received");
    console.log("Render callback FULL body:", JSON.stringify(body).substring(0, 3000));

    const taskId = body.data?.taskId || body.taskId;
    if (!taskId || typeof taskId !== "string" || taskId.length > 200) {
      console.log("Callback received with invalid taskId");
      return c.json({ success: true, message: "Received but invalid taskId" });
    }

    // Verify the task exists in our KV and hasn't already been completed (prevents replay/injection)
    const existing = await kv.get(`render-task:${taskId}`);
    if (!existing) {
      securityLog("callback_unknown_task", "warn", ip, "/render-callback", { taskId: taskId.slice(0, 20) });
      return c.json({ error: "Unknown task" }, 404);
    }
    // Reject callbacks for already-completed tasks (prevent result overwriting)
    if (existing.status === "completed" || existing.status === "failed") {
      securityLog("callback_duplicate_task", "warn", ip, "/render-callback", { taskId: taskId.slice(0, 20), status: existing.status });
      return c.json({ success: true, message: "Task already finalized" });
    }
    // Verify task was created recently (within 30 minutes) — stale tasks shouldn't receive callbacks
    if (existing.createdAt) {
      const createdTime = new Date(existing.createdAt).getTime();
      if (Date.now() - createdTime > 30 * 60 * 1000) {
        securityLog("callback_stale_task", "warn", ip, "/render-callback", { taskId: taskId.slice(0, 20) });
        return c.json({ error: "Task expired" }, 410);
      }
    }

    // Extract status using kie.ai's actual field: data.state (lowercase)
    const kieStatus = extractKieStatus(body.data || body);
    const normalizedStatus = ["success", "completed", "done", "finished"].includes(kieStatus)
      ? "completed"
      : ["failed", "error", "cancelled", "canceled"].includes(kieStatus)
      ? "failed"
      : "completed"; // Default to completed if callback fires

    // Extract result URL — kie.ai stores it in data.resultJson as JSON string
    let resultUrl: string | null = extractKieResultUrl(body.data || {});
    if (!resultUrl) {
      resultUrl = extractKieResultUrl(body);
    }
    // Legacy fallback: direct output array
    if (!resultUrl) {
      const legacyUrl = body.data?.output?.[0] || body.output?.[0] || null;
      if (legacyUrl && typeof legacyUrl === "string" && legacyUrl.startsWith("http") && legacyUrl.length < 2000) {
        resultUrl = legacyUrl;
      }
    }
    // Deep URL search fallback
    if (!resultUrl) {
      const allUrls = findUrlsInObject(body);
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const outputUrls = allUrls.filter(u => !u.includes(supabaseUrl) && !u.includes("kie.ai/api") && !u.includes("/render-callback"));
      if (outputUrls.length > 0) {
        resultUrl = outputUrls[0];
        console.log("Callback: result found via deep URL search:", resultUrl.substring(0, 80));
      }
    }

    console.log("Callback parsed — status:", normalizedStatus, "resultUrl:", resultUrl ? resultUrl.substring(0, 80) : "null");

    // ── NEW: server-side watermark + dual-upload ─────────────────────────────
    // When the render completed successfully and we have a raw kie.ai URL, we:
    //   1. Download the raw JPEG from kie.ai
    //   2. Upload the CLEAN bytes to a private `clean/{taskId}.jpg` path
    //   3. Run it through watermarkImage() to bake the NETWORK preview overlay
    //   4. Upload the watermarked bytes to `public/{taskId}.jpg` and create a signed URL
    //   5. Replace `resultUrl` with the watermarked signed URL before writing KV
    //
    // Graceful-degradation: if any step fails we still fall through to saving the
    // original unmarked kie.ai URL so the user never sees a dead render.
    let publicResultUrl: string | null = null;
    let cleanResultPath: string | null = null;
    let publicResultPath: string | null = null;

    if (resultUrl && normalizedStatus === "completed") {
      try {
        const dlController = new AbortController();
        const dlTimeout = setTimeout(() => dlController.abort(), 25000);
        const rawRes = await fetch(resultUrl, { signal: dlController.signal });
        clearTimeout(dlTimeout);

        if (rawRes.ok) {
          const rawBytes = new Uint8Array(await rawRes.arrayBuffer());
          const safeTaskId = taskId.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 100);
          cleanResultPath = `clean/${safeTaskId}.jpg`;
          publicResultPath = `public/${safeTaskId}.jpg`;

          const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );

          // 1) Store clean bytes (internal, private — never returned to client)
          try {
            const { error: cleanErr } = await supabaseAdmin.storage
              .from(BUCKET_NAME)
              .upload(cleanResultPath, rawBytes, { contentType: "image/jpeg", upsert: true });
            if (cleanErr) console.log("Clean upload error:", cleanErr.message || cleanErr);
          } catch (cleanEx) {
            console.log("Clean upload exception:", cleanEx instanceof Error ? cleanEx.message : cleanEx);
          }

          // 2) Watermark + upload public version
          try {
            const markedBytes = await watermarkImage(rawBytes);
            const { error: pubErr } = await supabaseAdmin.storage
              .from(BUCKET_NAME)
              .upload(publicResultPath, markedBytes, { contentType: "image/jpeg", upsert: true });

            if (pubErr) {
              console.log("Watermarked upload error:", pubErr.message || pubErr);
            } else {
              const { data: signedData, error: signErr } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .createSignedUrl(publicResultPath, 7 * 24 * 3600); // 7 days
              if (signErr || !signedData?.signedUrl) {
                console.log("Watermarked signed URL error:", signErr);
              } else {
                publicResultUrl = signedData.signedUrl;
              }
            }
          } catch (wmErr) {
            // Watermark stage failed — fall back to uploading the raw bytes to public
            // so the user still gets a result. They just won't be watermarked on this
            // render; we log loudly so we can investigate.
            console.log("Watermark pipeline failed, falling back to clean-as-public:", wmErr instanceof Error ? wmErr.message : wmErr);
            try {
              const { error: fbErr } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .upload(publicResultPath, rawBytes, { contentType: "image/jpeg", upsert: true });
              if (!fbErr) {
                const { data: signedData } = await supabaseAdmin.storage
                  .from(BUCKET_NAME)
                  .createSignedUrl(publicResultPath, 7 * 24 * 3600);
                publicResultUrl = signedData?.signedUrl || null;
              }
            } catch (fbEx) {
              console.log("Fallback public upload exception:", fbEx instanceof Error ? fbEx.message : fbEx);
            }
          }
        } else {
          console.log("Raw fetch from kie.ai returned non-ok:", rawRes.status);
        }
      } catch (dlErr) {
        console.log("Raw image download failed:", dlErr instanceof Error ? dlErr.message : dlErr);
      }
    }

    const updated = {
      ...existing,
      status: normalizedStatus,
      // Always prefer the watermarked signed URL. If it's missing for any reason
      // (download failure, upload failure) we fall back to the raw kie.ai URL
      // purely as a safety net so the user never sees a broken render.
      ...(publicResultUrl ? { resultUrl: publicResultUrl } : resultUrl ? { resultUrl } : {}),
      // Internal-only: clean path (private) for the team's records. Never returned to client.
      ...(cleanResultPath ? { cleanResultPath } : {}),
      ...(publicResultPath ? { publicResultPath } : {}),
      completedAt: new Date().toISOString(),
      callbackBody: JSON.stringify(body).substring(0, 4000),
    };
    await kv.set(`render-task:${taskId}`, updated);
    console.log("Render task updated from callback:", taskId, "watermarked:", publicResultUrl ? "YES" : "NO");

    return c.json({ success: true });
  } catch (err) {
    console.log("Unexpected error in /render-callback:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// Poll render task status
app.get("/make-server-4808de5e/render-status/:taskId", async (c) => {
  try {
    // Auth check
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Rate limit
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-status");
    if (!rl.allowed) {
      return c.json({ error: "Too many polling requests" }, 429);
    }

    const taskId = c.req.param("taskId");

    // Validate taskId format (prevent path traversal / injection)
    if (!taskId || typeof taskId !== "string" || taskId.length > 200 || /[^a-zA-Z0-9_\-]/.test(taskId)) {
      return c.json({ error: "Invalid task ID format" }, 400);
    }

    const task = await kv.get(`render-task:${taskId}`);

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // IDOR protection: verify the requesting user owns this render task
    const statusUser = await getUserFromRequest(c);
    if (task.userId && (!statusUser || statusUser.id !== task.userId)) {
      return c.json({ error: "Task not found" }, 404);
    }

    // If still processing, actively poll kie.ai's recordInfo API for real-time status
    if (task.status === "processing" || (task.status === "completed" && !task.resultUrl)) {
      try {
        const apiKey = Deno.env.get("ai_model_keys");
        if (apiKey) {
          // Use AbortController to timeout after 8s so we never hang the endpoint
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            const kieRes = await fetch(
              `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
              {
                method: "GET",
                headers: { "Authorization": `Bearer ${apiKey}` },
                signal: controller.signal,
              },
            );
            clearTimeout(timeoutId);

            if (kieRes.ok) {
              const kieData = await kieRes.json();
              console.log("kie.ai recordInfo FULL response for task:", taskId, JSON.stringify(kieData).substring(0, 2000));

              // kie.ai uses data.state for status (lowercase: "success", "failed", "processing")
              const kieStatus = extractKieStatus(kieData.data);
              
              // kie.ai stores the output URL inside data.resultJson (a JSON string)
              // e.g. { resultUrls: ["https://..."] }
              let resultUrl: string | null = extractKieResultUrl(kieData.data);

              // Also try top-level data in case structure varies
              if (!resultUrl) {
                resultUrl = extractKieResultUrl(kieData);
              }

              // FALLBACK: deep-search the entire response for any URL
              if (!resultUrl) {
                const allUrls = findUrlsInObject(kieData);
                const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
                const outputUrls = allUrls.filter(u => !u.includes(supabaseUrl) && !u.includes("kie.ai/api"));
                if (outputUrls.length > 0) {
                  resultUrl = outputUrls[0];
                  console.log("kie.ai result found via deep URL search:", resultUrl.substring(0, 80));
                }
              }

              console.log("kie.ai parsed — state:", kieStatus, "resultUrl:", resultUrl ? resultUrl.substring(0, 80) + "..." : "null");

              const isSuccess = ["success", "completed", "done", "finished"].includes(kieStatus);
              const isFailed = ["failed", "error", "cancelled", "canceled"].includes(kieStatus);

              if (isSuccess || resultUrl) {
                const updated = {
                  ...task,
                  status: "completed",
                  resultUrl: resultUrl || task.resultUrl || null,
                  completedAt: new Date().toISOString(),
                };
                await kv.set(`render-task:${taskId}`, updated);
                console.log("Render task completed via recordInfo poll:", taskId);

                return c.json({
                  taskId: updated.taskId,
                  status: "completed",
                  resultUrl: updated.resultUrl,
                  createdAt: updated.createdAt,
                  completedAt: updated.completedAt,
                });
              } else if (isFailed) {
                const updated = {
                  ...task,
                  status: "failed",
                  completedAt: new Date().toISOString(),
                };
                await kv.set(`render-task:${taskId}`, updated);
                console.log("Render task failed via recordInfo poll:", taskId);

                return c.json({
                  taskId: updated.taskId,
                  status: "failed",
                  resultUrl: null,
                  createdAt: updated.createdAt,
                  completedAt: updated.completedAt,
                });
              }
              // Otherwise still processing — fall through
            } else {
              console.log("kie.ai recordInfo non-ok status:", kieRes.status);
            }
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            if (fetchErr.name === "AbortError") {
              console.log("kie.ai recordInfo timed out after 8s for task:", taskId);
            } else {
              console.log("kie.ai recordInfo fetch error:", fetchErr);
            }
            // Non-fatal — fall through to return KV state
          }
        }
      } catch (pollErr) {
        console.log("Error in recordInfo poll block:", pollErr);
      }
    }

    // Only return safe, minimal data.
    // CRITICAL: strip internal fields — the client must NEVER see cleanResultPath
    // (which would let anyone download the un-watermarked original), requestIp,
    // or callbackBody.
    return c.json({
      taskId: task.taskId,
      status: task.resultUrl ? task.status : (task.status === "failed" ? "failed" : "processing"),
      resultUrl: task.resultUrl || null,
      createdAt: task.createdAt,
      completedAt: task.completedAt || null,
      userPrompt: task.userPrompt || null,
      adjustmentPrompt: task.adjustmentPrompt || null,
      hints: task.hints || null,
      parentTaskId: task.parentTaskId || null,
    });
  } catch (err) {
    console.log("Unexpected error in /render-status:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// GET /render-quota — returns the current IP's daily render usage so the landing
// page can show "N renders left today" before the user tries to generate anything.
app.get("/make-server-4808de5e/render-quota", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-status"); // reuse lenient limiter
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const today = new Date().toISOString().slice(0, 10);
    const rawUsed = await kv.get(`render-ip-daily:${ip}:${today}`);
    const used = typeof rawUsed === "number" ? rawUsed : 0;
    const limit = IP_DAILY_RENDER_CAP;
    return c.json({
      used,
      limit,
      remaining: Math.max(0, limit - used),
    });
  } catch (err) {
    console.log("Unexpected error in /render-quota:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// POST /render-suggest-prompt — uses GPT vision to analyze the uploaded image
// and selected hint chips to generate a unique interior-design render prompt.
app.post("/make-server-4808de5e/render-suggest-prompt", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-suggest-prompt");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { imageUrl, hints } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return c.json({ error: "imageUrl required" }, 400);
    }

    const apiKey = Deno.env.get("ai_model_keys");
    if (!apiKey) {
      return c.json({ error: "AI model API key not configured" }, 500);
    }

    // Build the system prompt for GPT vision
    const styleHint = hints?.style ? `The user prefers a ${hints.style} design style.` : "";
    const roomHint = hints?.room ? `This is a ${hints.room}.` : "";
    const propertyHint = hints?.property ? `The property type is ${hints.property}.` : "";
    const chipContext = [styleHint, roomHint, propertyHint].filter(Boolean).join(" ");

    const systemPrompt =
      "You are an expert interior designer helping homeowners in Singapore visualize their dream space. " +
      "The user has uploaded a photo of their room. Based on the image, write a single creative, detailed " +
      "interior design prompt (1-2 sentences, max 200 characters) describing how to transform this space. " +
      "Include specific materials, colors, furniture, and lighting. " +
      "Be vivid and varied — never repeat the same suggestion twice. " +
      "Return ONLY the prompt text, no quotes, no explanation, no preamble. " +
      (chipContext ? `Context from user selections: ${chipContext}` : "");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.kie.ai/codex/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-4",
        stream: false,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: imageUrl,
              },
              {
                type: "input_text",
                text: "Analyze this room and suggest an interior design transformation. Be creative and specific.",
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log("GPT suggest-prompt failed:", res.status, await res.text().catch(() => ""));
      return c.json({ error: "Failed to generate suggestion" }, 502);
    }

    const data = await res.json();

    // Extract text from response (same pattern as moderation)
    let raw: string | null = null;
    if (typeof data?.output_text === "string") {
      raw = data.output_text;
    } else if (Array.isArray(data?.output)) {
      for (const item of data.output) {
        const parts = item?.content;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            if (typeof p?.text === "string") { raw = p.text; break; }
            if (typeof p?.output_text === "string") { raw = p.output_text; break; }
          }
        }
        if (raw) break;
      }
    } else if (Array.isArray(data?.choices)) {
      raw = data.choices[0]?.message?.content ?? null;
    }

    if (!raw || raw.trim().length === 0) {
      return c.json({ error: "No suggestion generated" }, 502);
    }

    // Clean up: strip quotes if GPT wrapped it
    let prompt = raw.trim();
    if ((prompt.startsWith('"') && prompt.endsWith('"')) || (prompt.startsWith("'") && prompt.endsWith("'"))) {
      prompt = prompt.slice(1, -1);
    }

    return c.json({ success: true, prompt: prompt.slice(0, 500) });
  } catch (err) {
    console.log("Unexpected error in /render-suggest-prompt:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// POST /render-lead-gate — called BEFORE the user accesses the render studio.
// Validates contact info only. No database writes or webhooks here.
// All data submission happens later via /render-lead-submit when user
// clicks "Send to designer" after generating a render.
app.post("/make-server-4808de5e/render-lead-gate", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-task");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please wait a moment." }, 429);
    }

    const body = await c.req.json();
    const { name, whatsapp, email, propertyType, budget, timeline } = body || {};

    const cleanName = sanitizeString(name || "", 100);
    const cleanEmail = sanitizeString(email || "", 200).toLowerCase();
    const cleanWhatsapp = sanitizeString(whatsapp || "", 20);
    if (!cleanName || cleanName.length < 2) {
      return c.json({ error: "Please enter your full name." }, 400);
    }
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "Please enter a valid email." }, 400);
    }
    if (!isValidWhatsapp(cleanWhatsapp)) {
      return c.json({ error: "Please enter a valid 8-digit SG WhatsApp number." }, 400);
    }
    if (propertyType && !ALLOWED_PROPERTY_TYPES.includes(propertyType)) {
      return c.json({ error: "Invalid property type" }, 400);
    }
    if (budget && !ALLOWED_BUDGETS.includes(budget)) {
      return c.json({ error: "Invalid budget range" }, 400);
    }
    if (timeline && !ALLOWED_TIMELINES.includes(timeline)) {
      return c.json({ error: "Invalid timeline" }, 400);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log("Unexpected error in /render-lead-gate:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// POST /render-lead-submit — called after the user sees a render they like and
// clicks "Send this to a designer". Inserts into Quote Request + fires Zapier
// render-lead webhook with the WATERMARKED result URL. The clean original is
// never included in the payload.
app.post("/make-server-4808de5e/render-lead-submit", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-task"); // same pace as render submits
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please wait a moment." }, 429);
    }

    const body = await c.req.json();
    const { taskId, name, whatsapp, email, propertyType, budget, timeline } = body || {};

    if (!taskId || typeof taskId !== "string" || !/^[a-zA-Z0-9_\-]{1,200}$/.test(taskId)) {
      return c.json({ error: "Invalid task ID" }, 400);
    }

    const task = await kv.get(`render-task:${taskId}`);
    if (!task) {
      return c.json({ error: "Render not found" }, 404);
    }
    // Ownership: the lead must come from the same IP that created the render
    if (task.requestIp && task.requestIp !== ip) {
      securityLog("lead_submit_wrong_ip", "warn", ip, "/render-lead-submit", { taskId: taskId.slice(0, 20) });
      return c.json({ error: "Render not found" }, 404);
    }

    // Validate contact fields
    const cleanName = sanitizeString(name || "", 100);
    const cleanEmail = sanitizeString(email || "", 200).toLowerCase();
    const cleanWhatsapp = sanitizeString(whatsapp || "", 20);
    if (!cleanName || cleanName.length < 2) {
      return c.json({ error: "Please enter your full name." }, 400);
    }
    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "Please enter a valid email." }, 400);
    }
    if (!isValidWhatsapp(cleanWhatsapp)) {
      return c.json({ error: "Please enter a valid 8-digit SG WhatsApp number." }, 400);
    }
    if (propertyType && !ALLOWED_PROPERTY_TYPES.includes(propertyType)) {
      return c.json({ error: "Invalid property type" }, 400);
    }
    if (budget && !ALLOWED_BUDGETS.includes(budget)) {
      return c.json({ error: "Invalid budget range" }, 400);
    }
    if (timeline && !ALLOWED_TIMELINES.includes(timeline)) {
      return c.json({ error: "Invalid timeline" }, 400);
    }

    // Insert into Quote Request table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const qrId = crypto.randomUUID();
    // IMPORTANT: the payload contains the WATERMARKED resultUrl only.
    // The clean image is held in private storage; Zapier and Airtable never see it.
    const watermarkedUrl = task.resultUrl || "";
    const promptSummary = [
      task.userPrompt ? `Prompt: ${task.userPrompt}` : "",
      task.adjustmentPrompt ? `Adjustment: ${task.adjustmentPrompt}` : "",
      task.hints?.style ? `Style hint: ${task.hints.style}` : "",
      task.hints?.room ? `Room hint: ${task.hints.room}` : "",
    ].filter(Boolean).join(" | ");

    let quoteRequestId: string | null = null;
    try {
      const insertPayload: Record<string, any> = {
        "ID": qrId,
        "Name": cleanName,
        "Email": cleanEmail,
        "Phone Number": cleanWhatsapp,
        "Property Type": propertyType || "",
        "Key Collection Date": timeline || "",
        "Renovation Budget": budget || "",
        "Inquiry": `Network 3D AI Render — ${promptSummary}`,
        "Lead Form": "Network 3D AI Render",
        "3D Render Image": watermarkedUrl,
        "Created Date": new Date().toISOString(),
        "Updated Date": new Date().toISOString(),
      };
      const { error: qrError } = await supabaseAdmin
        .from("Quote Request")
        .insert(insertPayload)
        .select()
        .single();

      if (qrError) {
        console.log("Quote Request insert error for render lead:", JSON.stringify(qrError));
      } else {
        quoteRequestId = qrId;
      }
    } catch (qrErr) {
      console.log("Quote Request insert exception:", qrErr);
    }

    // Fire the Zapier render-lead webhook (watermarked URL only)
    try {
      const zapierUrl = ZAPIER_WEBHOOKS["render-lead"];
      if (zapierUrl) {
        const zapierPayload = {
          Name: cleanName,
          Email: cleanEmail,
          "Phone Number": cleanWhatsapp,
          "Property Type": propertyType || "",
          "Key Collection Date": timeline || "",
          "Renovation Budget": budget || "",
          "User Prompt": task.userPrompt || "",
          "Adjustment Prompt": task.adjustmentPrompt || "",
          "3D Render Image": watermarkedUrl,
          "Lead Form": "Network 3D AI Render",
          "Submitted At": new Date().toISOString(),
        };
        // Fire-and-forget so the user doesn't wait on Zapier round-trip
        fetch(zapierUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(zapierPayload),
        }).catch((zErr) => console.log("Zapier render-lead webhook error:", zErr));
      }
    } catch (zapErr) {
      console.log("Zapier webhook exception:", zapErr);
    }

    // Update the task KV with contact info for internal records
    await kv.set(`render-task:${taskId}`, {
      ...task,
      contact: { name: cleanName, email: cleanEmail, whatsapp: cleanWhatsapp },
      propertyType: propertyType || "",
      budget: budget || "",
      timeline: timeline || "",
      quoteRequestId: quoteRequestId || null,
      leadSubmittedAt: new Date().toISOString(),
    });

    return c.json({ success: true, quoteRequestId });
  } catch (err) {
    console.log("Unexpected error in /render-lead-submit:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// Save rendered image to Supabase Storage and update Quote Request with image URL
app.post("/make-server-4808de5e/render-save-result", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const body = await c.req.json();
    const { taskId, resultUrl, quoteRequestId } = body;

    if (!taskId || !resultUrl) {
      return c.json({ error: "taskId and resultUrl are required" }, 400);
    }

    // Validate taskId format
    if (typeof taskId !== "string" || taskId.length > 200 || /[^a-zA-Z0-9_\-]/.test(taskId)) {
      return c.json({ error: "Invalid task ID format" }, 400);
    }

    // Verify the task exists
    const task = await kv.get(`render-task:${taskId}`);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // IDOR protection: verify the requesting user owns this render task
    const saveUser = await getUserFromRequest(c);
    if (task.userId && (!saveUser || saveUser.id !== task.userId)) {
      return c.json({ error: "Task not found" }, 404);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Step 1: Download the rendered image from kie.ai result URL
    let imageStorageUrl: string | null = null;
    try {
      console.log("Downloading rendered image from:", resultUrl.substring(0, 80));
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const imgRes = await fetch(resultUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!imgRes.ok) {
        console.log("Failed to download rendered image, status:", imgRes.status);
      } else {
        const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());
        const imgContentType = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = imgContentType.includes("png") ? "png" : "jpg";
        const filePath = `renders/${taskId}-result.${ext}`;

        console.log(`Uploading rendered image to storage: ${filePath} (${imgBuffer.length} bytes)`);

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, imgBuffer, { contentType: imgContentType, upsert: true });

        if (uploadErr) {
          console.log("Storage upload error for rendered image:", uploadErr);
        } else {
          // Create a signed URL (valid for 10 days)
          const { data: signedData, error: signErr } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(filePath, 10 * 24 * 3600);

          if (signErr || !signedData?.signedUrl) {
            console.log("Signed URL error for rendered image:", signErr);
          } else {
            imageStorageUrl = signedData.signedUrl;
            console.log("Rendered image saved to storage, signed URL created");
          }
        }
      }
    } catch (dlErr: any) {
      if (dlErr.name === "AbortError") {
        console.log("Rendered image download timed out");
      } else {
        console.log("Error downloading/uploading rendered image:", dlErr);
      }
    }

    // Step 2: Update the Quote Request row with the rendered image URL
    const resolvedQrId = quoteRequestId || task.quoteRequestId;
    if (resolvedQrId && imageStorageUrl) {
      try {
        const { error: updateErr } = await supabase
          .from("Quote Request")
          .update({
            "3D Render Image": imageStorageUrl,
            "Updated Date": new Date().toISOString(),
          })
          .eq("ID", resolvedQrId);

        if (updateErr) {
          console.log("Error updating Quote Request with render image:", JSON.stringify(updateErr));
        } else {
          console.log("Quote Request updated with 3D Render Image for ID:", resolvedQrId);
        }
      } catch (updateErr) {
        console.log("Error updating Quote Request:", updateErr);
      }
    } else {
      console.log("Skipping Quote Request update — quoteRequestId:", resolvedQrId, "imageStorageUrl:", !!imageStorageUrl);
    }

    // Also update KV task with storage URL
    await kv.set(`render-task:${taskId}`, {
      ...task,
      storageImageUrl: imageStorageUrl || null,
      resultSavedAt: new Date().toISOString(),
    });

    // Generate short URL for the image
    let shortImageUrl = imageStorageUrl;
    if (imageStorageUrl) {
      const shortId = crypto.randomUUID().slice(0, 8);
      await kv.set(`img:${shortId}`, imageStorageUrl);
      const fnBase = Deno.env.get("SUPABASE_URL") + "/functions/v1/make-server-4808de5e";
      shortImageUrl = `${fnBase}/i/${shortId}`;
    }

    return c.json({
      success: true,
      imageStorageUrl: shortImageUrl,
      quoteRequestUpdated: !!(resolvedQrId && imageStorageUrl),
    });
  } catch (err) {
    console.log("Unexpected error in /render-save-result:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Short image proxy — /i/:id → fetch and stream the file directly
// (Slack/Zapier can't follow 302 redirects for file uploads, so we proxy the bytes)
app.get("/make-server-4808de5e/i/:id", async (c) => {
  const id = c.req.param("id");
  const url = await kv.get(`img:${id}`);
  if (!url) return c.json({ error: "Image not found or expired" }, 404);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url as string, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback to redirect if fetch fails
      return c.redirect(url as string, 302);
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const body = await res.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    // Fallback to redirect on any error
    return c.redirect(url as string, 302);
  }
});

// Debug endpoint to inspect stored KV data for a render task
app.get("/make-server-4808de5e/render-debug/:taskId", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const taskId = c.req.param("taskId");
    if (!taskId || typeof taskId !== "string" || taskId.length > 200 || /[^a-zA-Z0-9_\-]/.test(taskId)) {
      return c.json({ error: "Invalid task ID format" }, 400);
    }
    const task = await kv.get(`render-task:${taskId}`);
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }
    // IDOR protection: verify the requesting user owns this render task
    const debugUser = await getUserFromRequest(c);
    if (task.userId && (!debugUser || debugUser.id !== task.userId)) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ task });
  } catch (err) {
    console.log("Unexpected error in /render-debug:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// FLOOR PLAN AI ANALYSIS
// =============================================

app.post("/make-server-4808de5e/analyze-floorplan", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-task");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please wait before trying again.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { imageBase64, contentType } = body;
    if (!imageBase64) {
      return c.json({ error: "imageBase64 is required" }, 400);
    }

    const apiKey = Deno.env.get("ai_model_keys");
    if (!apiKey) {
      console.log("ai_model_keys secret is not set for floor plan analysis");
      return c.json({ error: "AI API key not configured on server" }, 500);
    }

    // Build data URL for the vision API
    const mimeType = contentType || "image/png";
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    console.log(`Floor plan image payload: ${(imageBase64.length / 1024).toFixed(0)} KB base64, type: ${mimeType}`);

    // 2D floor plan layout analysis — focused purely on accurate geometry for the 2D editor
    const systemPrompt = `You are an expert architectural floor plan reader. Your ONLY task is to produce a precise 2D layout: room rectangles with exact boundaries, doors, and windows. The output feeds a 2D floor plan editor — materials, colors, lighting, and 3D concerns are handled separately by the app. Focus 100% on geometric accuracy.

=== VISUAL ELEMENT IDENTIFICATION ===

WALLS (include these):
  - THICK BLACK BARS → structural walls/columns (load-bearing, concrete). Always at perimeter and key junctions.
  - THIN PARALLEL LINES (hollow center) → partition walls dividing rooms. Still walls — never skip them.

NOT WALLS (exclude these):
  - DIMENSION LINES with numbers (mm) and tick marks → measurement annotations only. Use to read dimensions. Never create walls or rooms from these.
  - Scale notations, room labels, "100 DROP", refuse chute symbols → metadata only.

DOORS:
  - QUARTER-CIRCLE ARC near a wall opening → door swing path. Arc radius = door width. Pivot = hinge side.
  - Place on the wall the door is set into. positionRatio = center of opening along that wall (0.0 = start, 1.0 = end).

WINDOWS:
  - PARALLEL INTERNAL LINES within wall thickness (hatching pattern) → window, typically on exterior walls.
  - NOT the same as partition walls. Windows show distinct line patterns INSIDE the wall.
  - positionRatio = center of window along that wall. Default widthM: 1.2, heightM: 1.2, sillHeightM: 0.9.

FIXTURES (use to identify room type only):
  - Toilet (oval + tank) → bathroom. Sink/basin → bathroom or kitchen. Bathtub/shower → bathroom.
  - Kitchen counter (L-shape or linear line) + stove (circles) → kitchen.

=== CRITICAL GEOMETRY RULES ===

1. READ DIMENSIONS FROM ANNOTATIONS FIRST: If the image has dimension lines with numbers in mm (e.g., 3600, 1200, 11700), convert mm→m and use as the PRIMARY measurement source. This is the most important step for accuracy.

2. SHARED WALL ALIGNMENT (ZERO TOLERANCE): Adjacent rooms MUST share exact wall coordinates. If Room A's east boundary is at x=2.1 and Room B is immediately right of it, Room B's xMin MUST be exactly 2.1. No gaps, no overlaps between any adjacent rooms.

3. PERIMETER ALIGNMENT: All rooms along the same exterior wall must share the exact same boundary coordinate on that side. The outer perimeter must form a clean rectangular (or L-shaped) envelope.

4. COORDINATE SYSTEM: Origin at top-left corner of the unit. X increases rightward, Z increases downward (into the plan depth). All coordinates in meters.

5. DETECT EVERY ENCLOSED SPACE: Corridors, hallways, storerooms, bomb shelters, balconies, utility rooms, service yards. If it has walls around it, it is a room. Do not omit any space.

6. ROOM TYPES: living, bedroom, kitchen, bathroom, corridor, store, balcony, dining, utility, unknown.

7. WALL ORIENTATION: "north" = top wall (min Z side), "south" = bottom wall (max Z side), "west" = left wall (min X side), "east" = right wall (max X side).

=== OUTPUT FORMAT ===

Output ONLY a JSON object (no markdown fences, no explanation). Exact structure:
{"planName":"string","totalWidthM":number,"totalDepthM":number,"rooms":[{"id":"room-0","label":"Living Room","shortLabel":"Living","type":"living","boundsM":{"xMin":0,"xMax":3.6,"zMin":0,"zMax":4.5},"widthM":3.6,"depthM":4.5,"areaM2":16.2,"doors":[{"wall":"south","positionRatio":0.5,"widthM":0.8}],"windows":[{"wall":"north","positionRatio":0.5,"widthM":1.2,"heightM":1.2,"sillHeightM":0.9}]}],"confidence":0.0-1.0}

Room IDs: sequential room-0, room-1, room-2, etc.
Door defaults: 0.8m width for rooms, 0.7m for bathrooms.

=== ACCURACY CHECKLIST (verify before outputting) ===
✓ All dimension annotations read and converted mm→m for room bounds
✓ Adjacent rooms share exact wall coordinates (zero gaps, zero overlaps)
✓ Perimeter walls form a clean outline
✓ Every enclosed space detected (corridors, stores, bomb shelters, balconies)
✓ Doors on correct walls with accurate positionRatio
✓ Windows on exterior walls (unless clearly interior)
✓ Room types match fixture evidence
✓ totalWidthM and totalDepthM match overall dimension annotations`;

    const userPrompt = `Analyze this floor plan image. Extract the precise 2D layout geometry for a floor plan editor.

Step 1: Read ALL dimension annotations (numbers in mm) visible in the image. Convert to meters. These are the most reliable source for room sizes.
Step 2: Identify every enclosed space — rooms, corridors, bathrooms, stores, balconies, bomb shelters. Miss nothing.
Step 3: For each space, determine exact rectangular bounds in meters. Ensure adjacent rooms share wall coordinates with ZERO gaps or overlaps.
Step 4: Locate every door (quarter-circle arc) and window (hatched wall segment). Place on the correct wall with accurate positionRatio.
Step 5: Verify: perimeter alignment is clean, no gaps between rooms, all spaces accounted for, totalWidthM/totalDepthM match annotations.

Return ONLY the JSON object.`;

    console.log("Calling kie.ai Gemini 3 Flash vision API for floor plan analysis...");

    const response = await fetch("https://api.kie.ai/gemini-3-flash/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        stream: false,
        include_thoughts: true,
        reasoning_effort: "high",
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.log("kie.ai vision API error:", response.status, errText.substring(0, 500));
      return c.json({ error: `AI analysis failed (HTTP ${response.status}): ${errText.substring(0, 200)}` }, 500);
    }

    const aiResult = await response.json();
    console.log("kie.ai vision API response received, status:", response.status);

    const content = aiResult.choices?.[0]?.message?.content || aiResult.choices?.[0]?.text || "";
    if (!content) {
      console.log("kie.ai vision API returned no content. Full response:", JSON.stringify(aiResult).substring(0, 1000));
      return c.json({ error: "AI returned no content" }, 500);
    }

    console.log("AI response content length:", content.length, "preview:", content.substring(0, 200));

    // Parse JSON — strip any markdown code fences
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (_parseErr) {
      console.log("Failed to parse AI JSON, attempting extraction. Raw:", jsonStr.substring(0, 500));
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return c.json({ error: "AI returned invalid JSON", rawContent: jsonStr.substring(0, 1000) }, 500);
        }
      } else {
        return c.json({ error: "AI returned invalid JSON", rawContent: jsonStr.substring(0, 1000) }, 500);
      }
    }

    if (!parsed.rooms || !Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
      console.log("AI returned no rooms:", JSON.stringify(parsed).substring(0, 500));
      return c.json({ error: "AI did not detect any rooms in the floor plan" }, 500);
    }

    console.log(`AI analysis complete: ${parsed.rooms.length} rooms detected, confidence: ${parsed.confidence}`);
    return c.json({ success: true, data: parsed });
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log("Floor plan AI analysis timed out after 90s");
      return c.json({ error: "AI analysis timed out (90s). Try a smaller or clearer image." }, 504);
    }
    console.log("Unexpected error in /analyze-floorplan:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// FLOOR PLAN 3D — AUTH, PROJECTS & TEMPLATES
// =============================================

// --- Admin Verification & Setup ---

// Check if the authenticated user has admin privileges
app.get("/make-server-4808de5e/fp3d/admin/verify", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Not authenticated — please log in first", isAdmin: false }, 401);
    const adminFlag = await fp3dDb.getAdmin(user.id);
    if (adminFlag && adminFlag.isAdmin === true) {
      return c.json({ isAdmin: true, userId: user.id });
    }
    return c.json({ isAdmin: false, userId: user.id });
  } catch (err) {
    console.log("Error in fp3d/admin/verify:", err);
    return c.json({ error: "Admin verification failed: " + err, isAdmin: false }, 500);
  }
});

// Admin login: sign in with email/password, then verify admin privilege
app.post("/make-server-4808de5e/fp3d/admin/login", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many attempts. Please wait.", retryAfterMs: rl.retryAfterMs }, 429);

    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);
    if (!isValidEmail(email)) return c.json({ error: "Invalid email format" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Use a temporary client with anon key to sign in
    const anonSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({ email, password });
    
    if (signInError || !signInData?.user?.id) {
      console.log("Admin login failed:", signInError?.message || "No user returned");
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const userId = signInData.user.id;
    const accessToken = signInData.session?.access_token || null;

    // Check admin privilege
    const adminFlag = await fp3dDb.getAdmin(userId);
    if (!adminFlag || adminFlag.isAdmin !== true) {
      console.log(`Admin login denied for user ${userId} (${email}) — not an admin`);
      return c.json({ error: "Access denied. You do not have administrator privileges." }, 403);
    }

    console.log(`Admin login successful for user ${userId} (${email})`);
    return c.json({
      success: true,
      isAdmin: true,
      userId,
      email,
      accessToken,
      name: signInData.user.user_metadata?.name || email,
    });
  } catch (err) {
    console.log("Error in fp3d/admin/login:", err);
    return c.json({ error: "Admin login failed: " + err }, 500);
  }
});

// Promote a user to admin by email — requires an existing admin or first-time setup
app.post("/make-server-4808de5e/fp3d/admin/promote", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const { email, setupCode } = body;
    if (!email) return c.json({ error: "Email is required" }, 400);
    if (!isValidEmail(email)) return c.json({ error: "Invalid email format" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check if requester is already an admin
    const requester = await getUserFromRequest(c);
    let isAuthorized = false;

    if (requester) {
      const requesterAdmin = await fp3dDb.getAdmin(requester.id);
      if (requesterAdmin?.isAdmin === true) isAuthorized = true;
    }

    // If no existing admin is making this request, check for first-time setup
    if (!isAuthorized) {
      const existingAdmins = await fp3dDb.listAdmins();
      const hasAdmins = existingAdmins && existingAdmins.some((a: any) => a?.isAdmin === true);
      
      if (hasAdmins) {
        return c.json({ error: "Access denied. Only existing administrators can promote new admins." }, 403);
      }

      // No admins exist — first-time setup requires the ADMIN_SETUP_CODE secret
      const expectedCode = Deno.env.get("ADMIN_SETUP_CODE") || "";
      if (!expectedCode) {
        return c.json({ error: "ADMIN_SETUP_CODE secret has not been configured on the server." }, 500);
      }
      if (!setupCode || setupCode !== expectedCode) {
        return c.json({ error: "Invalid setup code for first-time admin registration." }, 403);
      }
    }

    // Find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return c.json({ error: "Failed to look up user: " + listError.message }, 500);
    
    const targetUser = users?.find((u: any) => u.email === email);
    if (!targetUser) return c.json({ error: `No user found with email: ${email}. They must sign up first.` }, 404);

    await fp3dDb.upsertAdmin(targetUser.id, {
      isAdmin: true,
      email,
      promotedAt: new Date().toISOString(),
      promotedBy: requester?.id || "first-time-setup",
    });

    console.log(`User ${targetUser.id} (${email}) promoted to admin`);
    return c.json({ success: true, userId: targetUser.id, email });
  } catch (err) {
    console.log("Error in fp3d/admin/promote:", err);
    return c.json({ error: "Promote failed: " + err }, 500);
  }
});

// Revoke admin privileges — requires admin auth
app.post("/make-server-4808de5e/fp3d/admin/revoke", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const requester = await getUserFromRequest(c);
    if (!requester) return c.json({ error: "Not authenticated" }, 401);
    
    const requesterAdmin = await fp3dDb.getAdmin(requester.id);
    if (!requesterAdmin?.isAdmin) return c.json({ error: "Access denied. Admin required." }, 403);

    const body = await c.req.json();
    const { userId } = body;
    if (!userId) return c.json({ error: "userId is required" }, 400);
    if (userId === requester.id) return c.json({ error: "You cannot revoke your own admin access." }, 400);

    await fp3dDb.deleteAdmin(userId);
    console.log(`Admin revoked for user ${userId} by ${requester.id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log("Error in fp3d/admin/revoke:", err);
    return c.json({ error: "Revoke failed: " + err }, 500);
  }
});

// List all admins — requires admin auth
app.get("/make-server-4808de5e/fp3d/admin/list", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const requester = await getUserFromRequest(c);
    if (!requester) return c.json({ error: "Not authenticated" }, 401);
    
    const requesterAdmin = await fp3dDb.getAdmin(requester.id);
    if (!requesterAdmin?.isAdmin) return c.json({ error: "Access denied. Admin required." }, 403);

    const admins = await fp3dDb.listAdmins();
    const adminList = (admins || []).filter((a: any) => a?.isAdmin === true);
    return c.json({ admins: adminList });
  } catch (err) {
    console.log("Error in fp3d/admin/list:", err);
    return c.json({ error: "List admins failed: " + err }, 500);
  }
});

// --- Signup ---
app.post("/make-server-4808de5e/fp3d/signup", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "signup");
    if (!rl.allowed) {
      securityLog("signup_rate_limited", "warn", ip, "/fp3d/signup");
      return c.json({ error: "Too many signup attempts. Please try again later." }, 429);
    }
    // Bot detection
    const ua = c.req.header("user-agent");
    if (isSuspiciousUA(ua)) {
      securityLog("signup_bot_detected", "warn", ip, "/fp3d/signup", { ua: ua?.slice(0, 100) });
      return c.json({ error: "Request blocked" }, 403);
    }
    const body = await c.req.json();
    const { name, email, password, contactNumber, keyCollectionPeriod, wantIdShortlist } = body;
    if (!name || !email || !password) return c.json({ error: "Name, email, and password are required" }, 400);
    if (!isValidEmail(email)) return c.json({ error: "Invalid email format" }, 400);
    if (typeof password !== "string" || password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.auth.admin.createUser({
      email: sanitizeString(email, 200).toLowerCase(),
      password,
      user_metadata: { role: "homeowner", name: sanitizeString(name, 100), contactNumber: sanitizeString(contactNumber || "", 20) },
      email_confirm: true,
    });
    if (error) { console.log("Signup error:", error.message); return c.json({ error: error.message }, 400); }
    if (data?.user?.id) {
      const cleanName = sanitizeString(name, 100);
      const cleanEmail = sanitizeString(email, 200).toLowerCase();
      const cleanPhone = sanitizeString(contactNumber || "", 20);
      await fp3dDb.upsertUser(data.user.id, {
        name: cleanName, email: cleanEmail,
        contactNumber: cleanPhone,
        keyCollectionPeriod: sanitizeString(keyCollectionPeriod || "", 50),
        wantIdShortlist: !!wantIdShortlist, createdAt: new Date().toISOString(),
      });
      // Also create homeowner profile so they can access /profile dashboard
      await kv.set(`homeowner:${data.user.id}`, {
        userId: data.user.id, name: cleanName, email: cleanEmail,
        phone: cleanPhone, createdAt: new Date().toISOString(),
        house: {}, inquiries: [],
      });
    }
    return c.json({ success: true, userId: data?.user?.id });
  } catch (err) { securityLog("signup_error", "error", getClientIp(c), "/fp3d/signup", { error: String(err) }); return c.json({ error: "Internal server error" }, 500); }
});

// --- Helper: Extract user from X-User-Token header ---
// Frontend sends publicAnonKey in Authorization (to pass Supabase Edge Function gateway)
// and the user's JWT in X-User-Token for user identification.
async function getUserFromRequest(c: any): Promise<{ id: string } | null> {
  // Prefer X-User-Token (frontend sends user JWT here, anon key goes in Authorization)
  const userToken = c.req.header("X-User-Token");
  if (userToken) return await resolveUserFromToken(userToken);
  // Fallback: try Authorization header, but skip if it matches the anon key
  const authToken = c.req.header("Authorization")?.replace(/^bearer\s+/i, "").trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!authToken || authToken === anonKey) return null;
  return await resolveUserFromToken(authToken);
}

async function resolveUserFromToken(token: string): Promise<{ id: string } | null> {
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user?.id) {
      console.log("[resolveUserFromToken] Failed:", error?.message || "no user");
      return null;
    }
    return { id: user.id };
  } catch (e) {
    console.log("[resolveUserFromToken] Error:", e);
    return null;
  }
}

// --- Projects CRUD ---
// NOTE: kv.getByPrefix returns an array of VALUES only (not {key,value} pairs).
// So we store `id` inside each project value to identify them after retrieval.
app.get("/make-server-4808de5e/fp3d/projects", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const userProjects = await fp3dDb.listUserProjects(user.id);
    console.log(`[Projects] Returning ${userProjects.length} projects for user ${user.id}`);
    return c.json({ projects: userProjects });
  } catch (err) { console.log("Error listing fp3d projects:", err); return c.json({ error: "Failed to list projects: " + err }, 500); }
});

app.post("/make-server-4808de5e/fp3d/projects", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const project = {
      id, userId: user.id, title: sanitizeString(body.title || "Untitled Floor Plan", 200),
      thumbnailUrl: body.thumbnailUrl || null, sourceType: body.sourceType === "template" ? "template" : "upload",
      sourceFileId: body.sourceFileId || null, projectData: body.projectData || {},
      createdAt: now, updatedAt: now,
    };
    await fp3dDb.upsertProject(project);
    return c.json({ success: true, project });
  } catch (err) { console.log("Error creating fp3d project:", err); return c.json({ error: "Failed to create project: " + err }, 500); }
});

app.get("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await fp3dDb.getProject(pId);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found or access denied" }, 404);
    return c.json({ project: existing });
  } catch (err) { console.log("Error getting fp3d project:", err); return c.json({ error: "Failed to get project: " + err }, 500); }
});

app.put("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await fp3dDb.getProject(pId);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, id: pId,
      ...(body.title !== undefined && { title: sanitizeString(body.title, 200) }),
      ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl }),
      ...(body.projectData !== undefined && { projectData: body.projectData }),
      updatedAt: new Date().toISOString(),
    };
    await fp3dDb.upsertProject(updated);
    return c.json({ success: true, project: updated });
  } catch (err) { console.log("Error updating fp3d project:", err); return c.json({ error: "Failed to update project: " + err }, 500); }
});

app.delete("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await fp3dDb.getProject(pId);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found" }, 404);
    await fp3dDb.deleteProject(pId);
    return c.json({ success: true });
  } catch (err) { console.log("Error deleting fp3d project:", err); return c.json({ error: "Failed to delete project: " + err }, 500); }
});

// --- Template File Upload ---
app.post("/make-server-4808de5e/fp3d/template-upload", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);

    const body = await c.req.json();
    const { fileBase64, fileName, contentType, fileType } = body;
    // fileType: "dwg" | "thumbnail"

    if (!fileBase64 || !fileName || !contentType || !fileType) {
      return c.json({ error: "fileBase64, fileName, contentType, and fileType are required" }, 400);
    }

    // Validate file type
    const allowedDwg = ["application/octet-stream", "application/acad", "application/x-dwg", "image/vnd.dwg", "image/x-dwg"];
    const allowedThumb = ["image/jpeg", "image/png", "image/webp"];
    const allowed = fileType === "dwg" ? [...allowedDwg, ...allowedThumb] : allowedThumb;
    // Be lenient with DWG content types since browsers often misidentify them
    if (fileType === "thumbnail" && !allowedThumb.includes(contentType)) {
      return c.json({ error: `Invalid thumbnail type. Allowed: ${allowedThumb.join(", ")}` }, 400);
    }

    // Validate file size: 20MB for DWG, 5MB for thumbnails
    const maxSize = fileType === "dwg" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    const estimatedSize = Math.ceil(fileBase64.length * 0.75);
    if (estimatedSize > maxSize) {
      return c.json({ error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` }, 400);
    }

    const cleanFileName = sanitizeString(fileName, MAX_FILENAME_LENGTH).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!cleanFileName) return c.json({ error: "Invalid file name" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const fileData = base64Decode(fileBase64);
    const folder = fileType === "dwg" ? "dwg" : "thumbnails";
    const filePath = `${folder}/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(TEMPLATE_BUCKET_NAME)
      .upload(filePath, fileData, { contentType: fileType === "dwg" ? "application/octet-stream" : contentType, upsert: true });

    if (uploadError) {
      console.log("Template file upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create a long-lived signed URL (valid for 1 year)
    const { data: signedData, error: signError } = await supabase.storage
      .from(TEMPLATE_BUCKET_NAME)
      .createSignedUrl(filePath, 365 * 24 * 3600);

    if (signError || !signedData?.signedUrl) {
      console.log("Template signed URL error:", signError);
      return c.json({ error: `Failed to create signed URL: ${signError?.message}` }, 500);
    }

    console.log("Template file uploaded successfully:", filePath);
    return c.json({ success: true, url: signedData.signedUrl, filePath });
  } catch (err) {
    console.log("Error in template-upload:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// --- Templates CRUD (Admin) ---
// NOTE: kv.getByPrefix returns an array of VALUES only (not {key,value} pairs).
// So we store `id` inside each template value to identify them after retrieval.
app.get("/make-server-4808de5e/fp3d/templates", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tplListUser = await getUserFromRequest(c);
    const allTemplates = await fp3dDb.listTemplates();
    const showAll = c.req.query("all") === "true";
    const templates = allTemplates
      .filter((t: any) => t && (showAll || t.isActive !== false))
      .filter((t: any) => t.id)
      .filter((t: any) => !t.userId || (tplListUser && t.userId === tplListUser.id));
    console.log(`[Templates] Returning ${templates.length} templates (showAll=${showAll})`);
    return c.json({ templates });
  } catch (err) { console.log("Error listing fp3d templates:", err); return c.json({ error: "Failed to list templates: " + err }, 500); }
});

app.post("/make-server-4808de5e/fp3d/templates", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const templateUser = await getUserFromRequest(c);
    if (!templateUser) return c.json({ error: "Authentication required" }, 401);
    const body = await c.req.json();
    if (!body.name) return c.json({ error: "Template name is required" }, 400);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const template = {
      id, // store id inside the value so getByPrefix can return it
      userId: templateUser.id, // ownership tracking
      name: sanitizeString(body.name, 200), category: sanitizeString(body.category || "bto", 50),
      unitType: sanitizeString(body.unitType || "3-Room", 50), description: sanitizeString(body.description || "", 1000),
      dwgFileUrl: body.dwgFileUrl || null, thumbnailUrl: body.thumbnailUrl || null,
      projectData: body.projectData || null,
      isActive: true, createdAt: now, updatedAt: now,
    };
    await fp3dDb.upsertTemplate(template);
    return c.json({ success: true, template });
  } catch (err) { console.log("Error creating fp3d template:", err); return c.json({ error: "Failed to create template: " + err }, 500); }
});

// --- Get single template ---
app.get("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplUser = await getUserFromRequest(c);
    if (existing.userId && (!tplUser || tplUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json({ template: existing });
  } catch (err) { console.log("Error getting fp3d template:", err); return c.json({ error: "Failed to get template: " + err }, 500); }
});

app.put("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplPutUser = await getUserFromRequest(c);
    if (existing.userId && (!tplPutUser || tplPutUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const body = await c.req.json();

    // ═══ Auto-save version snapshot before updating (max 20 versions per template) ═══
    if (existing.projectData) {
      try {
        const versionId = Date.now().toString();
        const versionSnap = {
          versionId,
          templateId: tId,
          name: existing.name || "Untitled",
          savedAt: new Date().toISOString(),
          roomCount: existing.projectData?.roomDefinitions?.length || existing.projectData?.roomDefs?.length || 0,
          furnitureCount: existing.projectData?.furniture
            ? Object.values(existing.projectData.furniture).reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0) : 0,
          projectData: existing.projectData,
          thumbnailUrl: existing.thumbnailUrl || null,
        };
        await fp3dDb.insertVersion(tId, versionId, versionSnap);
        const allVersions = await fp3dDb.listVersions(tId);
        if (allVersions.length > 20) {
          const sorted = allVersions.filter((v: any) => v?.versionId).sort((a: any, b: any) => Number(a.versionId) - Number(b.versionId));
          const toDelete = sorted.slice(0, sorted.length - 20);
          for (const v of toDelete) { await fp3dDb.deleteVersion(tId, v.versionId); }
        }
      } catch (vErr) { console.log("[Templates] Version snapshot failed (non-fatal):", vErr); }
    }

    const updated = { ...existing,
      id: tId,
      ...(body.name !== undefined && { name: sanitizeString(body.name, 200) }),
      ...(body.category !== undefined && { category: sanitizeString(body.category, 50) }),
      ...(body.unitType !== undefined && { unitType: sanitizeString(body.unitType, 50) }),
      ...(body.description !== undefined && { description: sanitizeString(body.description, 1000) }),
      ...(body.dwgFileUrl !== undefined && { dwgFileUrl: body.dwgFileUrl }),
      ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.projectData !== undefined && { projectData: body.projectData }),
      updatedAt: new Date().toISOString(),
    };
    await fp3dDb.upsertTemplate(updated);
    return c.json({ success: true, template: updated });
  } catch (err) { console.log("Error updating fp3d template:", err); return c.json({ error: "Failed to update template: " + err }, 500); }
});

app.delete("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplDelUser = await getUserFromRequest(c);
    if (existing.userId && (!tplDelUser || tplDelUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    await fp3dDb.upsertTemplate({ ...existing, id: tId, isActive: false, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (err) { console.log("Error deleting fp3d template:", err); return c.json({ error: "Failed to delete template: " + err }, 500); }
});

// --- Duplicate template ---
app.post("/make-server-4808de5e/fp3d/templates/:id/duplicate", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplDupUser = await getUserFromRequest(c);
    if (existing.userId && (!tplDupUser || tplDupUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const duplicate = {
      ...existing,
      id: newId,
      userId: tplDupUser?.id || existing.userId,
      name: `${existing.name || "Untitled"} (Copy)`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await fp3dDb.upsertTemplate(duplicate);
    console.log(`[Templates] Duplicated template ${tId} -> ${newId}`);
    return c.json({ success: true, template: duplicate });
  } catch (err) { console.log("Error duplicating fp3d template:", err); return c.json({ error: "Failed to duplicate template: " + err }, 500); }
});

// --- Hard delete template (permanent) ---
app.delete("/make-server-4808de5e/fp3d/templates/:id/permanent", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplPermDelUser = await getUserFromRequest(c);
    if (existing.userId && (!tplPermDelUser || tplPermDelUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    await fp3dDb.deleteTemplate(tId);
    // Also delete version history
    try { await fp3dDb.deleteAllVersions(tId); } catch (_) {}
    console.log(`[Templates] Permanently deleted template ${tId} and its versions`);
    return c.json({ success: true });
  } catch (err) { console.log("Error permanently deleting fp3d template:", err); return c.json({ error: "Failed to permanently delete template: " + err }, 500); }
});

// --- List template versions ---
app.get("/make-server-4808de5e/fp3d/templates/:id/versions", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    // IDOR protection: verify ownership of parent template
    const tplVerUser = await getUserFromRequest(c);
    const parentTpl = await fp3dDb.getTemplate(tId);
    if (!parentTpl) return c.json({ error: "Template not found" }, 404);
    if (parentTpl.userId && (!tplVerUser || tplVerUser.id !== parentTpl.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const allVersions = await fp3dDb.listVersions(tId);
    const versions = allVersions
      .filter((v: any) => v?.versionId)
      .sort((a: any, b: any) => Number(b.versionId) - Number(a.versionId))
      .map((v: any) => ({ versionId: v.versionId, savedAt: v.savedAt, name: v.name, roomCount: v.roomCount, furnitureCount: v.furnitureCount, thumbnailUrl: v.thumbnailUrl }));
    return c.json({ versions });
  } catch (err) { console.log("Error listing template versions:", err); return c.json({ error: "Failed to list versions: " + err }, 500); }
});

// --- Restore template version ---
app.post("/make-server-4808de5e/fp3d/templates/:id/versions/:versionId/restore", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const vId = c.req.param("versionId");
    const existing = await fp3dDb.getTemplate(tId);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplRestoreUser = await getUserFromRequest(c);
    if (existing.userId && (!tplRestoreUser || tplRestoreUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const version = await fp3dDb.getVersion(tId, vId);
    if (!version || !version.projectData) return c.json({ error: "Version not found" }, 404);
    // Save current state as a version before restoring
    if (existing.projectData) {
      try {
        const snapId = Date.now().toString();
        await fp3dDb.insertVersion(tId, snapId, {
          versionId: snapId, templateId: tId, name: `Pre-restore: ${existing.name}`,
          savedAt: new Date().toISOString(),
          roomCount: existing.projectData?.roomDefinitions?.length || 0,
          furnitureCount: existing.projectData?.furniture ? Object.values(existing.projectData.furniture).reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0) : 0,
          projectData: existing.projectData, thumbnailUrl: existing.thumbnailUrl || null,
        });
      } catch (_) {}
    }
    const restored = { ...existing, id: tId, projectData: version.projectData, thumbnailUrl: version.thumbnailUrl || existing.thumbnailUrl, updatedAt: new Date().toISOString() };
    await fp3dDb.upsertTemplate(restored);
    console.log(`[Templates] Restored template ${tId} to version ${vId}`);
    return c.json({ success: true, template: restored });
  } catch (err) { console.log("Error restoring template version:", err); return c.json({ error: "Failed to restore version: " + err }, 500); }
});

// --- Lead Capture ---
app.post("/make-server-4808de5e/fp3d/lead", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    if (!body.name || !body.email || !body.contactNumber) return c.json({ error: "Name, email, and contact are required" }, 400);
    await fp3dDb.insertLead({
      name: sanitizeString(body.name, 100), email: sanitizeString(body.email, 200).toLowerCase(),
      contactNumber: sanitizeString(body.contactNumber, 20),
      keyCollectionPeriod: sanitizeString(body.keyCollectionPeriod || "", 50),
    });
    return c.json({ success: true });
  } catch (err) { console.log("Error saving fp3d lead:", err); return c.json({ error: "Failed to save lead: " + err }, 500); }
});

// =============================================
// DESIGNER PROFILE ROUTES
// =============================================

// ── Super account auth helper ──
function isAuthorizedForSlug(session: any, slug: string): boolean {
  if (!session) return false;
  if (session.isSuper) return true;
  return session.slug === slug;
}

// ── SQL helpers for designers (replaces KV) ──
function getDesignerSupabase() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function getDesignerProfile(slug: string): Promise<any | null> {
  const sb = getDesignerSupabase();
  const { data } = await sb.from("designers").select("slug, name, data").eq("slug", slug).maybeSingle();
  if (!data?.data) return null;
  return { ...data.data, slug: data.slug, name: data.data?.name || data.name };
}

async function getDesignerSection(slug: string, section: string): Promise<any | null> {
  const sb = getDesignerSupabase();
  const { data } = await sb.from("designer_sections").select("data").eq("slug", slug).eq("section", section).maybeSingle();
  return data?.data || null;
}

async function saveDesignerProfile(slug: string, profileData: any): Promise<void> {
  const sb = getDesignerSupabase();
  await sb.from("designers").upsert(
    { slug, name: profileData.name || slug, data: profileData, updated_at: new Date().toISOString() },
    { onConflict: "slug" },
  );
}

async function saveDesignerSection(slug: string, section: string, sectionData: any): Promise<void> {
  const sb = getDesignerSupabase();
  const { data: existing } = await sb.from("designer_sections").select("id").eq("slug", slug).eq("section", section).maybeSingle();
  if (existing) {
    await sb.from("designer_sections").update({ data: sectionData, updated_at: new Date().toISOString() }).eq("slug", slug).eq("section", section);
  } else {
    await sb.from("designer_sections").insert({ slug, section, data: sectionData });
  }
}

// ── designer_projects (row-per-project) dual-write helpers ──
// See supabase/migrations/20260422_designer_projects.sql.
async function insertDesignerProjectRow(slug: string, payload: {
  title?: string; location?: string; cost?: string; size?: string; sizeUnit?: string;
  year?: string; propertyType?: string; propertySubType?: string; style?: string;
  worksIncluded?: any[]; driveUrl?: string; images?: string[]; sourceUrl?: string;
  variant?: string; contactEmail?: string; submittedAt?: string;
}): Promise<void> {
  const sb = getDesignerSupabase();
  const { error } = await sb.from("designer_projects").insert({
    designer_slug: slug,
    title: String(payload.title || "").slice(0, 300),
    location: String(payload.location || "").slice(0, 200),
    cost: String(payload.cost || "").slice(0, 100),
    size: String(payload.size || "").slice(0, 100),
    size_unit: String(payload.sizeUnit || "").slice(0, 20),
    year: String(payload.year || "").slice(0, 8),
    property_type: String(payload.propertyType || "").slice(0, 60),
    property_sub_type: String(payload.propertySubType || "").slice(0, 80),
    style: String(payload.style || "").slice(0, 100),
    works_included: Array.isArray(payload.worksIncluded) ? payload.worksIncluded.slice(0, 20) : [],
    drive_url: String(payload.driveUrl || "").slice(0, 500),
    images: Array.isArray(payload.images) ? payload.images.slice(0, 40).map(String) : [],
    source_url: String(payload.sourceUrl || "").slice(0, 500),
    variant: String(payload.variant || "full").slice(0, 30),
    contact_email: String(payload.contactEmail || "").slice(0, 200),
    submitted_at: payload.submittedAt || new Date().toISOString(),
  });
  if (error) console.log("insertDesignerProjectRow error:", error.message);
}

// Download an external image URL and upload to our Supabase storage.
// Returns the public URL, or "" on failure (caller should fall back to the source URL).
async function fetchAndUploadImage(sourceUrl: string): Promise<string> {
  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!/^image\//i.test(contentType)) return "";
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength < 100 || bytes.byteLength > MAX_IMAGE_SIZE_BYTES) return "";
    const ext = contentType.split("/")[1]?.split(";")[0]?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const filePath = `imported/${crypto.randomUUID()}.${ext}`;
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await supabaseAdmin.storage
      .from(DESIGNER_BUCKET_NAME)
      .upload(filePath, bytes, { contentType, upsert: false });
    if (error) { console.log("fetchAndUploadImage upload error:", error.message); return ""; }
    return `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${DESIGNER_BUCKET_NAME}/${filePath}`;
  } catch (err) {
    console.log("fetchAndUploadImage error:", err instanceof Error ? err.message : String(err));
    return "";
  }
}

// Light preview for the firm-onboarding project form — list the images in a
// Drive folder without downloading/mirroring them. Returns thumbnail URLs so
// the client can show a grid before the firm submits.
app.post("/make-server-4808de5e/firm-onboarding/drive-folder-preview", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ ok: false, message: "Too many requests" }, 429);

    const body = await c.req.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!apiKey) return c.json({ ok: false, message: "Drive API not configured" }, 500);
    const folderId = extractDriveFolderId(url);
    if (!folderId) return c.json({ ok: false, message: "Paste a Google Drive folder link" }, 400);

    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`)}&fields=${encodeURIComponent("files(id,name,mimeType,thumbnailLink,size)")}&pageSize=40&key=${apiKey}`;
    const res = await fetch(listUrl);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = res.status === 403 || res.status === 404
        ? "Folder is not publicly shared. Set access to 'Anyone with the link'."
        : `Drive API error (${res.status})`;
      console.log("drive-folder-preview:", res.status, text.slice(0, 200));
      return c.json({ ok: false, message: msg }, 400);
    }
    const json = await res.json().catch(() => ({}));
    const files: any[] = Array.isArray(json.files) ? json.files : [];
    const images = files.slice(0, 40).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      // Prefer lh3.googleusercontent.com — drive.google.com/thumbnail redirects
      // to a consent page when hot-linked from another origin (breaks images).
      thumbnailUrl: `https://lh3.googleusercontent.com/d/${f.id}=w720`,
    }));
    return c.json({ ok: true, count: images.length, images });
  } catch (err: any) {
    console.log("drive-folder-preview error:", err);
    return c.json({ ok: false, message: "Preview failed" }, 500);
  }
});

// Download one Drive image by file ID and upload it to our Supabase storage,
// returning the public URL. We fetch Google's pre-sized CDN thumbnail
// (sz=w2048 JPEG) rather than the full-res original — no WASM decode needed
// in-function, so each invocation stays well under Deno Deploy's CPU/memory
// budget even when the client fires several in parallel.
app.post("/make-server-4808de5e/firm-onboarding/ingest-drive-image", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ ok: false, message: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "drive-ingest");
    if (!rl.allowed) return c.json({ ok: false, message: "Too many requests" }, 429);

    const body = await c.req.json().catch(() => ({}));
    const fileId = typeof body?.fileId === "string" ? body.fileId.trim() : "";
    if (!/^[a-zA-Z0-9_-]{8,}$/.test(fileId)) return c.json({ ok: false, message: "Invalid fileId" }, 400);

    const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w2048`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(cdnUrl, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    if (!res.ok) {
      console.log("ingest-drive-image fetch failed", fileId, res.status);
      return c.json({ ok: false, message: `CDN returned ${res.status}` }, 400);
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!/^image\//i.test(contentType)) {
      console.log("ingest-drive-image non-image", fileId, contentType);
      return c.json({ ok: false, message: "Not an image" }, 400);
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    // 15MB ceiling — lh3 at w1600 is typically well under 1MB, so anything
    // bigger is probably a consent page redirect or an error payload.
    if (bytes.byteLength < 500 || bytes.byteLength > 15 * 1024 * 1024) {
      console.log("ingest-drive-image bad size", fileId, bytes.byteLength);
      return c.json({ ok: false, message: "Unexpected response size" }, 400);
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const filePath = `drive/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from(DESIGNER_BUCKET_NAME)
      .upload(filePath, bytes, { contentType, upsert: false });
    if (error) { console.log("ingest-drive-image upload:", error.message); return c.json({ ok: false, message: "Upload failed" }, 500); }

    return c.json({
      ok: true,
      url: `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${DESIGNER_BUCKET_NAME}/${filePath}`,
    });
  } catch (err: any) {
    console.log("ingest-drive-image error:", err instanceof Error ? err.message : String(err));
    return c.json({ ok: false, message: "Ingest failed" }, 500);
  }
});

// Extract a Google Drive folder ID from any shape of Drive link.
function extractDriveFolderId(url: string): string | null {
  if (!url) return null;
  // /drive/folders/<ID>  or  /folders/<ID>
  const m1 = url.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];
  // ?id=<ID> or /open?id=<ID>
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];
  return null;
}

// List the images in a public Google Drive folder and return their direct
// thumbnail URLs. We don't download/mirror them inside the submit handler
// — that was hitting Deno Deploy's WORKER_RESOURCE_LIMIT on folders with
// several full-res photos. Drive serves these URLs publicly at any width.
async function listDriveFolderImageUrls(folderUrl: string): Promise<string[]> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) { console.log("listDriveFolderImageUrls: GOOGLE_API_KEY not set"); return []; }
  const folderId = extractDriveFolderId(folderUrl);
  if (!folderId) return [];
  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`)}&fields=${encodeURIComponent("files(id)")}&pageSize=25&key=${apiKey}`;
    const listRes = await fetch(listUrl);
    if (!listRes.ok) {
      console.log("listDriveFolderImageUrls list error:", listRes.status, (await listRes.text().catch(() => "")).slice(0, 200));
      return [];
    }
    const listJson = await listRes.json().catch(() => ({}));
    const files: any[] = Array.isArray(listJson.files) ? listJson.files.slice(0, 25) : [];
    // Use Google's photo CDN rather than drive.google.com/thumbnail — the
    // latter redirects to a consent page when hot-linked from another origin,
    // which shows as broken images on the live designer pages.
    return files.map((f: any) => `https://lh3.googleusercontent.com/d/${f.id}=w2048`);
  } catch (err) {
    console.log("listDriveFolderImageUrls error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Bounded-concurrency mirror of external images; returns final URLs in order.
// Failed mirrors fall back to the original URL so the project doesn't lose photos.
// URLs already hosted on our own Supabase storage are passed through as-is —
// the client ingests Drive images one-by-one, so they're already in our bucket.
async function mirrorProjectImages(urls: string[]): Promise<string[]> {
  const ownPrefix = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/`;
  const out: string[] = new Array(urls.length);
  const CONCURRENCY = 3;
  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= urls.length) break;
      const url = urls[idx];
      if (url.startsWith(ownPrefix)) { out[idx] = url; continue; }
      const mirrored = await fetchAndUploadImage(url);
      out[idx] = mirrored || url;
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return out;
}

async function deleteDesignerAndSections(slug: string): Promise<void> {
  const sb = getDesignerSupabase();
  await sb.from("designer_sections").delete().eq("slug", slug);
  await sb.from("designers").delete().eq("slug", slug);
}

async function getDesignerWithSections(slug: string) {
  const sb = getDesignerSupabase();
  const [profileRes, sectionsRes] = await Promise.all([
    sb.from("designers").select("slug, name, data").eq("slug", slug).maybeSingle(),
    sb.from("designer_sections").select("section, data").eq("slug", slug),
  ]);
  const profile = profileRes.data?.data ? { ...profileRes.data.data, slug: profileRes.data.slug, name: profileRes.data.data?.name || profileRes.data.name } : null;
  const sections: Record<string, any> = {};
  for (const row of (sectionsRes.data || [])) {
    sections[row.section] = row.data;
  }
  return { profile, sections };
}

// GET all designers (list)
app.get("/make-server-4808de5e/designers", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "scrape-designers");
    if (!rl.allowed) {
      securityLog("scrape_rate_limited", "warn", ip, "/designers");
      return c.json({ error: "Too many requests" }, 429);
    }

    const sb = getDesignerSupabase();
    const showAll = c.req.query("showAll") === "true";

    // Fetch designers + sections. Admin mode pulls all sections (for completeness
    // calc); public mode pulls only `projects` so we can derive a thumbnail
    // fallback when images.cover is empty.
    const sectionsQuery = showAll
      ? sb.from("designer_sections").select("slug, section, data")
      : sb.from("designer_sections").select("slug, section, data").eq("section", "projects");
    const [designersRes, sectionsRes] = await Promise.all([
      sb.from("designers").select("slug, name, data"),
      sectionsQuery,
    ]);

    if (designersRes.error) {
      console.log("Error fetching designers:", designersRes.error);
      return c.json({ error: `Failed to fetch designers: ${designersRes.error.message}` }, 500);
    }

    // Build sections lookup by slug. Always populated now so we can derive
    // a thumbnail fallback from the first project image.
    const sectionsBySlug: Record<string, Record<string, any>> = {};
    if (sectionsRes.data) {
      for (const row of sectionsRes.data as any[]) {
        if (!sectionsBySlug[row.slug]) sectionsBySlug[row.slug] = {};
        sectionsBySlug[row.slug][row.section] = row.data;
      }
    }

    // Pick the best thumbnail URL from a project: prefer the legacy `image`
    // field (the hero), then coverImage / featuredImage, then gallery[0].
    const pickProjectThumb = (p: any): string => {
      if (!p || typeof p !== "object") return "";
      for (const k of ["image", "coverImage", "featuredImage"]) {
        const v = p[k];
        if (typeof v === "string" && v) return v;
      }
      const g0 = Array.isArray(p.gallery) ? p.gallery[0] : null;
      if (typeof g0 === "string") return g0;
      if (g0 && typeof g0 === "object" && typeof g0.src === "string") return g0.src;
      return "";
    };

    // Profile completeness checker based on required checklist
    const s = (v: any) => typeof v === "string" ? v.trim() : "";
    function computeCompleteness(d: any, sections: Record<string, any>): { filled: number; total: number; missing: string[] } {
      const missing: string[] = [];
      const bi = Array.isArray(sections.businessinfo) ? sections.businessinfo : Array.isArray(d.businessInfo) ? d.businessInfo : [];
      const biByLabel = new Map<string, string>();
      for (const b of bi) { if (b?.label && s(b?.value)) biByLabel.set(b.label, b.value); }

      const projects = Array.isArray(sections.projects) ? sections.projects : Array.isArray(d.projects) ? d.projects : [];
      const creds = d.credentials || {};
      const ts = d.trustedSince || {};

      // 1. Cover / Featured Project
      const cp = d.coverProject || {};
      if (!d.images?.cover && !s(cp.image)) missing.push("Cover Image");
      if (!s(cp.name)) missing.push("Featured Project Name");
      if (!s(cp.cost)) missing.push("Featured Project Cost");
      if (!s(cp.area)) missing.push("Featured Project Area");
      if (!s(String(cp.year || ""))) missing.push("Featured Project Year");
      if (!s(cp.style)) missing.push("Featured Project Style");

      // 2. Studio Info
      if (!d.images?.logo) missing.push("Logo");
      if (!s(d.name)) missing.push("Studio Name");
      if (!s(d.tagline)) missing.push("Tagline");
      if (!s(d.location)) missing.push("Location");

      // 3. Bio
      if (!s(d.bio) && !s(d.about)) missing.push("Bio / About");

      // 4. Quick Facts
      if (!biByLabel.has("ACRA / UEN")) missing.push("ACRA / UEN");
      if (!biByLabel.has("Office address")) missing.push("Office Address");
      if (!biByLabel.has("Project types")) missing.push("Project Types");
      if (!biByLabel.has("Style specialisation")) missing.push("Style Specialisation");
      if (!biByLabel.has("Service area")) missing.push("Service Area");
      if (!biByLabel.has("Specialisation")) missing.push("Specialisation");
      if (!biByLabel.has("Services")) missing.push("Services");
      if (!biByLabel.has("Phone")) missing.push("Phone");
      if (!biByLabel.has("Financing")) missing.push("Financing");

      // 5. Key Metrics
      if (!d.stats?.years && !s(d.yearsExperience)) missing.push("Industry Experience");
      if (!biByLabel.has("Budget range") && !s(d.budgetRange)) missing.push("Budget Range");

      // 6. Projects (at least 1)
      if (!projects.length) missing.push("Projects (at least 1)");

      // 7. Credentials & Trust
      const hasAnyCred = (creds.hdb?.active && creds.hdb?.reg) || (creds.bca?.active && creds.bca?.reg) || creds.landedEligible || s(ts.title) || (ts.badges?.length > 0);
      if (!hasAnyCred) missing.push("Credentials & Trust");

      // 8. Google Reviews — Google Maps link / placeId
      if (!s(d.googlePlaceId) && !s(d.placeId) && !s(d.googleMapsLink)) missing.push("Google Maps Link");

      const total = 28;
      const filled = total - missing.length;
      return { filled, total, missing };
    }

    // Coerce a raw cost string ("S$48,000", "48000", "$30K") into a number in
    // thousands of SGD so we can compute a min/max range across projects.
    const costToK = (raw: any): number | null => {
      if (typeof raw === "number") return raw >= 1000 ? raw / 1000 : raw;
      if (typeof raw !== "string") return null;
      const m = raw.match(/([\d,.]+)\s*(k)?/i);
      if (!m) return null;
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (!Number.isFinite(n)) return null;
      return /k$/i.test(m[2] || "") ? n : (n >= 1000 ? n / 1000 : n);
    };

    const allDesigners = (designersRes.data || []).map((d: any) => {
      const designer = { ...(d.data || {}), slug: d.slug, name: d.data?.name || d.name };
      const sections = sectionsBySlug[d.slug] || {};
      const projects: any[] = Array.isArray(sections.projects) ? sections.projects
        : Array.isArray(designer.projects) ? designer.projects : [];

      // Thumbnail fallback: if there's no images.cover, derive one from the
      // first project so the directory card isn't blank.
      if (!designer.images?.cover) {
        for (const p of projects) {
          const thumb = pickProjectThumb(p);
          if (thumb) {
            designer.images = { ...(designer.images || {}), cover: thumb };
            break;
          }
        }
      }

      // ── Aggregate filterable + sortable signals from real project data ──
      // Without this, designers who never manually filled in their
      // "Project types" / "Style specialisation" businessInfo rows would
      // never match the directory's Property/Style filters.
      if (projects.length > 0) {
        // (1) totalProjects → drives the "Most Projects" sort and the card pill.
        designer.totalProjects = projects.length;

        // (2) Property types — collect distinct, normalize to filter labels.
        const ptypes = new Set<string>();
        for (const p of projects) {
          const t = String(p?.propertyType || "").toLowerCase();
          if (!t) continue;
          if (/hdb/.test(t)) ptypes.add("HDB");
          else if (/executive\s*condo|\bec\b/.test(t)) ptypes.add("EC");
          else if (/condo/.test(t)) ptypes.add("Condo");
          else if (/landed|terrace|bungalow|semi/.test(t)) ptypes.add("Landed");
          else if (/commercial|office|retail|f&b|restaurant|cafe/.test(t)) ptypes.add("Commercial");
        }
        if (ptypes.size > 0) {
          // Inject into businessInfo so frontend's existing parser picks it up.
          // Replace any existing "Project types" entry with the union of
          // declared + aggregated, so both data sources contribute.
          const bInfo = Array.isArray(designer.businessInfo) ? [...designer.businessInfo] : [];
          const existingIdx = bInfo.findIndex((b: any) => b?.label === "Project types");
          const existing = existingIdx >= 0 ? String(bInfo[existingIdx].value || "") : "";
          for (const t of existing.split(/\s*·\s*/).map((s: string) => s.trim()).filter(Boolean)) ptypes.add(t);
          const merged = Array.from(ptypes).join(" · ");
          if (existingIdx >= 0) bInfo[existingIdx] = { ...bInfo[existingIdx], value: merged };
          else bInfo.push({ label: "Project types", value: merged });
          designer.businessInfo = bInfo;
        }

        // (3) Styles — collect distinct project styles and merge into designStyles.
        const styles = new Set<string>(Array.isArray(designer.designStyles) ? designer.designStyles : []);
        for (const p of projects) {
          const s = String(p?.style || "").trim();
          if (!s) continue;
          // Project style fields can be comma-joined ("Vintage, Colourful").
          for (const piece of s.split(/\s*,\s*/).map((x: string) => x.trim()).filter(Boolean)) styles.add(piece);
        }
        if (styles.size > 0) designer.designStyles = Array.from(styles);

        // (4) Budget range — only fill in if not already declared.
        const declaredBudget = Array.isArray(designer.businessInfo)
          ? designer.businessInfo.find((b: any) => /budget/i.test(b?.label || ""))?.value
          : "";
        if (!declaredBudget) {
          const ks = projects.map((p: any) => costToK(p?.cost)).filter((n): n is number => n != null && n > 0);
          if (ks.length >= 2) {
            const min = Math.min(...ks);
            const max = Math.max(...ks);
            const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}M` : `$${Math.round(n)}K`;
            const range = min === max ? `From ${fmt(min)}` : `${fmt(min)} – ${fmt(max)}`;
            const bInfo = Array.isArray(designer.businessInfo) ? [...designer.businessInfo] : [];
            bInfo.push({ label: "Budget range", value: range });
            designer.businessInfo = bInfo;
          }
        }
      }

      if (showAll) {
        try {
          designer.completeness = computeCompleteness(designer, sections);
        } catch (e) {
          console.log(`Completeness calc failed for ${d.slug}:`, e);
          designer.completeness = { filled: 0, total: 28, missing: ["Error computing"] };
        }
      }
      return designer;
    });

    const activeDesigners = showAll
      ? allDesigners.filter((d: any) => !d.deletedAt)
      : allDesigners.filter((d: any) => d.active !== false && !d.deletedAt);
    // Pagination — limit response size to prevent bulk scraping
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100); // max 100
    const offset = Math.max(parseInt(c.req.query("offset") || "0"), 0);
    const designers = activeDesigners.slice(offset, offset + limit);

    // Attach cached Google review summary (rating + total) to each returned
    // designer so the directory's "Highest Rated" / "Most Reviewed" sorts and
    // the rating chip on the card use real Google data instead of the manual
    // stats fields. Reads from KV only — never refreshes here so the listing
    // stays fast.
    try {
      const cached = await Promise.all(
        designers.map((d: any) => kv.get(`google-reviews:${d.slug}`).catch(() => null)),
      );
      designers.forEach((d: any, i: number) => {
        const c = cached[i] as any;
        if (c && (c.rating || c.totalRatings)) {
          d.googleMeta = {
            rating: typeof c.rating === "number" ? c.rating : 0,
            totalRatings: typeof c.totalRatings === "number" ? c.totalRatings : 0,
            source: c.source || "google",
          };
        }
      });
    } catch (e) {
      console.log("Failed to attach googleMeta to /designers listing:", e);
    }

    const completeCount = showAll ? allDesigners.filter((d: any) => d.completeness?.missing?.length === 0).length : undefined;
    console.log(`Returning ${designers.length} of ${activeDesigners.length} active designers (${allDesigners.length} total)`);
    return c.json({ count: activeDesigners.length, data: designers, limit, offset, completeCount });
  } catch (err) {
    console.log("Unexpected error in GET /designers:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET single designer by slug
app.get("/make-server-4808de5e/designers/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "scrape-profile");
    if (!rl.allowed) {
      securityLog("scrape_rate_limited", "warn", ip, "/designers/:slug");
      return c.json({ error: "Too many requests" }, 429);
    }

    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) {
      return c.json({ error: "Invalid slug" }, 400);
    }

    const { profile, sections } = await getDesignerWithSections(slug);

    if (!profile) {
      return c.json({ error: "Designer not found" }, 404);
    }

    // Soft-deleted profiles are hidden from the public profile route.
    if (profile.deletedAt) {
      return c.json({ error: "Designer not found" }, 404);
    }

    if (profile.active === false && c.req.query("preview") !== "1") {
      return c.json({ error: "Designer not found" }, 404);
    }

    const rawProjects = sections.projects || profile.projects || [];
    const filteredProjects = rawProjects;

    console.log(`Fetched designer profile: ${slug}`);
    return c.json({
      data: {
        ...profile,
        team: sections.team || profile.team || [],
        projects: filteredProjects,
        caseStudies: sections.casestudies || profile.caseStudies || [],
        reviews: sections.reviews || profile.reviews || [],
        latestReviews: sections.latestreviews || profile.latestReviews || [],
        serviceArea: sections.servicearea || profile.serviceArea || {},
        businessInfo: sections.businessinfo || profile.businessInfo || [],
      },
    });
  } catch (err) {
    console.log("Unexpected error in GET /designers/:slug:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ═══════════════════════════════════════════════════════
// GOOGLE REVIEWS — cached in KV, refreshed monthly
// ═══════════════════════════════════════════════════════
// Strategy:
//   • Per-designer cache key: `google-reviews:${slug}`
//   • TTL: 30 days. Reads return cached payload until expiry.
//   • Source: Google Place Details API (when GOOGLE_PLACES_API_KEY env var is
//     set AND the designer profile has a `googlePlaceId`). Otherwise we serve
//     a mock/empty payload so the UI can render without billing us anything.
//   • Force refresh:
//       - POST /google-reviews/:slug/refresh   (admin or cron secret)
//       - POST /google-reviews/cron-refresh-all (monthly cron, secret-protected)
//   • To wire monthly refresh: schedule a cron (Supabase pg_cron, Vercel cron,
//     GitHub Actions, etc.) to POST to /cron-refresh-all with header
//     `x-cron-secret: $CRON_SECRET`.

const GOOGLE_REVIEWS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type CachedGoogleReview = {
  author: string;
  initial: string;
  rating: number;
  text: string;
  relativeTime: string;
  profilePhoto: string | null;
  photoUrl: string | null;
  time: number;
};

type CachedGoogleReviews = {
  source: "outscraper" | "google" | "mock" | "empty";
  placeId: string | null;
  rating: number;
  totalRatings: number;
  reviews: CachedGoogleReview[];
  fetchedAt: string;
  expiresAt: string;
};

function emptyGoogleReviewsPayload(placeId: string | null): CachedGoogleReviews {
  const now = Date.now();
  return {
    source: placeId ? "mock" : "empty",
    placeId,
    rating: 0,
    totalRatings: 0,
    reviews: [],
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + GOOGLE_REVIEWS_TTL_MS).toISOString(),
  };
}

async function fetchFromGooglePlaces(placeId: string): Promise<CachedGoogleReviews | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey || !placeId) return null;
  try {
    // `reviews.photos` requests the photos attached to each individual review
    // (instead of the place's general photo gallery), so we can show the
    // reviewer's own photo on each card.
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews,photos",
      },
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.log(`Google Places (New) fetch failed: HTTP ${res.status}`, errBody);
      return null;
    }
    const json: any = await res.json();
    if (json.error) {
      console.log(`Google Places (New) API error:`, json.error.message || json.error);
      return null;
    }

    const resolvePhotoUrl = async (photoName: string): Promise<string | null> => {
      try {
        const photoApiUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${apiKey}`;
        const photoRes = await fetch(photoApiUrl, { redirect: "follow" });
        if (photoRes.ok || photoRes.url) return photoRes.url || photoApiUrl;
      } catch {
        // ignore
      }
      return null;
    };

    const rawReviews: any[] = json.reviews || [];

    // The Places API (New) does not surface photos attached to individual
    // reviews via the `reviews.photos` field mask — it consistently returns
    // empty. As a fallback, we match each review against the place's general
    // photo gallery by uploader name: each `Photo` in `json.photos` carries
    // `authorAttributions[].displayName`, so when a reviewer also uploaded
    // their own photo to the firm's gallery, we can pair them by name.
    //
    // Reviewers whose photo is in the gallery → real reviewer photo.
    // Reviewers without a matching upload → no image (better than wrong one).
    const placePhotos: { name: string; authors: string[] }[] = (json.photos || [])
      .map((p: any) => ({
        name: p?.name as string,
        authors: (p?.authorAttributions || [])
          .map((a: any) => (a?.displayName || "").trim().toLowerCase())
          .filter(Boolean) as string[],
      }))
      .filter((p: any) => p.name);

    const reviewPhotoUrls: (string | null)[] = await Promise.all(
      rawReviews.map(async (rv: any) => {
        const reviewer = (rv?.authorAttribution?.displayName || "").trim().toLowerCase();
        if (!reviewer) return null;
        const match = placePhotos.find((p) => p.authors.includes(reviewer));
        if (!match) return null;
        return await resolvePhotoUrl(match.name);
      }),
    );

    const now = Date.now();
    return {
      source: "google",
      placeId,
      rating: typeof json.rating === "number" ? json.rating : 0,
      totalRatings: typeof json.userRatingCount === "number" ? json.userRatingCount : 0,
      reviews: rawReviews.map((rv: any, idx: number): CachedGoogleReview => {
        const authorName = rv.authorAttribution?.displayName || "Anonymous";
        const reviewText = rv.text?.text || rv.originalText?.text || "";
        const publishTime = rv.publishTime ? new Date(rv.publishTime).getTime() / 1000 : 0;
        return {
          author: authorName,
          initial: (authorName.trim().charAt(0) || "?").toUpperCase(),
          rating: typeof rv.rating === "number" ? rv.rating : 5,
          text: reviewText,
          relativeTime: rv.relativePublishTimeDescription || "",
          profilePhoto: rv.authorAttribution?.photoUri || null,
          photoUrl: reviewPhotoUrls[idx] || null,
          time: Math.floor(publishTime),
        };
      }),
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + GOOGLE_REVIEWS_TTL_MS).toISOString(),
    };
  } catch (e) {
    console.log("Google Places fetch error:", e);
    return null;
  }
}

// Best-effort extract a Google Maps identifier suitable for Outscraper's
// `query` param. Returns one of (in order of preference):
//   1. A ChIJ Place ID (cleanest; we store it as `googlePlaceId`)
//   2. A numeric CID derived from the legacy hex FID (`!1s0x..:0x..`)
//   3. The resolved final Maps URL (Outscraper also accepts URLs)
// Handles short links (maps.app.goo.gl) by following one redirect and also
// scans the response body. Returns null only if nothing usable was found.
async function extractPlaceIdFromMapsUrl(input: string): Promise<string | null> {
  const raw = (input || "").trim();
  if (!raw) return null;
  if (/^ChIJ[A-Za-z0-9_-]+$/.test(raw)) return raw;

  const tryExtract = (s: string): string | null => {
    const direct = s.match(/place_id[=:]([A-Za-z0-9_-]+)/i) || s.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (direct) return direct[1];
    // Legacy hex FID: !1s0x...:0x<hex>  — convert second half to decimal CID
    const fid = s.match(/!1s0x[a-f0-9]+:0x([a-f0-9]+)/i);
    if (fid) {
      try { return BigInt("0x" + fid[1]).toString(10); } catch { /* fall through */ }
    }
    return null;
  };

  const inline = tryExtract(raw);
  if (inline) return inline;

  try {
    const res = await fetch(raw, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
    const finalUrl = res.url || raw;
    const fromUrl = tryExtract(finalUrl);
    if (fromUrl) return fromUrl;
    const text = await res.text().catch(() => "");
    const fromBody = tryExtract(text) ||
      (text.match(/"(ChIJ[A-Za-z0-9_-]{10,})"/) || [])[1] ||
      null;
    if (fromBody) return fromBody;
    // Last resort: hand the resolved URL to Outscraper directly
    if (finalUrl && /\/maps\//i.test(finalUrl)) return finalUrl;
  } catch (e) {
    console.log("extractPlaceIdFromMapsUrl follow-redirect failed:", e);
  }
  return null;
}

// Outscraper Google Maps Reviews v3 — preferred source.
// Returns far more reviews than Places (which caps at 5) and uses simple
// X-API-KEY auth. Sync mode (`async=false`) returns the data inline so we
// don't need to manage request IDs / webhooks.
async function fetchFromOutscraper(placeId: string): Promise<CachedGoogleReviews | null> {
  const apiKey = Deno.env.get("OUTSCRAPER_API_KEY");
  if (!apiKey || !placeId) return null;
  try {
    const params = new URLSearchParams({
      query: placeId,
      reviewsLimit: "20",
      reviewsSort: "newest",
      language: "en",
      async: "false",
    });
    const url = `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`;
    const res = await fetch(url, {
      headers: { "X-API-KEY": apiKey },
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.log(`Outscraper fetch failed: HTTP ${res.status}`, errBody);
      return null;
    }
    const json: any = await res.json();
    if (json?.status && json.status !== "Success") {
      console.log(`Outscraper API status:`, json.status, json?.error);
      return null;
    }
    // Outscraper Reviews v3 returns `data[0]` as the place object directly
    // (flat) for single-query requests. Some other endpoints / multi-query
    // responses use a nested `data[0][0]` shape, so we handle both.
    const flat = json?.data?.[0];
    const place: any = flat && typeof flat === "object" && !Array.isArray(flat)
      ? flat
      : (Array.isArray(flat) ? flat[0] : null);
    if (!place) return null;

    const rawReviews: any[] = Array.isArray(place.reviews_data) ? place.reviews_data : [];
    const now = Date.now();

    const formatRelative = (ts: number): string => {
      if (!ts || !Number.isFinite(ts)) return "";
      const diffSec = ts - now / 1000;
      const absDays = Math.abs(diffSec) / 86400;
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      if (absDays < 7) return rtf.format(Math.round(diffSec / 86400), "day");
      if (absDays < 30) return rtf.format(Math.round(diffSec / (86400 * 7)), "week");
      if (absDays < 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
      return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
    };

    return {
      source: "outscraper",
      placeId,
      rating: typeof place.rating === "number" ? place.rating : 0,
      totalRatings: typeof place.reviews === "number" ? place.reviews : 0,
      reviews: rawReviews.map((rv: any): CachedGoogleReview => {
        const authorName: string = rv.author_title || "Anonymous";
        const ts: number = typeof rv.review_timestamp === "number" ? rv.review_timestamp : 0;
        // Outscraper exposes review photos under `review_img_urls` (array) and
        // a single `review_img_url`. Some legacy responses also use
        // `review_photos`. Try them all so we always pick up the first photo.
        const photoArr: any[] = Array.isArray(rv.review_img_urls)
          ? rv.review_img_urls
          : Array.isArray(rv.review_photos)
            ? rv.review_photos
            : [];
        const firstPhoto: string | null =
          (typeof photoArr[0] === "string" ? photoArr[0] : null) ||
          (typeof rv.review_img_url === "string" ? rv.review_img_url : null);
        return {
          author: authorName,
          initial: (authorName.trim().charAt(0) || "?").toUpperCase(),
          rating: typeof rv.review_rating === "number" ? rv.review_rating : 5,
          text: rv.review_text || "",
          relativeTime: formatRelative(ts),
          profilePhoto: rv.author_image || null,
          photoUrl: firstPhoto,
          time: ts,
        };
      }),
      fetchedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + GOOGLE_REVIEWS_TTL_MS).toISOString(),
    };
  } catch (e) {
    console.log("Outscraper fetch error:", e);
    return null;
  }
}

async function getOrRefreshGoogleReviews(
  slug: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<CachedGoogleReviews> {
  const cacheKey = `google-reviews:${slug}`;

  if (!opts.forceRefresh) {
    const cached = (await kv.get(cacheKey)) as CachedGoogleReviews | null;
    if (cached && cached.expiresAt && new Date(cached.expiresAt).getTime() > Date.now()) {
      return cached;
    }
  }

  // Cache stale or missing — try Google API
  // Read googlePlaceId from the designers table (not KV), with a KV fallback
  // for non-designer slugs (e.g. marketing pages seeded via /seed endpoint).
  const supabaseForProfile = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: designerRow } = await supabaseForProfile.from("designers").select("data").eq("slug", slug).maybeSingle();
  let placeId: string | null = designerRow?.data?.googlePlaceId || null;
  if (!placeId) {
    const kvPlaceId = (await kv.get(`google-reviews-placeid:${slug}`)) as string | null;
    if (kvPlaceId) placeId = kvPlaceId;
  }

  let fresh: CachedGoogleReviews | null = null;
  if (placeId) {
    // Prefer Outscraper (more reviews, simpler auth). Fall back to Google
    // Places if Outscraper isn't configured or fails to return data.
    fresh = await fetchFromOutscraper(placeId);
    if (!fresh) fresh = await fetchFromGooglePlaces(placeId);
  }

  if (!fresh) {
    // No API key, no place id, or fetch failed — serve a placeholder so the UI
    // can still render. Reuse the previous cache shape if we have one so we
    // don't lose old reviews when the API is temporarily down.
    const cached = (await kv.get(cacheKey)) as CachedGoogleReviews | null;
    if (cached && Array.isArray(cached.reviews) && cached.reviews.length > 0) {
      const now = Date.now();
      fresh = {
        ...cached,
        fetchedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + GOOGLE_REVIEWS_TTL_MS).toISOString(),
      };
    } else {
      fresh = emptyGoogleReviewsPayload(placeId);
    }
  }

  await kv.set(cacheKey, fresh);
  return fresh;
}

// POST resolve a Google Maps URL to a Place ID
// Accepts a Google Maps link and returns the Place ID using text search
app.post("/make-server-4808de5e/google-reviews/resolve-url", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) return c.json({ error: "Google API not configured" }, 500);

    const body = await c.req.json();
    const url: string = (body.url || "").trim();
    if (!url) return c.json({ error: "Missing url" }, 400);

    // Helper: given a Place ID, fetch full details (name, location, address) and return
    const fetchPlaceDetails = async (placeId: string) => {
      const detailRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          "X-Goog-Api-Key": apiKey!,
          "X-Goog-FieldMask": "displayName,location,formattedAddress,shortFormattedAddress",
        },
      });
      if (!detailRes.ok) return { name: null, lat: null, lng: null, address: null };
      const d: any = await detailRes.json();
      return {
        name: d.displayName?.text || null,
        lat: d.location?.latitude || null,
        lng: d.location?.longitude || null,
        address: d.shortFormattedAddress || d.formattedAddress || null,
      };
    };

    // Strategy 1: Extract Place ID directly from URL if present (e.g. place_id=ChIJ... or /place/.../@...!...1sChIJ...)
    const directMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/i) || url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
    if (directMatch) {
      const details = await fetchPlaceDetails(directMatch[1]);
      return c.json({ placeId: directMatch[1], ...details });
    }

    // Strategy 2: Follow the URL to get the final resolved URL, then try to extract a Place ID or business name
    let finalUrl = url;
    try {
      const headRes = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "Mozilla/5.0" } });
      finalUrl = headRes.url || url;
      // Check if the final URL has a place ID
      const resolvedMatch = finalUrl.match(/place_id[=:]([A-Za-z0-9_-]+)/i) || finalUrl.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (resolvedMatch) {
        const details = await fetchPlaceDetails(resolvedMatch[1]);
        return c.json({ placeId: resolvedMatch[1], ...details });
      }
    } catch {
      // URL follow failed — continue to text search
    }

    // Strategy 3: Extract the business name from the URL and use Text Search to find the Place ID
    // Typical formats:
    //   /maps/place/Business+Name/...
    //   /maps?q=Business+Name
    //   /maps/search/Business+Name
    let searchQuery = "";
    const placeNameMatch = finalUrl.match(/\/place\/([^/@]+)/);
    if (placeNameMatch) {
      searchQuery = decodeURIComponent(placeNameMatch[1].replace(/\+/g, " "));
    }
    if (!searchQuery) {
      const qMatch = finalUrl.match(/[?&]q=([^&]+)/);
      if (qMatch) searchQuery = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
    }
    if (!searchQuery) {
      const searchMatch = finalUrl.match(/\/search\/([^/@]+)/);
      if (searchMatch) searchQuery = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
    }
    // Also try the CID (customer ID) from the URL for direct lookup
    const cidMatch = finalUrl.match(/cid[=:](\d+)/i) || url.match(/cid[=:](\d+)/i);

    if (!searchQuery && !cidMatch) {
      return c.json({ error: "Could not extract a business name from this link. Please try a different Google Maps URL." }, 400);
    }

    // Use Places API (New) Text Search to find the place
    const textSearchUrl = "https://places.googleapis.com/v1/places:searchText";
    const searchRes = await fetch(textSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.shortFormattedAddress",
      },
      body: JSON.stringify({ textQuery: searchQuery || `cid:${cidMatch![1]}` }),
    });

    if (!searchRes.ok) {
      console.log("Text search failed:", await searchRes.text());
      return c.json({ error: "Failed to search Google Places" }, 500);
    }

    const searchData: any = await searchRes.json();
    const firstPlace = searchData.places?.[0];
    if (!firstPlace?.id) {
      return c.json({ error: `No Google Places results found for "${searchQuery}". Try searching for your exact business name on Google Maps and pasting that link.` }, 404);
    }

    return c.json({
      placeId: firstPlace.id,
      name: firstPlace.displayName?.text || null,
      lat: firstPlace.location?.latitude || null,
      lng: firstPlace.location?.longitude || null,
      address: firstPlace.shortFormattedAddress || firstPlace.formattedAddress || null,
    });
  } catch (err) {
    console.log("Error in POST /google-reviews/resolve-url:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST seed a Google Reviews slug that is NOT backed by a designer row
// (e.g. marketing pages like /get-matched). Accepts either { placeId } directly
// or { url } to resolve. Stores the placeId under `google-reviews-placeid:${slug}`
// and force-refreshes the `google-reviews:${slug}` cache.
app.post("/make-server-4808de5e/google-reviews/:slug/seed", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);

    const body = await c.req.json().catch(() => ({}));
    let placeId: string | null = (body.placeId || "").trim() || null;

    if (!placeId && body.url) {
      placeId = await extractPlaceIdFromMapsUrl(String(body.url));
    }

    if (!placeId) return c.json({ error: "Provide a placeId or a resolvable url" }, 400);

    await kv.set(`google-reviews-placeid:${slug}`, placeId);
    const data = await getOrRefreshGoogleReviews(slug, { forceRefresh: true });
    console.log(`Seeded google-reviews for slug=${slug} placeId=${placeId} source=${data.source} count=${data.reviews.length}`);
    return c.json({ success: true, slug, placeId, data });
  } catch (err) {
    console.log("Error in POST /google-reviews/:slug/seed:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Also include non-designer slugs in cron refresh so seeded slugs stay fresh
// (cron-refresh-all reads designers table; seeded placeIds live in KV)

// GET cached Google reviews for a designer (cache-only — NEVER calls Google API)
// Google API calls only happen via cron-refresh-all or manual refresh endpoints.
app.get("/make-server-4808de5e/google-reviews/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);

    // Read from KV cache only — serve stale data if expired, empty if missing
    const cached = (await kv.get(`google-reviews:${slug}`)) as CachedGoogleReviews | null;
    if (cached) {
      const isStale = cached.expiresAt && new Date(cached.expiresAt).getTime() < Date.now();
      return c.json({ data: cached, stale: !!isStale });
    }

    // No cache at all — read googlePlaceId from designers table (or KV fallback), return empty payload (cron will populate it)
    const supabaseForProfile = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: designerRow } = await supabaseForProfile.from("designers").select("data").eq("slug", slug).maybeSingle();
    let placeId: string | null = designerRow?.data?.googlePlaceId || null;
    if (!placeId) {
      const kvPlaceId = (await kv.get(`google-reviews-placeid:${slug}`)) as string | null;
      if (kvPlaceId) placeId = kvPlaceId;
    }
    return c.json({ data: emptyGoogleReviewsPayload(placeId), stale: true });
  } catch (err) {
    console.log("Error in GET /google-reviews/:slug:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST force-refresh a single designer's Google reviews
app.post("/make-server-4808de5e/google-reviews/:slug/refresh", async (c) => {
  try {
    const cronSecret = c.req.header("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    const isCron = !!(cronSecret && expected && cronSecret === expected);
    if (!isCron && !(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);
    const data = await getOrRefreshGoogleReviews(slug, { forceRefresh: true });
    console.log(`Google reviews refreshed for ${slug} (source=${data.source}, count=${data.reviews.length})`);
    return c.json({ success: true, data });
  } catch (err) {
    console.log("Error in POST /google-reviews/:slug/refresh:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST refresh ALL designers — wire to a monthly cron
//   curl -X POST -H "x-cron-secret: $CRON_SECRET" \
//     https://<project>.supabase.co/functions/v1/make-server-4808de5e/google-reviews/cron-refresh-all
app.post("/make-server-4808de5e/google-reviews/cron-refresh-all", async (c) => {
  try {
    const cronSecret = c.req.header("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    const isCron = !!(cronSecret && expected && cronSecret === expected);
    if (!isCron && !(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Query the designers table for all designers with a googlePlaceId
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("designers")
      .select("slug, data");

    if (error) {
      console.log("cron-refresh-all: failed to list designers:", error);
      return c.json({ error: "Failed to list designers" }, 500);
    }

    // Only refresh designers that have a googlePlaceId set
    const designerSlugs: string[] = (data || [])
      .filter((d: any) => d.data?.googlePlaceId)
      .map((d: any) => d.slug)
      .filter((s: any): s is string => typeof s === "string" && s.length > 0);

    // Also refresh non-designer slugs seeded via /seed (KV-only placeIds)
    const seededEntries = await kv.entriesByPrefix("google-reviews-placeid:");
    const seededSlugs: string[] = seededEntries
      .map((e) => e.key.replace(/^google-reviews-placeid:/, ""))
      .filter((s) => s.length > 0);

    const slugs: string[] = Array.from(new Set([...designerSlugs, ...seededSlugs]));

    const results: Record<string, string> = {};
    for (const slug of slugs) {
      try {
        const refreshed = await getOrRefreshGoogleReviews(slug, { forceRefresh: true });
        results[slug] = `${refreshed.source}:${refreshed.reviews.length}`;
      } catch (e) {
        results[slug] = `error: ${(e as Error).message}`;
      }
    }
    console.log(`Google reviews cron-refresh-all: refreshed ${Object.keys(results).length} designers`);
    return c.json({ success: true, count: Object.keys(results).length, results });
  } catch (err) {
    console.log("Error in POST /google-reviews/cron-refresh-all:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST create/update designer profile
app.post("/make-server-4808de5e/designers", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const designerOwner = await getUserFromRequest(c);
    if (!designerOwner) {
      return c.json({ error: "Authentication required" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const body = await c.req.json();
    const { slug, profile, team, projects, caseStudies, reviews, latestReviews, serviceArea, businessInfo } = body;

    if (!slug || !profile) {
      return c.json({ error: "slug and profile are required" }, 400);
    }

    const cleanSlug = sanitizeString(slug, 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanSlug) {
      return c.json({ error: "Invalid slug format" }, 400);
    }

    // IDOR protection: if designer already exists, only the owner can update
    const existingDesigner = await getDesignerProfile(cleanSlug);
    if (existingDesigner && existingDesigner.ownerId && existingDesigner.ownerId !== designerOwner.id) {
      return c.json({ error: "Designer not found" }, 404);
    }

    const profileData = { ...profile, slug: cleanSlug, ownerId: existingDesigner?.ownerId || designerOwner.id, updatedAt: new Date().toISOString() };
    await saveDesignerProfile(cleanSlug, profileData);

    const sectionWrites: Promise<void>[] = [];
    if (team) sectionWrites.push(saveDesignerSection(cleanSlug, "team", team));
    if (projects) sectionWrites.push(saveDesignerSection(cleanSlug, "projects", projects));
    if (caseStudies) sectionWrites.push(saveDesignerSection(cleanSlug, "casestudies", caseStudies));
    if (reviews) sectionWrites.push(saveDesignerSection(cleanSlug, "reviews", reviews));
    if (latestReviews) sectionWrites.push(saveDesignerSection(cleanSlug, "latestreviews", latestReviews));
    if (serviceArea) sectionWrites.push(saveDesignerSection(cleanSlug, "servicearea", serviceArea));
    if (businessInfo) sectionWrites.push(saveDesignerSection(cleanSlug, "businessinfo", businessInfo));
    await Promise.all(sectionWrites);

    console.log(`Designer profile saved: ${cleanSlug} (${1 + sectionWrites.length} writes)`);

    // Seed Google reviews cache if designer has a googlePlaceId and no cache exists yet
    if (profile.googlePlaceId) {
      const existingCache = await kv.get(`google-reviews:${cleanSlug}`);
      if (!existingCache) {
        try {
          await getOrRefreshGoogleReviews(cleanSlug, { forceRefresh: true });
          console.log(`Seeded Google reviews cache for new designer: ${cleanSlug}`);
        } catch (seedErr) {
          console.log(`Failed to seed Google reviews for ${cleanSlug}:`, seedErr);
        }
      }
    }

    return c.json({ success: true, slug: cleanSlug, keysWritten: keys.length });
  } catch (err) {
    console.log("Unexpected error in POST /designers:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PUT update specific sub-data for a designer
app.put("/make-server-4808de5e/designers/:slug/:section", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    const section = c.req.param("section");
    const allowedSections = ["profile", "team", "projects", "casestudies", "reviews", "latestreviews", "servicearea", "businessinfo"];

    if (!slug || !allowedSections.includes(section)) {
      return c.json({ error: "Invalid slug or section" }, 400);
    }

    const existing = await getDesignerProfile(slug);
    if (!existing) {
      return c.json({ error: "Designer not found" }, 404);
    }

    // IDOR protection: verify the requesting user owns this designer profile
    // Allow access via: (1) admin ownerId match, or (2) valid designer session for this slug
    let authorized = false;
    const designerPutUser = await getUserFromRequest(c);
    if (designerPutUser && (!existing.ownerId || designerPutUser.id === existing.ownerId)) {
      authorized = true;
    }
    // Also allow designer session token auth
    if (!authorized) {
      const designerToken = c.req.header("X-Designer-Token");
      if (designerToken) {
        const session = await kv.get(`designer-session:${designerToken}`);
        if (isAuthorizedForSlug(session, slug)) {
          authorized = true;
        }
      }
    }
    if (!authorized) {
      return c.json({ error: "Designer not found" }, 404);
    }

    const body = await c.req.json();

    if (section === "profile") {
      const mergedProfile = { ...existing, ...body.data, slug, updatedAt: new Date().toISOString() };
      await saveDesignerProfile(slug, mergedProfile);
    } else {
      await saveDesignerSection(slug, section, body.data);
    }

    console.log(`Updated designer ${slug} section: ${section}`);
    return c.json({ success: true, slug, section });
  } catch (err) {
    console.log("Unexpected error in PUT /designers/:slug/:section:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE designer profile (all keys)
app.delete("/make-server-4808de5e/designers/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) {
      return c.json({ error: "Invalid slug" }, 400);
    }

    const existing = await getDesignerProfile(slug);
    if (!existing) {
      return c.json({ error: "Designer not found" }, 404);
    }

    // IDOR protection: verify the requesting user owns this designer profile.
    // Admin users (with isAdmin flag) bypass ownership checks so they can
    // archive imported / orphaned records that have no ownerId set anyway.
    const designerDelUser = await getUserFromRequest(c);
    let isAdminCaller = false;
    let adminEmail = "";
    if (designerDelUser) {
      try {
        const adminFlag = await fp3dDb.getAdmin(designerDelUser.id);
        isAdminCaller = !!(adminFlag && adminFlag.isAdmin === true);
        adminEmail = (designerDelUser as any).email || "";
      } catch {}
    }
    if (existing.ownerId && !isAdminCaller && (!designerDelUser || designerDelUser.id !== existing.ownerId)) {
      return c.json({ error: "Designer not found" }, 404);
    }

    // Soft-delete: stamp the row with deletedAt so it's hidden from the
    // active list but recoverable via /admin/deleted-designers/:slug/restore.
    // Hard-delete still happens via the dedicated /admin/deleted-designers/:slug
    // endpoint, which is gated to a smaller email allowlist.
    const sb = getDesignerSupabase();
    const newData = {
      ...existing,
      deletedAt: new Date().toISOString(),
      deletedBy: adminEmail || designerDelUser?.id || "admin",
    };
    delete (newData as any).slug; // slug is the table column, not part of the data blob
    await sb.from("designers").update({ data: newData, updated_at: new Date().toISOString() }).eq("slug", slug);
    console.log(`Soft-deleted designer profile: ${slug}`);
    return c.json({ success: true, slug, softDeleted: true });
  } catch (err) {
    console.log("Unexpected error in DELETE /designers/:slug:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// SEED DESIGNER DATA (one-time setup)
// =============================================
app.post("/make-server-4808de5e/seed-designer", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests" }, 429);
    }

    const slug = "sora-studios";

    // Check if already seeded
    const existing = await getDesignerProfile(slug);
    if (existing) {
      return c.json({ message: "Designer already seeded", slug });
    }

    // ── PROFILE ──
    const profile = {
      slug,
      name: "Sora Studios",
      verified: true,
      tagline: "Crafting bespoke interiors for HDBs & Condos since 2014. Modern, Japandi, and Minimalist specialists. HDB Registered.",
      availability: "Available for Q3 2026",
      location: "Singapore Based",
      bio: "Full home renovation specialists for HDB, Condo & Landed properties in Singapore. Modern, Japandi & Minimalist styles. Budgets from $30K \u2013 $120K.",
      founder: "Marcus Tan",
      foundedYear: 2014,
      totalProjects: 300,
      coverProject: {
        name: "Serangoon Terrace",
        cost: "$128,500",
        area: "145m\u00B2",
        year: "2024",
        style: "Modern Contemporary Luxe",
      },
      stats: {
        rating: "4.9",
        reviewCount: "186",
        years: "12",
        hdbCert: true,
        bcaLicensed: true,
      },
      trustedSince: {
        title: "Trusted Since 2014",
        description: "Founded by Marcus Tan, Sora Studios has transformed over 300+ homes across Singapore. We believe in transparent pricing and timelines you can trust. No hidden costs, just honest design work.",
        badges: ["100% Deposit Guarantee", "On-Time Completion", "Award Winning Design"],
        certifications: [
          { name: "HDB Registered Contractor", license: "Lic. HB-09-4421A", since: "2014" },
          { name: "BCA Licensed Builder", license: "Lic. HB-09-4421A", since: "2015" },
        ],
      },
      btoPackage: {
        title: "All-Inclusive BTO Packages",
        startingPrice: "$28,888",
        description: "Starting from $28,888 for 3-Room BTO. Includes masonry, plumbing, electrical & carpentry.",
        tags: ["0% Interest Installments", "No Hidden Costs"],
      },
      images: {
        cover: "figma:asset/e4acf7c6e5d5f1811aa7429b53350cf1b67c5f4e.png",
        logo: "figma:asset/aa188101b5fbbac719eb441e4b9accb610458b0c.png",
        hdbCert: "figma:asset/353919418b571292ef4b918498a0af1081842bf9.png",
        bcaCert: "figma:asset/e75107ea0a4bae3c90b327e26766d1616f06a552.png",
        video: "figma:asset/cc50b8df382d8beabfb66e5f78006760af98950e.png",
        google: "figma:asset/9d8e189b03a63d29ac5b3a7d20746b2e0a65c2ed.png",
        map: "figma:asset/d920b76cda9183f0e3d76af83d25ee01ebb6afb9.png",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ── TEAM ──
    const teamData = [
      { name: "Chloe", type: "person", role: "Lead Designer", specialty: "Modern Minimalist", projects: 48, experience: "6 years", bio: "Specialises in clean modern aesthetics with functional space planning for HDB & condo units.", image: "figma:asset/026b3e78c31a76fc3722139c09208c6cc7d88bef.png", designs: [{ img: "https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaW50ZXJpb3IlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3MzI3MDkzMnww&ixlib=rb-4.1.0&q=80&w=1080", label: "HDB 4-Room Living" }, { img: "https://images.unsplash.com/photo-1714307302586-ad71c859d3ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaW5pbmclMjByb29tJTIwaW50ZXJpb3IlMjB3aGl0ZXxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Condo Dining" }] },
      { name: "Aisyah", type: "person", role: "Senior Designer", specialty: "Japandi & Scandinavian", projects: 35, experience: "5 years", bio: "Expert in blending Japanese and Scandinavian design for warm, cosy living spaces.", image: "figma:asset/cea54ef0f554c631157697f929f8165a7aa20f93.png", designs: [{ img: "https://images.unsplash.com/photo-1718636268253-d6ad2a0aeee9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmRpJTIwc2NhbmRpbmF2aWFuJTIwYmVkcm9vbSUyMGRlc2lnbnxlbnwxfHx8fDE3NzMyNzA5MzN8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Japandi Bedroom" }, { img: "https://images.unsplash.com/photo-1753117034598-b7cb94f80d76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJtJTIwd29vZCUyMGludGVyaW9yJTIwYmF0aHJvb20lMjBzcGF8ZW58MXx8fHwxNzczMjcwOTM1fDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Warm Wood Bath" }] },
      { name: "Ethan", type: "person", role: "Design Consultant", specialty: "Contemporary Luxe", projects: 52, experience: "7 years", bio: "Creates luxurious yet liveable interiors with premium material selections and bespoke carpentry.", image: "figma:asset/764080aebb8990bae415c1d32da309e78b076802.png", designs: [{ img: "https://images.unsplash.com/photo-1643034738686-d69e7bc047e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb250ZW1wb3JhcnklMjBraXRjaGVuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzczMjQ5NTMwfDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Luxury Kitchen" }, { img: "https://images.unsplash.com/photo-1572742482459-e04d6cfdd6f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtYXJibGUlMjBiYXRocm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3MzI3MDkzNnww&ixlib=rb-4.1.0&q=80&w=1080", label: "Marble Bathroom" }] },
      { name: "Arjun", type: "person", role: "Project Manager", specialty: "Landed Properties", projects: 29, experience: "4 years", bio: "Manages end-to-end renovation projects with a focus on landed and multi-storey homes.", image: "figma:asset/f13abbb8a968f0d63754415ad9d7f0e5a067d7a9.png", designs: [{ img: "https://images.unsplash.com/photo-1632214533040-eb166a3b172d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kZWQlMjBwcm9wZXJ0eSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Terrace Renovation" }, { img: "https://images.unsplash.com/photo-1765766599489-fd53df7f8724?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbnRyeXdheSUyMGhhbGx3YXklMjBkZXNpZ258ZW58MXx8fHwxNzczMjcwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Grand Entryway" }] },
      { name: "Raj", type: "person", role: "3D Visualiser", specialty: "Photorealistic Renders", projects: 60, experience: "5 years", bio: "Brings designs to life with stunning photorealistic 3D renders before renovation begins.", image: "figma:asset/772d5ab73165b6c6919706089e98ec03e7c8d086.png", designs: [{ img: "https://images.unsplash.com/photo-1642755622834-87749d4581f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMHJlbmRlciUyMGludGVyaW9yJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "3D Living Render" }, { img: "https://images.unsplash.com/photo-1608682285597-156feb50eb4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwaG9tZSUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzMyNzA5MzV8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Office Visualisation" }] },
      { name: "Priya", type: "person", role: "Junior Designer", specialty: "BTO Packages", projects: 18, experience: "2 years", bio: "Passionate about creating beautiful starter homes with smart budget-friendly solutions.", image: "figma:asset/a3218feba2b82b2fde4d5ba04b711e31e28c2bba.png", designs: [{ img: "https://images.unsplash.com/photo-1745429523615-2a82c60bfc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGFwYXJ0bWVudCUyMGNvenklMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "BTO 3-Room Cosy" }, { img: "https://images.unsplash.com/photo-1608682285597-156feb50eb4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwaG9tZSUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzMyNzA5MzV8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Starter Home Living" }] },
      { name: "Jurong", type: "project", image: "figma:asset/de1f917c8bf2b7a9d1ce0dd9b4cb7ea763a941c2.png", reels: [{ img: "https://images.unsplash.com/photo-1631152695193-61c709e578f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIREIlMjBmbGF0JTIwcmVub3ZhdGlvbiUyMHNpbmdhcG9yZSUyMG1vZGVybnxlbnwxfHx8fDE3NzMyNzEzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "HDB 5-Room BTO \u2014 Modern Minimalist", location: "Jurong West St 91", likes: 324, comments: 18 }, { img: "https://images.unsplash.com/photo-1761123393191-3a8733313ff5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd2hpdGUlMjBraXRjaGVuJTIwcmVub3ZhdGlvbnxlbnwxfHx8fDE3NzMyNzEzMDF8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Kitchen Overhaul \u2014 Scandinavian White", location: "Jurong East Ave 1", likes: 287, comments: 12 }, { img: "https://images.unsplash.com/photo-1768413292551-10011d6c354e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXRocm9vbSUyMHJlbm92YXRpb24lMjB0aWxlc3xlbnwxfHx8fDE3NzMyNzEzMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Spa-Inspired Bathroom Renovation", location: "Jurong West St 65", likes: 198, comments: 9 }, { img: "https://images.unsplash.com/photo-1758548157747-285c7012db5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwY29uY2VwdCUyMGFwYXJ0bWVudCUyMHJlbm92YXRpb258ZW58MXx8fHwxNzczMjcxMzAyfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Open Concept Living \u2014 Before & After", location: "Taman Jurong", likes: 412, comments: 27 }] },
      { name: "Woodlands", type: "project", image: "figma:asset/ffd9ddd9c56ad6f3d25ba20494e45bfec9148e73.png", reels: [{ img: "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25kbyUyMGxpdmluZyUyMHJvb20lMjBicmlnaHR8ZW58MXx8fHwxNzczMjcxMzAxfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Bright Condo Living Room Makeover", location: "Woodlands Crescent", likes: 356, comments: 21 }, { img: "https://images.unsplash.com/photo-1773101883552-1ea68c7b471b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMGludGVyaW9yJTIwd2FybSUyMGxpZ2h0aW5nfGVufDB8fHx8MTc3MzI3MTMwMnww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Cosy Master Bedroom \u2014 Warm Japandi", location: "Woodlands Ring Rd", likes: 278, comments: 15 }, { img: "https://images.unsplash.com/photo-1765810655728-c622e966c6ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMG1vZGVybiUyMGJhbGNvbnklMjBvdXRkb29yJTIwbGl2aW5nfGVufDB8fHx8MTc3MzI3MTMwM3ww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Balcony Garden Lounge Setup", location: "Admiralty Drive", likes: 189, comments: 8 }, { img: "https://images.unsplash.com/photo-1765279333918-949ddcb655ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxrJTIwaW4lMjB3YXJkcm9iZSUyMGNsb3NldCUyMGx1eHVyeXxlbnwxfHx8fDE3NzMyNzEzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Walk-In Wardrobe \u2014 Built-In Custom", location: "Woodlands Ave 6", likes: 245, comments: 14 }] },
    ];

    // ── PROJECTS ──
    const projectsData = [
      { name: "Tiong Bahru Condo", meta: "HDB \u00B7 $87,460 \u00B7 2024", image: "figma:asset/0fc1637b7695f77c9a097438445025b14c96f5ea.png" },
      { name: "Buona Vista Loft", meta: "HDB \u00B7 $276,540 \u00B7 2024", image: "figma:asset/bf7d0cf68bdcc66437a7818f2fc4ab1a7e5ea3c2.png" },
    ];

    // ── CASE STUDIES ──
    const caseStudiesData = [
      { phase: "PHASE I", title: "Concept & Spatial Planning", desc: "We began by refining spatial flow and aligning the layout with the client's functional requirements. Material selections were curated to establish tonal consistency and long-term durability.", tags: [{ label: "Space optimization", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "grid" }, { label: "Budget alignment", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "dollar" }, { label: "Material curation", bg: "bg-[#e9d5ff]", text: "text-[#7c3aed]", iconColor: "#7C3AED", icon: "palette" }], image: "figma:asset/236738fc0010876d79202e07c551861413d12dd6.png" },
      { phase: "PHASE II", title: "Site Preparation & Technical Alignment", desc: "Pre-construction assessments were conducted to identify structural defects and verify dimensional accuracy. All technical parameters were documented to ensure seamless contractor coordination.", tags: [{ label: "Defects inspection", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "search" }, { label: "On-site measurements", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "ruler" }, { label: "Technical verification", bg: "bg-[#dcfce7]", text: "text-[#16a34a]", iconColor: "#16A34A", icon: "check" }], image: "figma:asset/0463a32823a04486d6fd9c60bda1c48ae00b08c5.png" },
      { phase: "PHASE III", title: "Execution & Supervision", desc: "Weekly progress reviews ensured adherence to technical specifications and timeline commitments. Quality control inspections were conducted at every milestone to maintain precision.", tags: [{ label: "Progress monitoring", bg: "bg-[#dcfce7]", text: "text-[#16a34a]", iconColor: "#16A34A", icon: "chart" }, { label: "Quality control", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "shield" }, { label: "Timeline management", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "clock" }], image: "figma:asset/1180c2e58a96bb22ca91228fda602596c093082a.png" },
      { phase: "PHASE IV", title: "Final Reveal & Handover", desc: "Final detailing and finishing adjustments were completed with meticulous attention to carpentry precision and lighting calibration. The project was delivered to specification and schedule.", tags: [{ label: "Final detailing", bg: "bg-[#fce7f3]", text: "text-[#be185d]", iconColor: "#BE185D", icon: "sparkle" }, { label: "Styling & finishing", bg: "bg-[#e9d5ff]", text: "text-[#9333ea]", iconColor: "#9333EA", icon: "palette" }, { label: "Client handover", bg: "bg-[#fef3c7]", text: "text-[#ca8a04]", iconColor: "#CA8A04", icon: "key" }], image: "figma:asset/33fe462b9db17890de38439d66dfffcaad5f4c80.png" },
    ];

    // ── REVIEWS (Google Review Cards) ──
    const reviewCardsData = [
      { title: "Highly Responsive and Meticulous Designer", text: "Did a full condo renovation with Sora Studio and had a fantastic experience. Mina and Sana were incredibly responsive and attentive to every detail \u2014 from mater...", fullText: "Did a full condo renovation with Sora Studio and had a fantastic experience. Mina and Sana were incredibly responsive and attentive to every detail \u2014 from material selection to colour palettes, they guided us patiently through every decision. The 3D renders were spot-on and the final result exceeded our expectations. Communication was always prompt, and they kept us updated at every stage. Highly recommend for anyone looking for a professional yet personal touch!", name: "Emily Chen", date: "March 2024", initial: "E", bgColor: "bg-[#f55]", textColor: "text-white", image: "figma:asset/8e4350324e724a21b5e34ff048fc9e3409e5bda6.png", hasVideo: false },
      { title: "Professional, creative, and reliable", text: "From the first consultation to handover, the experience was smooth and reassuring. The designer understood our vision immediately and proposed practical solutio...", fullText: "From the first consultation to handover, the experience was smooth and reassuring. The designer understood our vision immediately and proposed practical solutions that were both aesthetic and functional. They managed the contractors efficiently and ensured quality workmanship throughout. The timeline was met with minimal delays, and the budget was respected. We especially appreciated the post-renovation follow-up to ensure everything was in order.", name: "Emily Chen", date: "March 2024", initial: "E", bgColor: "bg-[#f55]", textColor: "text-white", image: "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png", hasVideo: false },
      { title: "Thoughtful design & smooth execution", text: "We chose Sora Studio after meeting a few firms and felt most comfortable with Mina's practical yet creative design suggestions. The final result looked exactly ...", fullText: "We chose Sora Studio after meeting a few firms and felt most comfortable with Mina's practical yet creative design suggestions. The final result looked exactly like the 3D renders \u2014 modern, functional, and beautifully finished. Every corner of the home was thoughtfully designed, from hidden storage solutions to lighting placement. The team was always available to address our concerns, and we never felt rushed. A truly seamless experience from start to finish.", name: "Ryan Teo", date: "February 2024", initial: "R", bgColor: "bg-[#fc5]", textColor: "text-[#282828]", image: "figma:asset/7faf17d5deb54541e63777bc7ad7d74990b0b1dd.png", hasVideo: true },
      { title: "Efficient and caring BTO renovation", text: "Momo from Sora Studio helped me with a partial kitchen and living room revamp. She was cheerful and open to our ideas, offering great budget-friendly alternativ...", fullText: "Momo from Sora Studio helped me with a partial kitchen and living room revamp. She was cheerful and open to our ideas, offering great budget-friendly alternatives without compromising on style. The workmanship was clean and completed ahead of schedule. She even helped coordinate the delivery of our custom furniture. For a first-time homeowner, Momo made the whole renovation journey stress-free and enjoyable. Would definitely work with her again!", name: "Ryan Teo", date: "February 2024", initial: "R", bgColor: "bg-[#fc5]", textColor: "text-[#282828]", image: "figma:asset/3bf4f3e38477a9fe4019ae13c814f9abec16f515.png", hasVideo: false },
      { title: "Seamless renovation from start to finish", text: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the proces...", fullText: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the process. From demolition to the final walkthrough, every milestone was communicated clearly. The design choices were elegant yet liveable, perfectly matching our modern minimalist preference. They even handled the tricky hacking works with care and professionalism. Truly a five-star experience.", name: "Alicia Wong", date: "January 2024", initial: "A", bgColor: "bg-[#557fff]", textColor: "text-white", image: "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png", hasVideo: false },
      { title: "Seamless renovation from start to finish", text: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the proces...", fullText: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the process. From demolition to the final walkthrough, every milestone was communicated clearly. The design choices were elegant yet liveable, perfectly matching our modern minimalist preference. They even handled the tricky hacking works with care and professionalism. Truly a five-star experience.", name: "Alicia Wong", date: "January 2024", initial: "A", bgColor: "bg-[#557fff]", textColor: "text-white", image: "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png", hasVideo: false },
    ];

    // ── LATEST REVIEWS (sidebar) ──
    const latestReviewsData = [
      { name: "Alex Goh", initial: "A", time: "2 months ago", text: "\"Sora Studios managed our HDB resale renovation flawlessly. Marcus was responsive even on weekends and the carpentry quality is top notch. Highly recommended!\"" },
      { name: "Sarah Lim", initial: "S", time: "1 week ago", text: "\"Loved the Japandi design proposal. They really listened to our needs for storage. The timeline was slightly delayed but they made up for it with excellent workmanship.\"" },
      { name: "Jasmine Tan", initial: "J", time: "3 months ago", text: "\"Transparent pricing from the start. No hidden variation orders. Very happy with our new kitchen!\"" },
    ];

    // ── SERVICE AREA ──
    const serviceAreaData = {
      hqAddress: "33 Ubi Ave 3, Singapore 408868",
      hqLat: 1.3271,
      hqLng: 103.8918,
      description: "Based in Ubi, we cover all HDB estates and private properties across Singapore.",
      mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.4!2d103.8918!3d1.3271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da181f5dc73855%3A0x0!2s33+Ubi+Ave+3%2C+Singapore+408868!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg",
    };

    // ── BUSINESS INFO ──
    const businessInfoData = [
      { label: "ACRA / UEN", value: "201203456R" },
      { label: "Years in operation", value: "12 years (Est. 2012)" },
      { label: "Office address", value: "5855 W Century, Ang Mo Kio, Singapore" },
      { label: "Project types", value: "HDB, Condo, Landed, Commercial" },
      { label: "Style specialisation", value: "Modern, Japandi, Minimalist" },
      { label: "Budget range", value: "$30,000 \u2013 $120,000" },
    ];

    // ── WRITE TO SQL ──
    await saveDesignerProfile(slug, profile);
    await Promise.all([
      saveDesignerSection(slug, "team", teamData),
      saveDesignerSection(slug, "projects", projectsData),
      saveDesignerSection(slug, "casestudies", caseStudiesData),
      saveDesignerSection(slug, "reviews", reviewCardsData),
      saveDesignerSection(slug, "latestreviews", latestReviewsData),
      saveDesignerSection(slug, "servicearea", serviceAreaData),
      saveDesignerSection(slug, "businessinfo", businessInfoData),
    ]);

    console.log(`Seeded designer: ${slug} (profile + 7 sections)`);
    return c.json({ success: true, slug });
  } catch (err) {
    console.log("Unexpected error in POST /seed-designer:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Debug: list all designer keys
app.get("/make-server-4808de5e/designer-keys", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("kv_store_4808de5e")
      .select("key")
      .like("key", "designer:%");

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    const keys = data?.map((d: any) => d.key) ?? [];
    return c.json({ count: keys.length, keys });
  } catch (err) {
    console.log("Unexpected error in GET /designer-keys:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Submit cost guide request
app.post("/make-server-4808de5e/cost-guide", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { propertyType, propertyStatus, postalCode, unitType, selectedRooms, timeline, lifestyle, preferredThemes, uploadedPhotos, additionalNotes, roomScopes, contact } = body;
    const isResale = propertyStatus === "Existing" || propertyStatus === "Resale";
    console.log("Received cost guide request:", JSON.stringify(redactPII(body)));

    if (!propertyType || !unitType || !selectedRooms?.length || !timeline) {
      return c.json({ error: "Missing required property/renovation fields" }, 400);
    }
    if (!contact?.name || !contact?.whatsapp || !contact?.email) {
      return c.json({ error: "All contact fields are required" }, 400);
    }

    const cleanName = sanitizeString(contact.name, 100);
    const cleanEmail = sanitizeString(contact.email, 200).toLowerCase();
    const cleanWhatsapp = sanitizeString(contact.whatsapp, 20);

    if (!isValidEmail(cleanEmail)) {
      return c.json({ error: "Invalid email format" }, 400);
    }
    if (!isValidWhatsapp(cleanWhatsapp)) {
      return c.json({ error: "Invalid WhatsApp number (must be 8 digits)" }, 400);
    }

    const id = crypto.randomUUID();
    const payload = {
      id,
      propertyType: sanitizeString(propertyType, 50),
      propertyStatus: sanitizeString(propertyStatus || "", 20),
      postalCode: sanitizeString(postalCode || "", 10),
      isResale: Boolean(isResale),
      unitType: sanitizeString(unitType, 50),
      selectedRooms,
      timeline: sanitizeString(timeline, 50),
      lifestyle: lifestyle || {},
      preferredThemes: Array.isArray(preferredThemes) ? preferredThemes.map((t: string) => sanitizeString(t, 30)).slice(0, 2) : [],
      uploadedPhotos: Array.isArray(uploadedPhotos) ? uploadedPhotos.slice(0, 5) : [],
      additionalNotes: sanitizeString(additionalNotes || "", 1000),
      roomScopes,
      contact: { name: cleanName, whatsapp: cleanWhatsapp, email: cleanEmail },
      createdAt: new Date().toISOString(),
    };

    await kv.set(`cost-guide:${id}`, payload);
    console.log("Cost guide saved with ID:", id);

    // Also insert into Quote Request table as a lead
    try {
      const supabaseLead = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Format the estimated cost as the renovation budget
      const estimate = body.estimate;
      let budgetStr = "";
      if (estimate && typeof estimate.estMin === "number" && typeof estimate.estMax === "number") {
        const fmtK = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n.toLocaleString()}`;
        budgetStr = `${fmtK(estimate.estMin)} – ${fmtK(estimate.estMax)}`;
      }

      const qrId = crypto.randomUUID();
      const qrPayload: Record<string, any> = {
        "ID": qrId,
        "Name": cleanName,
        "Email": cleanEmail,
        "Phone Number": cleanWhatsapp,
        "Property Type": sanitizeString(propertyType, 50),
        "Key Collection Date": sanitizeString(timeline, 50),
        "Renovation Budget": budgetStr,
        "Inquiry": `Cost Guide — ${sanitizeString(unitType, 50)} (${sanitizeString(propertyStatus || "New", 20)}), Rooms: ${(selectedRooms || []).join(", ")}${Array.isArray(preferredThemes) && preferredThemes.length ? `, Themes: ${preferredThemes.join(", ")}` : ""}${postalCode ? `, Postal: ${sanitizeString(postalCode, 10)}` : ""}`,
        "Lead Form": "Network Cost Guide Lead Form",
        "Created Date": new Date().toISOString(),
        "Updated Date": new Date().toISOString(),
      };

      const { error: qrError } = await supabaseLead
        .from("Quote Request")
        .insert(qrPayload)
        .select()
        .single();

      if (qrError) {
        console.log("Quote Request insert error for cost guide lead:", JSON.stringify(qrError));
      } else {
        console.log("Cost guide lead inserted into Quote Request:", qrId);
      }

      // Store qrId in KV alongside cost-guide data so PDF endpoint can look it up
      await kv.set(`cost-guide:${id}:qrId`, qrId);
    } catch (qrErr) {
      console.log("Error inserting cost guide lead into Quote Request:", qrErr);
    }

    // Return qrId so frontend can pass it to the PDF generation endpoint
    const storedQrId = await kv.get(`cost-guide:${id}:qrId`);
    return c.json({ success: true, id, qrId: storedQrId || null });
  } catch (err) {
    console.log("Error in cost-guide submission:", err);
    return c.json({ error: `Failed to submit cost guide: ${err}` }, 500);
  }
});

// =============================================
// Generate Cost Guide PDF via CraftMyPDF
// =============================================

const PDF_PROPERTY_FACTOR: Record<string, number> = {
  HDB: 1.0, Condominium: 1.05, "Executive Condo (EC)": 1.05, Landed: 1.25,
};
const PDF_RESALE_FACTOR: Record<string, number> = {
  HDB: 1.1, Condominium: 1.08, "Executive Condo (EC)": 1.08, Landed: 1.12,
};
const PDF_SIZE_WEIGHT: Record<string, Record<string, number>> = {
  HDB: { "2-Room Flexi": 0.65, "3-Room": 0.8, "4-Room": 1.0, "5-Room": 1.2, Executive: 1.3, DBSS: 1.4 },
  Condominium: { Studio: 0.6, "1-Bedroom": 0.75, "2-Bedroom": 0.9, "3-Bedroom": 1.05, "4-Bedroom": 1.25, Penthouse: 1.25 },
  "Executive Condo (EC)": { "2-Bedroom": 0.9, "3-Bedroom": 1.05, "4-Bedroom": 1.25, "5-Bedroom": 1.25 },
  Landed: { Terrace: 1.4, "Semi-Detached": 1.6, "Detached / Bungalow": 1.8, "Good Class Bungalow": 1.8 },
};
const PDF_ROOM_PACKAGES: Record<string, Record<string, { min: number; max: number }>> = {
  "Living/Dining": { Light: { min: 1000, max: 2000 }, Moderate: { min: 3000, max: 6000 }, Extensive: { min: 7000, max: 12000 } },
  Kitchen: { Light: { min: 3000, max: 6000 }, Moderate: { min: 8000, max: 14000 }, Extensive: { min: 15000, max: 25000 } },
  Bedrooms: { Light: { min: 1000, max: 2000 }, Moderate: { min: 2500, max: 4500 }, Extensive: { min: 5000, max: 8000 } },
  Bathrooms: { Light: { min: 1500, max: 3000 }, Moderate: { min: 4000, max: 7000 }, Extensive: { min: 8000, max: 12000 } },
  Others: { Light: { min: 800, max: 1500 }, Moderate: { min: 2000, max: 3500 }, Extensive: { min: 4000, max: 6000 } },
};
const PDF_SCOPE_INCLUDES: Record<string, Record<string, string[]>> = {
  "Living/Dining": {
    Light: ["Repainting", "Small carpentry", "Simple fixtures"],
    Moderate: ["Custom carpentry", "New flooring", "Updated lighting"],
    Extensive: ["Full flooring change", "Feature wall", "Extensive carpentry"],
  },
  Kitchen: {
    Light: ["Change cabinet doors", "Small carpentry", "Basic tiling"],
    Moderate: ["New cabinetry", "Updated appliances", "Partial tiling"],
    Extensive: ["Layout changes", "New cabinetry", "Full tiling"],
  },
  Bedrooms: {
    Light: ["Paint", "Lighting", "Basic wardrobes"],
    Moderate: ["New flooring", "Custom wardrobes", "Lighting updates"],
    Extensive: ["Full carpentry fit-out", "Flooring", "Layout changes"],
  },
  Bathrooms: {
    Light: ["Replace fixtures", "Partial tiling"],
    Moderate: ["New fixtures", "Partial wall/floor tiling"],
    Extensive: ["Full tiling", "Custom vanity", "Layout changes"],
  },
  Others: {
    Light: ["Basic finishing", "Minor carpentry"],
    Moderate: ["New flooring", "Partial carpentry"],
    Extensive: ["Full custom carpentry and flooring"],
  },
};

function pdfRoundTo(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

function pdfFormatK(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return "$" + (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + "K";
  }
  return "$" + n.toLocaleString();
}

app.post("/make-server-4808de5e/cost-guide-pdf", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { propertyType, isResale, propertyStatus, unitType, selectedRooms, timeline, roomScopes, fullHomeScope, estimate, templateId, quoteRequestId, postalCode, verifiedAddress, lifestyle, preferredThemes, meetingPreference, additionalNotes, uploadedPhotos, contact } = body;
    console.log("PDF generation request received:", JSON.stringify({ propertyType, unitType, selectedRooms, templateId, quoteRequestId }));

    if (!templateId) {
      return c.json({ error: "Missing templateId for CraftMyPDF" }, 400);
    }
    // Validate templateId format — must be alphanumeric (CraftMyPDF template IDs)
    const cleanTemplateId = sanitizeKvKey(String(templateId), 100);
    if (!cleanTemplateId || cleanTemplateId !== String(templateId).trim()) {
      securityLog("invalid_template_id", "warn", ip, "/cost-guide-pdf", { templateId: String(templateId).slice(0, 50) });
      return c.json({ error: "Invalid template ID format" }, 400);
    }
    if (!propertyType || !unitType || !selectedRooms?.length) {
      return c.json({ error: "Missing required fields for PDF generation" }, 400);
    }

    const craftMyPdfKey = Deno.env.get("craft_my_pdf");
    if (!craftMyPdfKey) {
      console.log("craft_my_pdf secret not configured");
      return c.json({ error: "PDF service not configured. Missing API key." }, 500);
    }

    // Compute multipliers
    const pf = PDF_PROPERTY_FACTOR[propertyType] ?? 1;
    const isResaleUnit = propertyStatus ? (propertyStatus === "Existing" || propertyStatus === "Resale") : !!isResale;
    const rf = isResaleUnit ? (PDF_RESALE_FACTOR[propertyType] ?? 1) : 1;
    const sw = PDF_SIZE_WEIGHT[propertyType]?.[unitType] ?? 1.0;

    // Total cost range
    const estMin = estimate?.estMin ?? 0;
    const estMax = estimate?.estMax ?? 0;
    const isFloor = estimate?.isFloor ?? false;
    const numMin = isFloor ? 30 : Math.round(estMin / 1000);
    const numMax = isFloor ? 35 : Math.round(estMax / 1000);
    const renovationcost = "$" + numMin + "K - $" + numMax + "K";

    // Check full home
    const ALL_ROOMS = ["Living/Dining", "Kitchen", "Bedrooms", "Bathrooms", "Others"];
    const isFullHome = selectedRooms.length === ALL_ROOMS.length && ALL_ROOMS.every((r: string) => selectedRooms.includes(r));

    // Per-room helper
    function computeRoomPrice(room: string, level: string, count: number = 1): string {
      const pkg = PDF_ROOM_PACKAGES[room]?.[level];
      if (!pkg) return "N/A";
      const mn = pdfRoundTo(pkg.min * pf * rf * sw * count, 100);
      const mx = pdfRoundTo(pkg.max * pf * rf * sw * 1.1 * count, 100);
      return pdfFormatK(mn) + " - " + pdfFormatK(mx);
    }

    function getRoomIncludes(room: string, level: string): string {
      const items = PDF_SCOPE_INCLUDES[room]?.[level];
      return items ? items.join(", ") : "N/A";
    }

    function roomData(room: string) {
      const scope = roomScopes?.[room];
      const level = scope?.level;
      const count = scope?.count ?? 1;
      if (!level || !selectedRooms.includes(room)) {
        return { up: "-", price: "-", include: "No works done here", count: 0 };
      }
      return { up: level, price: computeRoomPrice(room, level, count), include: getRoomIncludes(room, level), count };
    }

    const lvr = roomData("Living/Dining");
    const kit = roomData("Kitchen");
    const bdr = roomData("Bedrooms");
    const bat = roomData("Bathrooms");
    const oth = roomData("Others");

    // Build payload fields
    let living_room = lvr.up, living_room_price = lvr.price, livingRoom_include = lvr.include;
    let kitchen = kit.up, kitchen_price = kit.price, kitchen_include = kit.include;
    let bedrooms = bdr.up, bedrooms_price = bdr.price, bed_room_include = bdr.include;
    let bathrooms = bat.up, bathrooms_price = bat.price, bath_room_include = bat.include;
    let other_rooms = oth.up, other_rooms_price = oth.price, other_room_include = oth.include;
    let bdr_count = bdr.count, bat_count = bat.count;

    if (isFullHome && fullHomeScope) {
      const scopeLabel = fullHomeScope.scope || "Moderate";
      const allInclude = "Full home " + scopeLabel.toLowerCase() + " package — " + (fullHomeScope.carpentry || "Medium") + " carpentry, " + (fullHomeScope.layout === "No" ? "No" : fullHomeScope.layout) + " layout changes";
      living_room = scopeLabel; kitchen = scopeLabel; bedrooms = scopeLabel; bathrooms = scopeLabel; other_rooms = scopeLabel;
      livingRoom_include = allInclude; kitchen_include = allInclude; bed_room_include = allInclude; bath_room_include = allInclude; other_room_include = allInclude;

      // Split the full-home total across rooms so every row shows its own
      // estimate instead of stuffing the total into Living/Dining and marking
      // the rest "Included". We use PDF_ROOM_PACKAGES at the chosen scope as
      // relative weights, then scale so the per-room ranges sum to estMin/estMax.
      const roomOrder: string[] = ["Living/Dining", "Kitchen", "Bedrooms", "Bathrooms", "Others"];
      const raw = roomOrder.map((r) => {
        const pkg = PDF_ROOM_PACKAGES[r]?.[scopeLabel] ?? { min: 0, max: 0 };
        return { room: r, min: pkg.min, max: pkg.max };
      });
      const rawSumMin = raw.reduce((s, x) => s + x.min, 0) || 1;
      const rawSumMax = raw.reduce((s, x) => s + x.max, 0) || 1;
      const targetMin = isFloor ? 30000 : estMin;
      const targetMax = isFloor ? 35000 : estMax;
      const scaleMin = targetMin / rawSumMin;
      const scaleMax = targetMax / rawSumMax;
      const priced: Record<string, string> = {};
      raw.forEach((x) => {
        const mn = pdfRoundTo(x.min * scaleMin, 100);
        const mx = pdfRoundTo(x.max * scaleMax, 100);
        priced[x.room] = pdfFormatK(mn) + " - " + pdfFormatK(mx);
      });
      living_room_price = priced["Living/Dining"];
      kitchen_price = priced["Kitchen"];
      bedrooms_price = priced["Bedrooms"];
      bathrooms_price = priced["Bathrooms"];
      other_rooms_price = priced["Others"];
    }

    // Lifestyle labels
    const boolLabel = (v: boolean | null | undefined) => v === true ? "Yes" : v === false ? "No" : "-";

    const pdfData = {
      renovationcost,
      date: new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }),
      contact_name: contact?.name ?? "",
      contact_phone: contact?.whatsapp ?? "",
      property_type: propertyType ?? "",
      property_status: propertyStatus || (isResaleUnit ? "Resale" : "New"),
      unit_type: unitType ?? "",
      address: verifiedAddress ?? "",
      zipcode: postalCode ?? "",
      rooms_to_renovate: Array.isArray(selectedRooms) ? (selectedRooms as string[]).join(", ") : "",
      renovation_timeline: timeline ?? "",
      preferred_themes: Array.isArray(preferredThemes) ? preferredThemes.join(", ") : (preferredThemes ?? ""),
      lifestyle_pets: boolLabel(lifestyle?.pets),
      lifestyle_children: boolLabel(lifestyle?.children),
      lifestyle_handicap: boolLabel(lifestyle?.handicap),
      lifestyle_ecoFriendly: boolLabel(lifestyle?.ecoFriendly),
      lifestyle_boldDesign: boolLabel(lifestyle?.boldDesign),
      meeting_preference: meetingPreference ?? "",
      additional_notes: additionalNotes ?? "",
      reference_photos: Array.isArray(uploadedPhotos) ? uploadedPhotos.join(", ") : "",
      living_room, living_room_price, living_room_include: livingRoom_include,
      kitchen, kitchen_price, kitchen_include,
      bedrooms, bedrooms_price, bedrooms_count: bdr_count, bed_room_include,
      bathrooms, bathrooms_price, bathrooms_count: bat_count, bath_room_include,
      other_rooms, other_rooms_price, other_room_include,
    };

    console.log("Sending to CraftMyPDF:", JSON.stringify(pdfData));

    const craftRes = await fetch("https://api.craftmypdf.com/v1/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": craftMyPdfKey,
      },
      body: JSON.stringify({
        data: pdfData,
        template_id: cleanTemplateId,
        output_file: "Network Cost Breakdown Report.pdf",
      }),
    });

    const craftResult = await craftRes.json();
    console.log("CraftMyPDF response:", JSON.stringify(craftResult));

    if (!craftRes.ok || craftResult.status !== "success") {
      console.log("CraftMyPDF API error:", JSON.stringify(craftResult));
      return c.json({ error: "PDF generation failed: " + (craftResult.message || "Unknown error") }, 500);
    }

    const pdfUrl = craftResult.file;
    if (!pdfUrl) {
      return c.json({ error: "PDF generated but no file URL returned" }, 500);
    }

    console.log("PDF generated successfully:", pdfUrl);

    // Step 2: Download the PDF from CraftMyPDF URL and upload to Supabase Storage
    let storageSignedUrl: string | null = null;
    try {
      console.log("Downloading PDF from CraftMyPDF:", pdfUrl.substring(0, 80));
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const pdfRes = await fetch(pdfUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (pdfRes.ok) {
        const pdfBuffer = new Uint8Array(await pdfRes.arrayBuffer());
        const filePath = `cost-guides/${crypto.randomUUID()}-Network-Cost-Breakdown-Report.pdf`;

        console.log(`Uploading PDF to storage: ${filePath} (${pdfBuffer.length} bytes)`);

        const supabaseStorage = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Ensure bucket exists
        const { data: buckets } = await supabaseStorage.storage.listBuckets();
        const pdfBucketName = BUCKET_NAME; // reuse existing renders bucket
        const bucketExists = buckets?.some((b: any) => b.name === pdfBucketName);
        if (!bucketExists) {
          await supabaseStorage.storage.createBucket(pdfBucketName, { public: false });
          console.log("Created storage bucket for PDFs:", pdfBucketName);
        }

        const { error: uploadErr } = await supabaseStorage.storage
          .from(pdfBucketName)
          .upload(filePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

        if (uploadErr) {
          console.log("Storage upload error for PDF:", uploadErr);
        } else {
          // Create a signed URL (valid for 10 days)
          const { data: signedData, error: signErr } = await supabaseStorage.storage
            .from(pdfBucketName)
            .createSignedUrl(filePath, 10 * 24 * 3600);

          if (signErr || !signedData?.signedUrl) {
            console.log("Signed URL error for PDF:", signErr);
          } else {
            storageSignedUrl = signedData.signedUrl;
            console.log("PDF uploaded to storage, signed URL created");
          }
        }
      } else {
        console.log("Failed to download PDF from CraftMyPDF:", pdfRes.status, pdfRes.statusText);
      }
    } catch (dlErr: any) {
      if (dlErr.name === "AbortError") {
        console.log("PDF download from CraftMyPDF timed out");
      } else {
        console.log("Error downloading/uploading PDF:", dlErr);
      }
    }

    // Step 3: Update the Quote Request row with the PDF URL in "3D Render Image" column
    if (quoteRequestId && storageSignedUrl) {
      try {
        const supabaseUpdate = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { error: updateErr } = await supabaseUpdate
          .from("Quote Request")
          .update({
            "3D Render Image": storageSignedUrl,
            "Updated Date": new Date().toISOString(),
          })
          .eq("ID", quoteRequestId);

        if (updateErr) {
          console.log("Error updating Quote Request with PDF URL:", JSON.stringify(updateErr));
        } else {
          console.log("Quote Request updated with PDF URL for ID:", quoteRequestId);
        }
      } catch (updateErr) {
        console.log("Error updating Quote Request:", updateErr);
      }
    } else {
      console.log("Skipping Quote Request update — quoteRequestId:", quoteRequestId, "storageSignedUrl:", !!storageSignedUrl);
    }

    // Generate short URL for the PDF (for display/email)
    const directPdfUrl = storageSignedUrl || pdfUrl;
    let shortPdfUrl = directPdfUrl;
    if (directPdfUrl) {
      const shortId = crypto.randomUUID().slice(0, 8);
      await kv.set(`img:${shortId}`, directPdfUrl);
      const fnBase = Deno.env.get("SUPABASE_URL") + "/functions/v1/make-server-4808de5e";
      shortPdfUrl = `${fnBase}/i/${shortId}`;
    }
    // Return both: pdfUrl (short redirect) for links, directPdfUrl for Slack/Zapier file uploads
    return c.json({ success: true, pdfUrl: shortPdfUrl, directPdfUrl });
  } catch (err) {
    console.log("Error in cost-guide-pdf generation:", err);
    return c.json({ error: "Failed to generate PDF: " + err }, 500);
  }
});

// =============================================
// COST GUIDE — SEND EMAIL WITH PDF VIA RESEND
// =============================================
app.post("/make-server-4808de5e/cost-guide-email", async (c) => {
  try {
    if (!(await verifyAuth(c))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) {
      return c.json({ error: "Too many requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);
    }

    const body = await c.req.json();
    const { email, name, pdfUrl } = body;

    if (!email || !isValidEmail(email)) {
      return c.json({ error: "Valid email is required" }, 400);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("RESEND_API_KEY not configured");
      return c.json({ error: "Email service not configured" }, 500);
    }

    const cleanName = sanitizeString(name || "Homeowner", 100);
    const downloadUrl = pdfUrl || "#";

    const htmlEmail = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0ede6;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#fafaf8;border-radius:12px;border:1px solid #d8d3c8;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #d8d3c8;">
              <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#0f0f0d;">NETWORK</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#0f0f0d;line-height:1.2;">Your Cost Guide is Ready.</h1>
              <p style="margin:0 0 24px;font-family:'EB Garamond',Georgia,serif;font-size:20px;font-weight:400;font-style:italic;color:#9a9790;line-height:1.3;">Download your personalized renovation estimate.</p>
              <p style="margin:0 0 8px;font-family:'DM Sans',sans-serif;font-size:15px;color:#6b6860;line-height:1.75;">Hello ${cleanName},</p>
              <p style="margin:0 0 24px;font-family:'DM Sans',sans-serif;font-size:15px;color:#6b6860;line-height:1.75;">We've put together a personalized renovation cost breakdown based on your selections. Download it below to see detailed estimates for each room.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#0f0f0d;border-radius:12px;">
                    <a href="${downloadUrl}" target="_blank" style="display:inline-block;padding:16px 32px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:#fafaf8;text-decoration:none;">Download Your Cost Breakdown</a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede6;border-radius:10px;border:1px solid #d8d3c8;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;color:#0f0f0d;">What happens next</p>
                    <p style="margin:0 0 8px;font-family:'DM Sans',sans-serif;font-size:13px;color:#6b6860;line-height:1.6;">✓ Review your room-by-room cost estimates</p>
                    <p style="margin:0 0 8px;font-family:'DM Sans',sans-serif;font-size:13px;color:#6b6860;line-height:1.6;">✓ A renovation specialist will reach out to help</p>
                    <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:13px;color:#6b6860;line-height:1.6;">✓ Get matched to verified designers who fit your budget</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-family:'DM Sans',sans-serif;font-size:14px;color:#6b6860;line-height:1.75;">Cheers to your renovation journey,<br><strong style="color:#0f0f0d;">Network Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #d8d3c8;">
              <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:11px;color:#9a9790;line-height:1.6;">Singapore's trusted platform for homeowner-designer matching.<br>© 2026 Network. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Network <onboarding@resend.dev>",
        to: [email],
        subject: "Your Renovation Cost Guide is Ready",
        html: htmlEmail,
      }),
    });

    const resendResult = await resendRes.json();
    console.log("Resend response:", JSON.stringify(resendResult));

    if (!resendRes.ok) {
      console.log("Resend API error:", JSON.stringify(resendResult));
      return c.json({ error: "Failed to send email: " + (resendResult.message || "Unknown error") }, 500);
    }

    return c.json({ success: true, emailId: resendResult.id });
  } catch (err) {
    console.log("Error in cost-guide-email:", err);
    return c.json({ error: "Failed to send email: " + err }, 500);
  }
});

// =============================================
// FLOOR PLAN 3D EDITOR — AI RENDER (per-user)
// =============================================

// Submit an editor screenshot for AI rendering (server-side, persists after user leaves)
app.post("/make-server-4808de5e/fp3d/editor-render", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "render-task");
    if (!rl.allowed) return c.json({ error: "Too many render requests. Please wait.", retryAfterMs: rl.retryAfterMs }, 429);

    const dailyCap = await checkDailyRenderCap();
    if (!dailyCap.allowed) return c.json({ error: "Daily render limit reached. Try again tomorrow." }, 429);

    const userCap = await checkUserDailyRenderCap(user.id);
    if (!userCap.allowed) return c.json({ error: `You've used all ${userCap.limit} renders for today. Try again tomorrow.`, remaining: 0, limit: userCap.limit }, 429);

    const body = await c.req.json();
    const { imageBase64, projectId: editorProjectId, projectName, aspectRatio, designStyle } = body;

    if (!imageBase64) return c.json({ error: "imageBase64 is required" }, 400);

    const estimatedSize = Math.ceil(imageBase64.length * 0.75);
    if (estimatedSize > 20 * 1024 * 1024) {
      return c.json({ error: "Image too large. Maximum 20MB." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const imageData = base64Decode(imageBase64);
    const renderId = crypto.randomUUID();
    const filePath = `editor-renders/${user.id}/${renderId}-input.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageData, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.log("Editor render upload error:", uploadError);
      return c.json({ error: "Failed to upload screenshot" }, 500);
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600);

    if (signError || !signedData?.signedUrl) {
      return c.json({ error: "Failed to create signed URL" }, 500);
    }

    const imageUrl = signedData.signedUrl;
    const editorSupabaseHost = new URL(Deno.env.get("SUPABASE_URL")!).hostname;
    if (!isValidStorageUrl(imageUrl, [editorSupabaseHost])) {
      return c.json({ error: "Invalid image URL" }, 400);
    }

    const apiKey = Deno.env.get("ai_model_keys");
    if (!apiKey) {
      return c.json({ error: "AI model API key not configured" }, 500);
    }

    const callBackUrl = `${supabaseUrl}/functions/v1/make-server-4808de5e/fp3d/editor-render-callback`;

    // Build style-specific prompt segment based on user's design style selection
    const STYLE_PROMPTS: Record<string, string> = {
      modern: "Modern minimalist style: clean geometric lines, neutral color palette (whites, grays, blacks), minimal decor, sleek low-profile furniture, open space, polished concrete or light hardwood floors, recessed lighting.",
      scandinavian: "Scandinavian style: light natural wood tones (birch, pine), cozy hygge atmosphere, soft white and cream palette, woven textiles and sheepskin throws, simple functional furniture, abundant natural light, indoor plants.",
      industrial: "Industrial loft style: exposed red brick walls, raw concrete surfaces, visible steel beams and ductwork, Edison bulb lighting, distressed leather furniture, metal and reclaimed wood accents, open floor plan.",
      japandi: "Japandi style: fusion of Japanese minimalism and Scandinavian warmth, natural muted earth tones, low furniture with clean lines, shoji screen elements, wabi-sabi imperfection, light wood with paper and ceramic accents, zen tranquility.",
      midcentury: "Mid-Century Modern style: iconic retro furniture shapes (Eames, Noguchi), warm teak and walnut wood, bold accent colors (mustard, teal, orange), tapered legs, organic curves, starburst clocks, statement pendant lights.",
      bohemian: "Bohemian eclectic style: rich layered textiles (kilim rugs, macrame, throw pillows), warm saturated colors, global patterns and motifs, rattan and wicker furniture, abundant greenery, collected-over-time aesthetic.",
      mediterranean: "Mediterranean style: warm terracotta tile floors, arched doorways and windows, sun-washed stucco walls, wrought iron accents, olive and ochre palette, rustic wood beams, ceramic and mosaic tile details.",
      artdeco: "Art Deco style: glamorous gold and brass accents, bold geometric patterns, rich jewel tones (emerald, sapphire, ruby), lacquered surfaces, velvet upholstery, mirror panels, statement chandeliers, luxurious marble.",
      coastal: "Coastal style: light and airy palette (whites, soft blues, sandy beiges), natural fiber rugs (jute, sisal), whitewashed wood, linen fabrics, nautical accents, large windows with sheer curtains, driftwood decor.",
      farmhouse: "Rustic Farmhouse style: exposed wood ceiling beams, shiplap accent walls, vintage-inspired fixtures, distressed white-painted furniture, mason jar details, warm neutral palette, barn door elements, cozy textiles.",
    };

    const styleDesc = designStyle && STYLE_PROMPTS[designStyle] ? STYLE_PROMPTS[designStyle] : "Style: modern, clean, warm, magazine-quality editorial interior photography.";

    const prompt = `Transform this 3D interior room rendering into a photorealistic interior design photograph. Focus ONLY on the room interior — any white empty space, ground plane, or exterior areas outside the room walls are just empty background and must be left as plain white or ignored entirely; do NOT fill them with scenery, landscape, or any content. Maintain the EXACT room layout, wall positions, door and window placements, furniture arrangement, and spatial proportions shown inside the room — do not move, resize, remove, or add any architectural elements or furniture. Apply photorealistic materials: hardwood or polished tile flooring with natural grain, smooth painted or subtly textured walls, realistic fabric upholstery and wood grain on furniture, metal fixtures with proper reflections. Add natural lighting through windows with soft volumetric rays, warm ambient room lighting from ceiling fixtures, and accurate soft shadows with proper ambient occlusion. Render with professional architectural photography quality: subtle depth of field, warm natural color temperature (5500K), balanced exposure, and cinematic composition. The result should look like a real interior photograph taken by a professional architectural photographer. ${styleDesc} IMPORTANT: Do NOT render, fill, or extend anything beyond the room walls — all exterior white space must remain white.`;

    console.log("Submitting editor render to kie.ai for user:", user.id, "project:", editorProjectId);

    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-2",
        callBackUrl,
        input: {
          prompt,
          image_input: [imageUrl],
          aspect_ratio: "auto",
          google_search: false,
          resolution: "4K",
          output_format: "jpg",
        },
      }),
    });

    const result = await response.json();
    console.log("kie.ai editor render response status:", response.status);

    if (!response.ok) {
      console.log("kie.ai API error:", JSON.stringify(result));
      return c.json({ error: "AI render service error. Please try again." }, 500);
    }

    const taskId = result.data?.taskId || result.data?.task_id || result.data?.id ||
                   result.taskId || result.task_id || result.id || renderId;

    const renderRecord = {
      renderId,
      taskId,
      userId: user.id,
      projectId: editorProjectId || null,
      projectName: sanitizeString(projectName || "Untitled", 200),
      aspectRatio: aspectRatio || "16:9",
      designStyle: designStyle || null,
      status: "processing",
      inputImagePath: filePath,
      resultUrl: null as string | null,
      storageResultUrl: null as string | null,
      createdAt: new Date().toISOString(),
      completedAt: null as string | null,
    };

    await kv.set(`editor-render:${taskId}`, renderRecord);
    const userRenderIds: string[] = (await kv.get(`user-renders:${user.id}`)) || [];
    userRenderIds.unshift(renderId);
    await kv.set(`user-renders:${user.id}`, userRenderIds.slice(0, 100));
    await kv.set(`render-id-map:${renderId}`, taskId);

    console.log("Editor render task stored:", renderId, "taskId:", taskId);
    return c.json({ success: true, renderId, taskId, remaining: userCap.limit - userCap.used });
  } catch (err) {
    console.log("Unexpected error in /fp3d/editor-render:", err);
    return c.json({ error: "Unexpected server error" }, 500);
  }
});

// Callback from kie.ai for editor renders
app.post("/make-server-4808de5e/fp3d/editor-render-callback", async (c) => {
  try {
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    const body = await c.req.json();
    console.log("Editor render callback received");

    const taskId = body.data?.taskId || body.taskId;
    if (!taskId || typeof taskId !== "string" || taskId.length > 200) {
      return c.json({ success: true, message: "Invalid taskId" });
    }

    const existing = await kv.get(`editor-render:${taskId}`);
    if (!existing) {
      console.log("Editor render callback: unknown taskId:", taskId);
      return c.json({ error: "Unknown task" }, 404);
    }

    const kieStatus = extractKieStatus(body.data || body);
    const normalizedStatus = ["success", "completed", "done", "finished"].includes(kieStatus)
      ? "completed"
      : ["failed", "error", "cancelled", "canceled"].includes(kieStatus)
      ? "failed"
      : "completed";

    let resultUrl: string | null = extractKieResultUrl(body.data || {});
    if (!resultUrl) resultUrl = extractKieResultUrl(body);
    if (!resultUrl) {
      const legacyUrl = body.data?.output?.[0] || body.output?.[0] || null;
      if (legacyUrl && typeof legacyUrl === "string" && legacyUrl.startsWith("http") && legacyUrl.length < 2000) {
        resultUrl = legacyUrl;
      }
    }
    if (!resultUrl) {
      const allUrls = findUrlsInObject(body);
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const outputUrls = allUrls.filter(u => !u.includes(supabaseUrl) && !u.includes("kie.ai/api") && !u.includes("/editor-render-callback"));
      if (outputUrls.length > 0) resultUrl = outputUrls[0];
    }

    let storageResultUrl: string | null = null;
    if (resultUrl && normalizedStatus === "completed") {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const imgRes = await fetch(resultUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (imgRes.ok) {
          const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());
          const ext = (imgRes.headers.get("content-type") || "").includes("png") ? "png" : "jpg";
          const resultPath = `editor-renders/${existing.userId}/${existing.renderId}-result.${ext}`;

          const { error: upErr } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(resultPath, imgBuffer, { contentType: `image/${ext}`, upsert: true });

          if (!upErr) {
            const { data: sd } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(resultPath, 30 * 24 * 3600);
            storageResultUrl = sd?.signedUrl || null;
            console.log("Editor render result saved to storage");
          }
        }
      } catch (dlErr: any) {
        console.log("Error downloading editor render result:", dlErr?.message || dlErr);
      }
    }

    await kv.set(`editor-render:${taskId}`, {
      ...existing,
      status: normalizedStatus,
      resultUrl: resultUrl || null,
      storageResultUrl,
      completedAt: new Date().toISOString(),
    });

    console.log("Editor render callback processed:", taskId, "status:", normalizedStatus);
    return c.json({ success: true });
  } catch (err) {
    console.log("Error in editor-render-callback:", err);
    return c.json({ error: "Server error" }, 500);
  }
});

// List renders for current user
app.get("/make-server-4808de5e/fp3d/renders", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const renderIds: string[] = (await kv.get(`user-renders:${user.id}`)) || [];
    if (renderIds.length === 0) return c.json({ renders: [] });

    const renders: any[] = [];
    const apiKey = Deno.env.get("ai_model_keys");

    for (const renderId of renderIds) {
      const taskId = await kv.get(`render-id-map:${renderId}`);
      if (!taskId) continue;
      const record = await kv.get(`editor-render:${taskId}`);
      if (!record) continue;

      // If still processing, poll kie.ai
      if (record.status === "processing" && apiKey) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 5000);
          const kieRes = await fetch(
            `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
            { headers: { "Authorization": `Bearer ${apiKey}` }, signal: controller.signal }
          );
          clearTimeout(tid);

          if (kieRes.ok) {
            const kieData = await kieRes.json();
            const kieStatus = extractKieStatus(kieData.data);
            let rUrl: string | null = extractKieResultUrl(kieData.data);
            if (!rUrl) rUrl = extractKieResultUrl(kieData);
            if (!rUrl) {
              const allUrls = findUrlsInObject(kieData);
              const sUrl = Deno.env.get("SUPABASE_URL") || "";
              const outputUrls = allUrls.filter(u => !u.includes(sUrl) && !u.includes("kie.ai/api"));
              if (outputUrls.length > 0) rUrl = outputUrls[0];
            }

            const isSuccess = ["success", "completed", "done", "finished"].includes(kieStatus);
            const isFailed = ["failed", "error", "cancelled", "canceled"].includes(kieStatus);

            if ((isSuccess || rUrl) && rUrl) {
              let sResultUrl: string | null = null;
              try {
                const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
                const ctrl2 = new AbortController();
                const tid2 = setTimeout(() => ctrl2.abort(), 15000);
                const imgRes = await fetch(rUrl, { signal: ctrl2.signal });
                clearTimeout(tid2);
                if (imgRes.ok) {
                  const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());
                  const ext = (imgRes.headers.get("content-type") || "").includes("png") ? "png" : "jpg";
                  const resultPath = `editor-renders/${record.userId}/${renderId}-result.${ext}`;
                  const { error: upErr } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(resultPath, imgBuffer, { contentType: `image/${ext}`, upsert: true });
                  if (!upErr) {
                    const { data: sd } = await supabase.storage
                      .from(BUCKET_NAME)
                      .createSignedUrl(resultPath, 30 * 24 * 3600);
                    sResultUrl = sd?.signedUrl || null;
                  }
                }
              } catch (_) {}

              record.status = "completed";
              record.resultUrl = rUrl;
              record.storageResultUrl = sResultUrl;
              record.completedAt = new Date().toISOString();
              await kv.set(`editor-render:${taskId}`, record);
            } else if (isFailed) {
              record.status = "failed";
              record.completedAt = new Date().toISOString();
              await kv.set(`editor-render:${taskId}`, record);
            }
          }
        } catch (_) {}
      }

      renders.push({
        renderId: record.renderId,
        taskId: record.taskId,
        projectId: record.projectId,
        projectName: record.projectName,
        aspectRatio: record.aspectRatio,
        status: record.status,
        resultUrl: record.storageResultUrl || record.resultUrl || null,
        createdAt: record.createdAt,
        completedAt: record.completedAt,
      });
    }

    return c.json({ renders });
  } catch (err) {
    console.log("Error in GET /fp3d/renders:", err);
    return c.json({ error: "Server error" }, 500);
  }
});

// Delete a render for current user
app.delete("/make-server-4808de5e/fp3d/renders/:renderId", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required" }, 401);

    const renderId = sanitizeKvKey(c.req.param("renderId"), 100);
    if (!renderId) return c.json({ error: "Invalid render ID" }, 400);

    const renderIds: string[] = (await kv.get(`user-renders:${user.id}`)) || [];
    await kv.set(`user-renders:${user.id}`, renderIds.filter(id => id !== renderId));

    const taskId = await kv.get(`render-id-map:${renderId}`);
    if (taskId) {
      await kv.del(`editor-render:${taskId}`);
      await kv.del(`render-id-map:${renderId}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log("Error in DELETE /fp3d/renders:", err);
    return c.json({ error: "Server error" }, 500);
  }
});

// =============================================
// PIPELINE → DESIGNER PROFILE MAPPING
// =============================================

/**
 * Maps at_clients_pipeline.fields (from ons-portal) into a designers.data object
 * so that when a designer first logs in, their profile is pre-populated.
 */
function mapPipelineToDesignerData(fields: any, slug: string): any {
  const name = fields["Client"] || "";
  const contactPerson = fields["Contact Person"] || "";
  const address = (fields["Office Address"] || "").trim();
  const phone = fields["Phone"] || "";
  const acra = fields["ACRA/UEN"] || "";
  const yearsExp = fields["Years of Experience"];
  const dateJoined = fields["Date Joined"];
  const styles: string[] = fields["Design Styles"] || [];
  const projectTypes: string[] = fields["Typical Project Type"] || [];
  const budgetRange: string[] = fields["Budget Range"] || [];
  const serviceAreaArr: string[] = fields["Service Area"] || [];
  const specialization: string[] = fields["Specialization"] || [];
  const services: string[] = fields["Services"] || [];
  const landed = fields["Landed Project Eligibility"];
  const financing = fields["Renovation Financing"] || "";
  const classification = fields["Classification"] || "";

  // Combine budget ranges into "lowest – highest" (e.g. "Under $30K – $120K+")
  const combineBudgetRange = (ranges: string[]): string => {
    if (ranges.length === 0) return "";
    if (ranges.length === 1) {
      // Single range like "Under $30K – Partial Renovation" → just the budget part
      return ranges[0].split("–")[0].trim();
    }
    // Extract the first dollar amount from each range for sorting
    const parsed = ranges.map(r => {
      const label = r.split("–")[0].trim(); // "Under $30K – Partial Renovation" → "Under $30K"
      const numMatch = label.match(/\$?(\d+)/);
      const num = numMatch ? parseInt(numMatch[1], 10) : 0;
      const isUnder = /under/i.test(label);
      const isPlus = /\+/.test(label);
      return { label, num, isUnder, isPlus };
    });
    parsed.sort((a, b) => a.num - b.num);
    const lowest = parsed[0];
    const highest = parsed[parsed.length - 1];
    const lowStr = lowest.isUnder ? `Under $${lowest.num}K` : `$${lowest.num}K`;
    const highStr = `$${highest.num}K${highest.isPlus ? "+" : "+"}`;
    return `${lowStr} – ${highStr}`;
  };

  // Parse project types for credentials
  const hasHdb = projectTypes.some((t: string) => /hdb/i.test(t));
  const hasLanded = landed === "Landed Homes" || projectTypes.some((t: string) => /landed/i.test(t));

  // Build businessInfo array
  const businessInfo: { label: string; value: string }[] = [];
  if (acra) businessInfo.push({ label: "ACRA / UEN", value: acra });
  if (phone) businessInfo.push({ label: "Phone", value: phone });
  if (financing) businessInfo.push({ label: "Financing", value: financing });
  if (projectTypes.length) businessInfo.push({ label: "Project types", value: projectTypes.join(" · ") });
  if (styles.length) businessInfo.push({ label: "Style specialisation", value: styles.join(" · ") });
  if (budgetRange.length) businessInfo.push({ label: "Budget range", value: combineBudgetRange(budgetRange) });
  if (serviceAreaArr.length) businessInfo.push({ label: "Service area", value: serviceAreaArr.join(" · ") });
  if (specialization.length) businessInfo.push({ label: "Specialisation", value: specialization.join(" · ") });
  if (services.length) businessInfo.push({ label: "Services", value: services.join(" · ") });

  // Trusted since year
  const joinYear = dateJoined ? new Date(dateJoined).getFullYear() : null;

  return {
    name,
    slug,
    founder: contactPerson,
    location: address || "Singapore Based",
    tagline: classification || "",
    bio: "",
    stats: {
      years: yearsExp ? String(yearsExp) : "1",
      rating: "",
      hdbCert: hasHdb,
      bcaLicensed: false,
      reviewCount: "0",
    },
    credentials: {
      hdb: { title: "HDB Registered Contractor", active: hasHdb, firm: name, reg: "" },
      bca: { title: "BCA Licensed Builder", active: false, firm: name, reg: "" },
      landedEligible: hasLanded,
    },
    businessInfo,
    services,
    designStyles: styles,
    specialization,
    budgetRange,
    serviceArea: { regions: serviceAreaArr },
    trustedSince: {
      title: joinYear ? `Trusted Since ${joinYear}` : "",
      badges: [],
      description: "",
      certifications: [],
    },
    coverProject: { name: "Your Featured Project" },
    images: {},
    updatedAt: new Date().toISOString(),
  };
}

// =============================================
// PORTAL AUTH (ons-portal portal_accounts)
// =============================================

app.post("/make-server-4808de5e/portal-login", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);

    // Brute force protection
    const lockout = checkLoginLockout(ip);
    if (lockout.locked) {
      securityLog("portal_login_lockout", "warn", ip, "/portal-login");
      return c.json({ error: `Too many failed attempts. Try again in ${Math.ceil(lockout.remainingMs! / 60000)} minutes.` }, 429);
    }

    const body = await c.req.json();
    const username = sanitizeString(body.username || "", 100).toLowerCase().trim();
    const password = body.password || "";

    if (!username || !password) return c.json({ error: "Username and password are required" }, 400);

    // ── Super account check (single shared editor credential) ──
    const superUser = Deno.env.get("SUPER_EDITOR_USER");
    const superPass = Deno.env.get("SUPER_EDITOR_PASS");
    if (superUser && superPass && username === superUser.toLowerCase().trim() && password === superPass) {
      const sessionToken = crypto.randomUUID();
      await kv.set(`designer-session:${sessionToken}`, {
        slug: "__super__",
        isSuper: true,
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      clearFailedLogins(ip);
      console.log(`Super editor login success from ${ip}`);
      return c.json({ success: true, token: sessionToken, slug: "__super__", isSuper: true });
    }

    // Connect to ons-portal Supabase
    const portalUrl = Deno.env.get("ONS_PORTAL_URL");
    const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
    if (!portalUrl || !portalKey) {
      console.log("ONS_PORTAL_URL or ONS_PORTAL_SERVICE_ROLE_KEY not configured");
      return c.json({ error: "Portal auth not configured" }, 500);
    }

    // Validate that ONS_PORTAL_URL looks like a real Supabase URL
    if (!portalUrl.startsWith("https://")) {
      console.log(`ONS_PORTAL_URL is not a valid URL: ${portalUrl.substring(0, 20)}...`);
      return c.json({ error: "Portal auth misconfigured" }, 500);
    }

    const portalClient = createClient(portalUrl, portalKey);

    // Try username first, then email if not found (with timeout protection)
    let accounts: any[] | null = null;
    let portalErr: any = null;

    const portalTimeout = (promise: Promise<any>) =>
      Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("Portal DB timeout")), 8000))]);

    try {
      const res1: any = await portalTimeout(portalClient.from("portal_accounts").select("*").eq("username", username).eq("active", true).limit(1));
      accounts = res1.data;
      portalErr = res1.error;

      if ((!accounts || accounts.length === 0) && !portalErr) {
        // Try matching by email (case-insensitive)
        const res2: any = await portalTimeout(portalClient.from("portal_accounts").select("*").ilike("email", username).eq("active", true).limit(1));
        accounts = res2.data;
        portalErr = res2.error;
      }
    } catch (timeoutErr: any) {
      console.log(`Portal login timeout for: ${username} — ${timeoutErr.message}`);
      return c.json({ error: "Portal service unavailable. Please try again." }, 503);
    }

    if (portalErr || !accounts || accounts.length === 0) {
      recordFailedLogin(ip);
      console.log(`Portal login failed for: ${username} — ${portalErr?.message || "not found"}`);
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const account = accounts[0];

    // Plaintext password comparison (matching portal_accounts schema)
    if (account.password !== password) {
      recordFailedLogin(ip);
      console.log(`Portal login failed for: ${username} — wrong password`);
      return c.json({ error: "Invalid username or password" }, 401);
    }

    // Use the actual username from portal_accounts as the slug (not the login input which could be email)
    const accountSlug = account.username;

    // Create session in KV store
    const sessionToken = crypto.randomUUID();

    await kv.set(`designer-session:${sessionToken}`, {
      slug: accountSlug,
      email: account.email,
      firmName: account.firm_name,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    clearFailedLogins(ip);
    console.log(`Portal login success: ${accountSlug} (${account.firm_name})`);

    // ── Auto-populate designer profile from at_clients_pipeline (if sparse) ──
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: existing } = await supabase.from("designers").select("data").eq("slug", accountSlug).maybeSingle();
      const isSparse = !existing || !existing.data || Object.keys(existing.data).length < 5;

      if (isSparse && account.firm_name) {
        const { data: pipelineRows } = await portalClient
          .from("at_clients_pipeline")
          .select("fields")
          .filter("fields->>Client", "eq", account.firm_name)
          .limit(1);

        if (pipelineRows?.[0]?.fields) {
          const mapped = mapPipelineToDesignerData(pipelineRows[0].fields, accountSlug);
          await supabase.from("designers").upsert(
            { slug: accountSlug, name: mapped.name || accountSlug, data: mapped, updated_at: new Date().toISOString() },
            { onConflict: "slug" },
          );
          console.log(`Auto-populated designer profile for ${accountSlug} from pipeline (${account.firm_name})`);
        }
      }
    } catch (e) {
      console.log("Auto-populate from pipeline failed (non-fatal):", e);
    }

    return c.json({
      success: true,
      token: sessionToken,
      slug: accountSlug,
      profile: { firmName: account.firm_name, email: account.email, avatar: account.avatar },
    });
  } catch (err) {
    console.log("Unexpected error in POST /portal-login:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/make-server-4808de5e/portal-session", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token || !isValidToken(token)) return c.json({ error: "No session token" }, 401);

    // Check KV first (fast path, compatible with existing auth)
    const kvSession = await kv.get(`designer-session:${token}`);
    if (kvSession && kvSession.slug) {
      // Check expiry
      if (kvSession.expiresAt && kvSession.expiresAt < Date.now()) {
        await kv.del(`designer-session:${token}`);
        return c.json({ error: "Session expired" }, 401);
      }
      // Super session — no specific designer profile to load
      if (kvSession.isSuper) {
        return c.json({ valid: true, isSuper: true });
      }

      // Fetch designer profile from designers table
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: designer } = await supabase
        .from("designers")
        .select("slug, name, data")
        .eq("slug", kvSession.slug)
        .single();

      return c.json({
        valid: true,
        slug: kvSession.slug,
        email: kvSession.email,
        firmName: kvSession.firmName,
        profile: designer ? { name: designer.name, data: designer.data } : null,
      });
    }

    return c.json({ error: "Invalid session" }, 401);
  } catch (err) {
    console.log("Unexpected error in GET /portal-session:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/portal-logout", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (token) {
      await kv.del(`designer-session:${token}`);
    }
    return c.json({ success: true });
  } catch (err) {
    console.log("Unexpected error in POST /portal-logout:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// BULK SET ACTIVE/INACTIVE for all designers
// POST /admin/bulk-set-active?active=false  (or true)
// Protected by CRON_SECRET
// =============================================
app.post("/make-server-4808de5e/admin/bulk-set-active", async (c) => {
  try {
    const cronSecret = c.req.header("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    if (!cronSecret || !expected || cronSecret !== expected) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const activeParam = c.req.query("active");
    if (activeParam !== "true" && activeParam !== "false") {
      return c.json({ error: "Query param ?active=true or ?active=false required" }, 400);
    }
    const newActive = activeParam === "true";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.from("kv_store_4808de5e").select("key, value").like("key", "designer:%").not("key", "like", "%:%:%");
    if (error) return c.json({ error: error.message }, 500);

    let updated = 0;
    for (const row of data || []) {
      const designer = row.value as any;
      if (designer.active !== newActive) {
        designer.active = newActive;
        await supabase.from("kv_store_4808de5e").update({ value: designer }).eq("key", row.key);
        updated++;
      }
    }
    console.log(`Bulk set active=${newActive}: updated ${updated} of ${data?.length || 0} designers`);
    return c.json({ success: true, active: newActive, updated, total: data?.length || 0 });
  } catch (err) {
    console.log("Error in bulk-set-active:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// BULK SYNC: at_clients_pipeline → designers
// =============================================
// One-time (or periodic) endpoint to pre-populate ALL designer profiles
// from ons-portal at_clients_pipeline data. Protected by CRON_SECRET.
// ── Sync designer edit links to ONS Portal ──
app.post("/make-server-4808de5e/admin/sync-edit-links", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const portalUrl = Deno.env.get("ONS_PORTAL_URL");
    const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
    if (!portalUrl || !portalKey) return c.json({ error: "Portal not configured" }, 500);

    const sb = getDesignerSupabase();
    const { data: designers } = await sb.from("designers").select("slug, name, data");
    if (!designers?.length) return c.json({ error: "No designers found" }, 404);

    const portalClient = createClient(portalUrl, portalKey);
    const baseUrl = "https://networksg.net/edit-profile";

    const rows = designers.map((d: any) => ({
      slug: d.slug,
      name: d.data?.name || d.name || d.slug,
      edit_link: `${baseUrl}/${d.slug}`,
    }));

    const { error: upsertErr } = await portalClient
      .from("designer_edit_links")
      .upsert(rows, { onConflict: "slug" });

    if (upsertErr) {
      console.log("Error syncing edit links:", upsertErr);
      return c.json({ error: upsertErr.message }, 500);
    }

    console.log(`Synced ${rows.length} designer edit links to ONS Portal`);
    return c.json({ success: true, count: rows.length });
  } catch (err) {
    console.log("Unexpected error in sync-edit-links:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/admin/sync-pipeline-to-designers", async (c) => {
  try {
    const cronSecret = c.req.header("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    if (!cronSecret || !expected || cronSecret !== expected) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const portalUrl = Deno.env.get("ONS_PORTAL_URL");
    const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
    if (!portalUrl || !portalKey) {
      return c.json({ error: "Portal not configured" }, 500);
    }

    // ?force=true skips the sparse check and re-syncs all profiles that haven't been manually edited
    const forceSync = c.req.query("force") === "true";
    // ?slugs=sora,onehome — reset specific slugs to fresh pipeline data (ignores all checks)
    const onlySlugs = c.req.query("slugs") ? new Set(c.req.query("slugs")!.split(",").map(s => s.trim())) : null;

    const portalClient = createClient(portalUrl, portalKey);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Fetch all portal_accounts
    const { data: accounts, error: accErr } = await portalClient
      .from("portal_accounts")
      .select("username, firm_name, email")
      .eq("active", true);

    if (accErr || !accounts) {
      return c.json({ error: "Failed to fetch portal_accounts", detail: accErr?.message }, 500);
    }

    // 2. Fetch all pipeline rows
    const { data: pipelineRows, error: pipErr } = await portalClient
      .from("at_clients_pipeline")
      .select("fields");

    if (pipErr) {
      return c.json({ error: "Failed to fetch at_clients_pipeline", detail: pipErr?.message }, 500);
    }

    // Build a lookup map: firm_name → pipeline fields
    const pipelineMap = new Map<string, any>();
    for (const row of pipelineRows || []) {
      const clientName = row.fields?.["Client"];
      if (clientName) pipelineMap.set(clientName, row.fields);
    }

    const results: { synced: string[]; skipped: string[]; noMatch: string[]; errors: string[] } = {
      synced: [], skipped: [], noMatch: [], errors: [],
    };

    for (const acc of accounts) {
      const slug = acc.username;
      if (!slug) continue;
      // If ?slugs= is specified, only process those specific slugs
      if (onlySlugs && !onlySlugs.has(slug)) continue;

      try {
        // When targeting specific slugs, always overwrite (fresh start)
        const isTargeted = onlySlugs?.has(slug);

        // Check if designers row is sparse (skip rich profiles unless force=true)
        const { data: existing } = await supabase.from("designers").select("data").eq("slug", slug).maybeSingle();
        const isSparse = !existing || !existing.data || Object.keys(existing.data).length < 5;
        // If profile has been manually edited (has images, bio, etc.), don't overwrite even with force
        const hasManualEdits = existing?.data?.bio || existing?.data?.images?.cover || existing?.data?.images?.logo;

        if (!isTargeted && !forceSync && !isSparse) {
          results.skipped.push(slug);
          continue;
        }
        if (!isTargeted && forceSync && hasManualEdits) {
          results.skipped.push(slug);
          continue;
        }

        // Look up pipeline data by firm_name
        const pipelineFields = acc.firm_name ? pipelineMap.get(acc.firm_name) : null;
        if (!pipelineFields) {
          results.noMatch.push(`${slug} (${acc.firm_name || "no firm_name"})`);
          continue;
        }

        const mapped = mapPipelineToDesignerData(pipelineFields, slug);
        await supabase.from("designers").upsert(
          { slug, name: mapped.name || slug, data: mapped, updated_at: new Date().toISOString() },
          { onConflict: "slug" },
        );
        results.synced.push(slug);
      } catch (e) {
        results.errors.push(`${slug}: ${(e as Error).message}`);
      }
    }

    console.log(`Pipeline sync complete: synced=${results.synced.length}, skipped=${results.skipped.length}, noMatch=${results.noMatch.length}, errors=${results.errors.length}`);
    return c.json({
      success: true,
      synced: results.synced.length,
      skipped: results.skipped.length,
      noMatch: results.noMatch.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (err) {
    console.log("Error in sync-pipeline-to-designers:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─────────────────────────────────────────────────────────────
// SYNC: ons-portal portal_accounts.email → ons-website designers.data.contactEmail
// Keyed by username → slug. Only fills missing contactEmail unless ?force=true.
// Protected by CRON_SECRET.
// ─────────────────────────────────────────────────────────────
app.post("/make-server-4808de5e/admin/sync-portal-emails", async (c) => {
  try {
    const cronSecret = c.req.header("x-cron-secret");
    const expected = Deno.env.get("CRON_SECRET");
    if (!cronSecret || !expected || cronSecret !== expected) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const portalUrl = Deno.env.get("ONS_PORTAL_URL");
    const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
    if (!portalUrl || !portalKey) {
      return c.json({ error: "Portal not configured" }, 500);
    }
    const forceSync = c.req.query("force") === "true";
    const dryRun = c.req.query("dryRun") === "true";

    const portalClient = createClient(portalUrl, portalKey);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: accounts, error: accErr } = await portalClient
      .from("portal_accounts")
      .select("username, email, active")
      .eq("active", true);
    if (accErr || !accounts) {
      return c.json({ error: "Failed to fetch portal_accounts", detail: accErr?.message }, 500);
    }

    const results = { updated: [] as string[], skipped: [] as string[], noEmail: [] as string[], noDesigner: [] as string[], errors: [] as string[] };

    for (const acc of accounts) {
      const slug = (acc.username || "").trim();
      const email = (acc.email || "").trim().toLowerCase();
      if (!slug) continue;
      if (!email) { results.noEmail.push(slug); continue; }

      try {
        const { data: existing } = await supabase.from("designers").select("name, data").eq("slug", slug).maybeSingle();
        if (!existing) { results.noDesigner.push(slug); continue; }

        const currentEmail = (existing.data?.contactEmail || "").trim().toLowerCase();
        if (currentEmail && !forceSync) { results.skipped.push(slug); continue; }
        if (currentEmail === email) { results.skipped.push(slug); continue; }

        if (dryRun) { results.updated.push(`${slug} (dry: "${currentEmail}" → "${email}")`); continue; }

        const nextData = { ...(existing.data || {}), contactEmail: email };
        const { error: upErr } = await supabase
          .from("designers")
          .update({ data: nextData, updated_at: new Date().toISOString() })
          .eq("slug", slug);
        if (upErr) { results.errors.push(`${slug}: ${upErr.message}`); continue; }
        results.updated.push(slug);
      } catch (e) {
        results.errors.push(`${slug}: ${(e as Error).message}`);
      }
    }

    console.log(`Portal email sync: updated=${results.updated.length}, skipped=${results.skipped.length}, noEmail=${results.noEmail.length}, noDesigner=${results.noDesigner.length}, errors=${results.errors.length}`);
    return c.json({
      success: true,
      dryRun,
      force: forceSync,
      counts: {
        updated: results.updated.length,
        skipped: results.skipped.length,
        noEmail: results.noEmail.length,
        noDesigner: results.noDesigner.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (err) {
    console.log("Error in sync-portal-emails:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ── Profile Editor: Save to designers + designer_sections tables ──

app.get("/make-server-4808de5e/designer-profile-data/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");

    // Auth: portal designer-token OR admin Supabase session.
    let authed = false;
    const token = c.req.header("X-Designer-Token");
    if (token) {
      const session = await kv.get(`designer-session:${token}`);
      if (isAuthorizedForSlug(session, slug)) authed = true;
    }
    if (!authed) {
      const adminCheck = await requireDebugAdmin(c);
      if (adminCheck.ok) authed = true;
    }
    if (!authed) return c.json({ error: "Auth required" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [designerRes, sectionsRes] = await Promise.all([
      supabase.from("designers").select("*").eq("slug", slug).single(),
      supabase.from("designer_sections").select("*").eq("slug", slug),
    ]);

    const designer = designerRes.data;
    const sections = sectionsRes.data || [];

    // Build response matching the shape expected by DesignerProfile
    const sectionMap: Record<string, any> = {};
    for (const s of sections) {
      sectionMap[s.section] = s.data;
    }

    // Section rows override data column, but fall back to data column values
    // (e.g. pipeline-synced businessInfo lives in designers.data until manually edited)
    const d = designer?.data || {};
    return c.json({
      data: {
        ...d,
        team: sectionMap.team || d.team || [],
        projects: sectionMap.projects || d.projects || [],
        caseStudies: sectionMap.casestudies || d.caseStudies || [],
        reviews: sectionMap.reviews || d.reviews || [],
        latestReviews: sectionMap.latestreviews || d.latestReviews || [],
        serviceArea: sectionMap.servicearea || d.serviceArea || {},
        businessInfo: sectionMap.businessinfo || d.businessInfo || [],
      },
    });
  } catch (err) {
    console.log("Unexpected error in GET /designer-profile-data:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/make-server-4808de5e/designer-profile-data/:slug/:section", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");

    // Auth: portal designer-token OR admin Supabase session (X-User-Token).
    let authed = false;
    const designerToken = c.req.header("X-Designer-Token");
    if (designerToken) {
      const session = await kv.get(`designer-session:${designerToken}`);
      if (isAuthorizedForSlug(session, slug)) authed = true;
    }
    if (!authed) {
      const adminCheck = await requireDebugAdmin(c);
      if (adminCheck.ok) authed = true;
    }
    if (!authed) return c.json({ error: "Auth required" }, 401);

    const section = c.req.param("section");
    const allowedSections = ["profile", "team", "projects", "casestudies", "reviews", "latestreviews", "servicearea", "businessinfo"];
    if (!allowedSections.includes(section)) return c.json({ error: "Invalid section" }, 400);

    const body = await c.req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (section === "profile") {
      // Upsert designers table main data column
      const { data: existing } = await supabase.from("designers").select("data, name").eq("slug", slug).maybeSingle();
      const mergedData: any = { ...(existing?.data || {}) };
      // Deep-merge top-level objects (images, stats, coverProject, btoPackage, trustedSince, etc.)
      for (const [key, val] of Object.entries(body.data || {})) {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          mergedData[key] = { ...(mergedData[key] || {}), ...(val as any) };
        } else {
          mergedData[key] = val;
        }
      }
      mergedData.slug = slug;
      mergedData.updatedAt = new Date().toISOString();
      const resolvedName = body.data?.name || existing?.name || existing?.data?.name || slug;
      const { error: upsertError } = await supabase
        .from("designers")
        .upsert(
          { slug, name: resolvedName, data: mergedData, updated_at: new Date().toISOString() },
          { onConflict: "slug" },
        );
      if (upsertError) {
        console.log("Designer profile upsert error:", upsertError);
        return c.json({ error: upsertError.message }, 500);
      }

    } else {
      // Upsert into designer_sections table
      await saveDesignerSection(slug, section, body.data);
    }

    console.log(`Updated designer profile data: ${slug}/${section}`);
    return c.json({ success: true, slug, section });
  } catch (err) {
    console.log("Unexpected error in PUT /designer-profile-data:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// DESIGNER DASHBOARD AUTH & INQUIRIES
// =============================================

app.post("/make-server-4808de5e/designer-login", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);

    // Brute force protection
    const lockout = checkLoginLockout(ip);
    if (lockout.locked) {
      securityLog("designer_login_lockout", "warn", ip, "/designer-login");
      return c.json({ error: `Too many failed attempts. Try again in ${Math.ceil(lockout.remainingMs! / 60000)} minutes.` }, 429);
    }

    const body = await c.req.json();
    const email = sanitizeString(body.email || "", 200).toLowerCase();
    const password = body.password || "";

    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);

    // Sign in via Supabase Auth
    const anonSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData?.user) {
      recordFailedLogin(ip);
      console.log(`Designer login failed for: [REDACTED] — ${signInError?.message || "no user"}`);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify this user has designer role
    const userMeta = signInData.user.user_metadata;
    if (!userMeta?.role || userMeta.role !== "designer") {
      console.log(`Login rejected for ${email} — not a designer (role: ${userMeta?.role})`);
      return c.json({ error: "This account is not a designer account" }, 403);
    }

    const designerSlug = userMeta.designerSlug;
    if (!designerSlug) {
      return c.json({ error: "Designer slug not found in account metadata" }, 500);
    }

    const profile = await getDesignerProfile(designerSlug);
    if (!profile) return c.json({ error: "Designer profile not found" }, 404);

    const sessionToken = crypto.randomUUID();
    await kv.set(`designer-session:${sessionToken}`, { slug: designerSlug, email, userId: signInData.user.id, createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    clearFailedLogins(ip);
    console.log(`Designer logged in: ${designerSlug}`);
    return c.json({ success: true, token: sessionToken, slug: designerSlug, profile: { name: profile.name, logo: profile.logo } });
  } catch (err) {
    console.log("Unexpected error in POST /designer-login:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/designer-credentials", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const body = await c.req.json();
    const { slug, email, password, setupCode } = body;
    const adminCode = Deno.env.get("ADMIN_SETUP_CODE");
    if (!adminCode || setupCode !== adminCode) return c.json({ error: "Invalid setup code" }, 403);
    if (!slug || !email || !password) return c.json({ error: "slug, email, and password are required" }, 400);
    if (!isValidEmail(email)) return c.json({ error: "Invalid email format" }, 400);
    if (typeof password !== "string" || password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const cleanEmail = sanitizeString(email, 200).toLowerCase();
    const cleanSlug = sanitizeString(slug, 100).replace(/[^a-zA-Z0-9_-]/g, "");

    // Verify the designer profile exists
    const designerProfile = await getDesignerProfile(cleanSlug);
    if (!designerProfile) return c.json({ error: `Designer profile '${cleanSlug}' not found. The slug must match an existing designer.` }, 404);

    // Create or update a real Supabase Auth user
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let userId: string;

    // Try to create a new user first
    const { data, error } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      user_metadata: { role: "designer", designerSlug: cleanSlug },
      email_confirm: true,
    });

    if (error) {
      // If user already exists, find them and update their metadata
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        console.log(`User ${cleanEmail} already exists, updating metadata to designer role...`);
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) return c.json({ error: "Failed to look up existing user: " + listError.message }, 500);
        const existingUser = users?.find((u: any) => u.email === cleanEmail);
        if (!existingUser) return c.json({ error: "User exists but could not be found" }, 500);

        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password,
          user_metadata: { ...existingUser.user_metadata, role: "designer", designerSlug: cleanSlug },
        });
        if (updateError) {
          console.log(`Failed to update user ${cleanEmail}:`, updateError.message);
          return c.json({ error: `Failed to update auth user: ${updateError.message}` }, 400);
        }
        userId = existingUser.id;
        console.log(`Updated existing user ${cleanEmail} to designer role for ${cleanSlug}`);
      } else {
        console.log(`Failed to create Supabase Auth user for designer ${cleanSlug}:`, error.message);
        return c.json({ error: `Failed to create auth user: ${error.message}` }, 400);
      }
    } else {
      userId = data.user.id;
    }

    // Also store the slug mapping in KV for quick lookup
    await kv.set(`designer-auth:${cleanEmail}`, { slug: cleanSlug, userId, email: cleanEmail, createdAt: new Date().toISOString() });
    console.log(`Designer credentials set for: ${cleanSlug} (${cleanEmail}) — Supabase Auth user: ${userId}`);
    return c.json({ success: true, slug: cleanSlug, email: cleanEmail, userId });
  } catch (err) {
    console.log("Unexpected error in POST /designer-credentials:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/make-server-4808de5e/designer-session", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token || !isValidToken(token)) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`designer-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);
    if (session.isSuper) {
      return c.json({ valid: true, isSuper: true });
    }
    const profile = await getDesignerProfile(session.slug);
    return c.json({ valid: true, slug: session.slug, email: session.email, profile: profile ? { name: profile.name, logo: profile.logo, companyName: profile.companyName } : null });
  } catch (err) {
    console.log("Unexpected error in GET /designer-session:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/designer-logout", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (token) await kv.del(`designer-session:${token}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/make-server-4808de5e/designer-inquiries/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`designer-session:${token}`);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!isAuthorizedForSlug(session, slug)) return c.json({ error: "Forbidden" }, 403);
    const inquiries = await getDesignerSection(slug, "inquiries") || [];
    return c.json({ data: inquiries });
  } catch (err) {
    console.log("Unexpected error in GET /designer-inquiries:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Designer profile view tracking. Public endpoint — bumps a per-slug counter
// when someone opens a designer profile. Same-IP visits within a calendar day
// are deduped so reloads don't inflate the count.
// KV layout:
//   designer-views:<slug>     → { total: number, byDay: { "YYYY-MM-DD": n } }
//   designer-view-dedupe:<slug>:<ip>:<YYYY-MM-DD> → 1
app.post("/make-server-4808de5e/designer-views/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "scrape-profile");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);

    const today = new Date().toISOString().slice(0, 10);
    const dedupeKey = `designer-view-dedupe:${slug}:${ip}:${today}`;
    const seen = await kv.get(dedupeKey);
    if (seen) return c.json({ success: true, deduped: true });

    const counterKey = `designer-views:${slug}`;
    const current: { total?: number; byDay?: Record<string, number> } = (await kv.get(counterKey)) || {};
    const byDay = current.byDay || {};
    byDay[today] = (byDay[today] || 0) + 1;
    const total = (current.total || 0) + 1;
    await kv.set(counterKey, { total, byDay });
    await kv.set(dedupeKey, 1);

    return c.json({ success: true, total });
  } catch (err) {
    console.log("Unexpected error in POST /designer-views:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Admin analytics — visits and lead-form submissions per designer.
app.get("/make-server-4808de5e/admin/designer-analytics", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const sb = getDesignerSupabase();
    const [designersRes, sectionsRes] = await Promise.all([
      sb.from("designers").select("slug, name, data"),
      sb.from("designer_sections").select("slug, section, data").eq("section", "inquiries"),
    ]);
    if (designersRes.error) return c.json({ error: designersRes.error.message }, 500);

    const inquiriesBySlug = new Map<string, any[]>();
    for (const row of (sectionsRes.data || []) as any[]) {
      if (Array.isArray(row.data)) inquiriesBySlug.set(row.slug, row.data);
    }

    const designers = (designersRes.data || []).filter((d: any) => !d.data?.deletedAt);
    const today = new Date().toISOString().slice(0, 10);
    const last7Cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const last30Cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const rows = await Promise.all(designers.map(async (d: any) => {
      const slug: string = d.slug;
      const views: { total?: number; byDay?: Record<string, number> } = (await kv.get(`designer-views:${slug}`)) || {};
      const byDay = views.byDay || {};
      const totalViews = views.total || 0;
      let views7 = 0, views30 = 0;
      for (const [day, n] of Object.entries(byDay)) {
        if (day >= last7Cutoff) views7 += n;
        if (day >= last30Cutoff) views30 += n;
      }
      const inquiries = inquiriesBySlug.get(slug) || [];
      const totalInquiries = inquiries.length;
      let inquiries7 = 0, inquiries30 = 0;
      for (const i of inquiries) {
        const day = String(i?.createdAt || "").slice(0, 10);
        if (!day) continue;
        if (day >= last7Cutoff) inquiries7++;
        if (day >= last30Cutoff) inquiries30++;
      }
      return {
        slug,
        name: d.data?.name || d.name || slug,
        totalViews,
        views7,
        views30,
        totalInquiries,
        inquiries7,
        inquiries30,
        conversion: totalViews > 0 ? totalInquiries / totalViews : 0,
      };
    }));

    rows.sort((a, b) => b.totalViews - a.totalViews);

    const summary = rows.reduce((acc, r) => ({
      totalViews: acc.totalViews + r.totalViews,
      totalInquiries: acc.totalInquiries + r.totalInquiries,
      views7: acc.views7 + r.views7,
      inquiries7: acc.inquiries7 + r.inquiries7,
      views30: acc.views30 + r.views30,
      inquiries30: acc.inquiries30 + r.inquiries30,
    }), { totalViews: 0, totalInquiries: 0, views7: 0, inquiries7: 0, views30: 0, inquiries30: 0 });

    return c.json({ asOf: today, summary, rows });
  } catch (err: any) {
    console.log("Unexpected error in GET /admin/designer-analytics:", err);
    return c.json({ error: String(err?.message || err).slice(0, 200) }, 500);
  }
});

app.post("/make-server-4808de5e/designer-inquiry/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "quote-request");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!slug) return c.json({ error: "Invalid slug" }, 400);

    const body = await c.req.json();
    const inquiry = {
      id: crypto.randomUUID(),
      name: sanitizeString(body.name || "", 100),
      email: sanitizeString(body.email || "", 200).toLowerCase(),
      phone: sanitizeString(body.phone || "", 20),
      propertyType: body.propertyType || "",
      budget: body.budget || "",
      // QuoteCard sends `keyCollection`; legacy callers send `timeline` —
      // accept either so the field always lands on the inquiry record + Zapier.
      timeline: sanitizeString(body.keyCollection || body.timeline || "", 60),
      message: sanitizeString(body.message || "", 2000),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const existing = await getDesignerSection(slug, "inquiries") || [];
    existing.unshift(inquiry);
    if (existing.length > 200) existing.length = 200;
    await saveDesignerSection(slug, "inquiries", existing);

    // Fire-and-forget Zapier forward — keeps the response fast even if
    // Zapier is slow / down. The KV record above is the source of truth.
    const profile = await getDesignerProfile(slug).catch(() => null);
    const firmName = profile?.name || slug;
    fetch(ZAPIER_WEBHOOKS["designer-profile-lead"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "First Name": inquiry.name,
        "Contact Phone": inquiry.phone,
        "Email Address": inquiry.email,
        "Property Type": inquiry.propertyType,
        "Renovation Budget": inquiry.budget,
        "Key Collection": inquiry.timeline,
        "Message": inquiry.message,
        "Designer Firm": firmName,
        "Designer Slug": slug,
        "Source": "Designer Profile",
        "Submitted At": inquiry.createdAt,
      }),
    }).catch((err) => console.log("designer-profile-lead zapier forward failed:", err));

    console.log(`New inquiry for designer ${slug} from ${inquiry.name}`);
    return c.json({ success: true, id: inquiry.id });
  } catch (err) {
    console.log("Unexpected error in POST /designer-inquiry:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/make-server-4808de5e/designer-inquiries/:slug/:inquiryId", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`designer-session:${token}`);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!isAuthorizedForSlug(session, slug)) return c.json({ error: "Forbidden" }, 403);

    const inquiryId = sanitizeKvKey(c.req.param("inquiryId"), 64);
    if (!inquiryId) return c.json({ error: "Invalid inquiry ID" }, 400);
    const body = await c.req.json();
    const inquiries = await getDesignerSection(slug, "inquiries") || [];
    const idx = inquiries.findIndex((i: any) => i.id === inquiryId);
    if (idx === -1) return c.json({ error: "Inquiry not found" }, 404);
    inquiries[idx] = { ...inquiries[idx], ...body, updatedAt: new Date().toISOString() };
    await saveDesignerSection(slug, "inquiries", inquiries);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/make-server-4808de5e/designer-inquiries/:slug/:inquiryId", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`designer-session:${token}`);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!isAuthorizedForSlug(session, slug)) return c.json({ error: "Forbidden" }, 403);

    const inquiryId = sanitizeKvKey(c.req.param("inquiryId"), 64);
    if (!inquiryId) return c.json({ error: "Invalid inquiry ID" }, 400);
    const inquiries = await getDesignerSection(slug, "inquiries") || [];
    const filtered = inquiries.filter((i: any) => i.id !== inquiryId);
    await saveDesignerSection(slug, "inquiries", filtered);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Full designer dashboard data fetch
app.get("/make-server-4808de5e/designer-dashboard/:slug", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Designer-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`designer-session:${token}`);
    const slug = sanitizeString(c.req.param("slug"), 100).replace(/[^a-zA-Z0-9_-]/g, "");
    if (!isAuthorizedForSlug(session, slug)) return c.json({ error: "Forbidden" }, 403);

    const { profile, sections } = await getDesignerWithSections(slug);

    return c.json({
      data: {
        ...(profile || {}),
        team: sections.team || [],
        projects: sections.projects || [],
        caseStudies: sections.casestudies || [],
        reviews: sections.reviews || [],
        latestReviews: sections.latestreviews || [],
        serviceArea: sections.servicearea || {},
        businessInfo: sections.businessinfo || [],
        inquiries: sections.inquiries || [],
      },
    });
  } catch (err) {
    console.log("Unexpected error in GET /designer-dashboard:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// =============================================
// HOMEOWNER AUTH & PROFILE
// =============================================

// Homeowner Signup — creates Supabase Auth user with role: "homeowner"
app.post("/make-server-4808de5e/homeowner-signup", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "signup");
    if (!rl.allowed) {
      securityLog("signup_rate_limited", "warn", ip, "/homeowner-signup");
      return c.json({ error: "Too many signup attempts. Please try again later." }, 429);
    }
    // Bot detection
    const ua = c.req.header("user-agent");
    if (isSuspiciousUA(ua)) {
      securityLog("signup_bot_detected", "warn", ip, "/homeowner-signup", { ua: ua?.slice(0, 100) });
      return c.json({ error: "Request blocked" }, 403);
    }

    const body = await c.req.json();
    const email = sanitizeString(body.email || "", 200).toLowerCase();
    const password = body.password || "";
    const name = sanitizeString(body.name || "", 100);
    const phone = sanitizeString(body.phone || "", 20);

    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);
    if (!isValidEmail(email)) return c.json({ error: "Invalid email format" }, 400);
    if (typeof password !== "string" || password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { role: "homeowner", name, phone },
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return c.json({ error: "An account with this email already exists. Please sign in." }, 409);
      }
      return c.json({ error: error.message }, 400);
    }

    // Create homeowner profile in KV
    const userId = data.user.id;
    const profile = {
      userId,
      name,
      email,
      phone,
      createdAt: new Date().toISOString(),
      house: {},
      inquiries: [],
    };
    await kv.set(`homeowner:${userId}`, profile);

    // Auto-login: create session token
    const sessionToken = crypto.randomUUID();
    await kv.set(`homeowner-session:${sessionToken}`, { userId, email, createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    securityLog("signup_success", "info", ip, "/homeowner-signup", { userId });
    return c.json({ success: true, token: sessionToken, userId, profile: { name, email } });
  } catch (err) {
    securityLog("signup_error", "error", getClientIp(c), "/homeowner-signup", { error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Login
app.post("/make-server-4808de5e/homeowner-login", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "login");
    if (!rl.allowed) {
      securityLog("login_rate_limited", "warn", ip, "/homeowner-login");
      return c.json({ error: "Too many requests" }, 429);
    }

    // Brute-force protection
    const lockout = checkLoginLockout(ip);
    if (lockout.locked) {
      securityLog("login_locked_out", "warn", ip, "/homeowner-login", { reason: "too_many_failed_attempts" });
      return c.json({ error: "Too many failed login attempts. Please try again in 15 minutes." }, 429);
    }

    const body = await c.req.json();
    const email = sanitizeString(body.email || "", 200).toLowerCase();
    const password = body.password || "";

    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);

    const anonSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData?.user) {
      recordFailedLogin(ip);
      securityLog("login_failed", "warn", ip, "/homeowner-login", { email, reason: signInError?.message || "invalid_credentials" });
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const userMeta = signInData.user.user_metadata;
    if (userMeta?.role && userMeta.role !== "homeowner") {
      securityLog("login_wrong_role", "warn", ip, "/homeowner-login", { email, role: userMeta.role });
      return c.json({ error: "This account is not a homeowner account" }, 403);
    }

    const userId = signInData.user.id;

    // Ensure homeowner profile exists in KV
    let profile = await kv.get(`homeowner:${userId}`);
    if (!profile) {
      profile = {
        userId,
        name: userMeta?.name || "",
        email,
        phone: userMeta?.phone || "",
        createdAt: new Date().toISOString(),
        house: {},
        inquiries: [],
      };
      await kv.set(`homeowner:${userId}`, profile);
    }

    const sessionToken = crypto.randomUUID();
    await kv.set(`homeowner-session:${sessionToken}`, { userId, email, createdAt: new Date().toISOString(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

    clearFailedLogins(ip);
    securityLog("login_success", "info", ip, "/homeowner-login", { userId });
    return c.json({ success: true, token: sessionToken, userId, profile: { name: profile.name, email: profile.email } });
  } catch (err) {
    const ip = getClientIp(c);
    securityLog("login_error", "error", ip, "/homeowner-login", { error: String(err) });
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Session Check
app.get("/make-server-4808de5e/homeowner-session", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token || !isValidToken(token)) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);
    const profile = await kv.get(`homeowner:${session.userId}`);
    return c.json({ valid: true, userId: session.userId, email: session.email, profile: profile || null });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Logout
app.post("/make-server-4808de5e/homeowner-logout", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (token && isValidToken(token)) await kv.del(`homeowner-session:${token}`);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Profile — GET full profile
app.get("/make-server-4808de5e/homeowner-profile", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);

    const userId = session.userId;

    // Fetch user projects list (cached per-user) and profile+inquiries+renderIds in parallel
    const [profile, inquiries, renderIds, userFp3dProjects] = await Promise.all([
      kv.get(`homeowner:${userId}`),
      kv.get(`homeowner:${userId}:inquiries`),
      kv.get(`user-renders:${userId}`),
      fp3dDb.listUserProjects(userId),
    ]);

    // Fetch renders in parallel (not sequential!) with cached thumbnail URLs
    const rawRenderIds = ((renderIds as string[]) || []).slice(0, 20);
    // Step 1: resolve render-id-map in parallel
    const taskIds = await Promise.all(rawRenderIds.map((rid: string) => kv.get(`render-id-map:${rid}`)));
    // Step 2: fetch editor-render records in parallel
    const validTaskIds = taskIds.filter(Boolean) as string[];
    const records = await Promise.all(validTaskIds.map((tid: string) => kv.get(`editor-render:${tid}`)));

    // Step 3: build render list using cached thumbnails (no signed URL generation on every load)
    const supabaseForThumbs = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const renders = await Promise.all(
      records.filter(Boolean).map(async (record: any) => {
        const fullUrl = record.storageResultUrl || record.resultUrl || null;
        let thumbnailUrl = record.cachedThumbnailUrl || null;
        const thumbExpiry = record.thumbUrlExpiry || 0;
        const now = Date.now();

        // Only generate new thumbnail URL if not cached or expired (cache for 25 days)
        if (!thumbnailUrl || now > thumbExpiry) {
          if (record.status === "completed" && record.renderId && record.userId) {
            try {
              for (const ext of ["png", "jpg"]) {
                const resultPath = `editor-renders/${record.userId}/${record.renderId}-result.${ext}`;
                const { data: thumbData } = await supabaseForThumbs.storage
                  .from(BUCKET_NAME)
                  .createSignedUrl(resultPath, 30 * 24 * 3600, {
                    transform: { width: 400, height: 300, resize: "cover", quality: 60 },
                  });
                if (thumbData?.signedUrl) {
                  thumbnailUrl = thumbData.signedUrl;
                  // Cache the thumbnail URL in the record (expires in 25 days)
                  await kv.set(`editor-render:${record.taskId}`, {
                    ...record,
                    cachedThumbnailUrl: thumbnailUrl,
                    thumbUrlExpiry: now + 25 * 24 * 3600 * 1000,
                  });
                  break;
                }
              }
            } catch { thumbnailUrl = fullUrl; }
          }
        }

        return {
          renderId: record.renderId, taskId: record.taskId, projectId: record.projectId,
          projectName: record.projectName, status: record.status,
          resultUrl: fullUrl,
          thumbnailUrl: thumbnailUrl || fullUrl,
          createdAt: record.createdAt, completedAt: record.completedAt,
        };
      })
    );

    return c.json({ data: { ...(profile || {}), inquiries: inquiries || [], fp3dProjects: userFp3dProjects, fp3dRenders: renders } });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Profile — PUT update profile/house info
app.put("/make-server-4808de5e/homeowner-profile/:section", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);

    const section = c.req.param("section");
    const body = await c.req.json();
    const userId = session.userId;
    const profile = await kv.get(`homeowner:${userId}`) || {};

    if (section === "avatar") {
      const avatar = body.avatar;
      if (!avatar || typeof avatar !== "string") return c.json({ error: "No avatar provided" }, 400);
      // Accept data URLs up to ~2MB
      if (avatar.length > 2_800_000) return c.json({ error: "Image too large (max 2MB)" }, 400);
      profile.avatar = avatar;
    } else if (section === "personal") {
      profile.name = sanitizeString(body.name || profile.name || "", 100);
      profile.phone = sanitizeString(body.phone || profile.phone || "", 20);
      profile.address = sanitizeString(body.address || profile.address || "", 300);
    } else if (section === "house") {
      profile.house = {
        propertyType: sanitizeString(body.propertyType || "", 50),
        size: sanitizeString(body.size || "", 50),
        rooms: sanitizeString(body.rooms || "", 50),
        bathrooms: sanitizeString(body.bathrooms || "", 50),
        yearBuilt: sanitizeString(body.yearBuilt || "", 10),
        address: sanitizeString(body.address || "", 300),
        postalCode: sanitizeString(body.postalCode || "", 10),
        notes: sanitizeString(body.notes || "", 1000),
        budget: sanitizeString(body.budget || "", 50),
        timeline: sanitizeString(body.timeline || "", 100),
      };
    } else if (section === "onboarding") {
      // Initial new-account onboarding — captures intent + design preferences,
      // merged into the existing house section so downstream views keep working.
      const yn = (v: any) => (v === "yes" || v === "no" ? v : "");
      const styles = Array.isArray(body.designStyles)
        ? body.designStyles.slice(0, 16).map((s: any) => sanitizeString(String(s || ""), 40)).filter(Boolean)
        : [];
      profile.house = {
        ...(profile.house || {}),
        propertyType: sanitizeString(body.propertyType || profile.house?.propertyType || "", 50),
        propertyStatus: sanitizeString(body.propertyStatus || profile.house?.propertyStatus || "", 30),
        renovating: yn(body.renovating),
        hasKeys: yn(body.hasKeys),
        designStyles: styles,
        budget: sanitizeString(body.budget || profile.house?.budget || "", 50),
      };
      profile.onboardedAt = new Date().toISOString();
    } else {
      return c.json({ error: "Invalid section" }, 400);
    }

    profile.updatedAt = new Date().toISOString();
    await kv.set(`homeowner:${userId}`, profile);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Homeowner Inquiries — GET all inquiries the homeowner has sent
app.get("/make-server-4808de5e/homeowner-inquiries", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);

    const inquiries = await kv.get(`homeowner:${session.userId}:inquiries`) || [];
    return c.json({ data: inquiries });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── EXPLORE PROJECTS (public feed of all designer projects) ─────
let exploreCache: { data: any[]; ts: number } | null = null;
const EXPLORE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.get("/make-server-4808de5e/explore-projects", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    // Use cache if fresh
    if (exploreCache && Date.now() - exploreCache.ts < EXPLORE_CACHE_TTL) {
      return c.json({ data: exploreCache.data });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch active designers from the canonical `designers` table
    const { data: designerRows } = await supabase
      .from("designers")
      .select("slug, name, data");

    const activeDesigners: Record<string, any> = {};
    for (const d of designerRows || []) {
      const data: any = d.data || {};
      if (data.deletedAt || data.deleted || data.hidden || data.suspended) continue;
      // Only include designers explicitly marked active (set via /admin/bulk-set-active)
      if (data.active !== true) continue;
      const name = data.name || d.name;
      if (!name) continue;
      activeDesigners[d.slug] = {
        slug: d.slug,
        name,
        logo: data.images?.logo || data.logo || data.logoUrl || "",
        verified: !!data.verified,
      };
    }

    // Fetch all projects from dedicated row-per-project table
    const { data: projectRows } = await supabase
      .from("designer_projects")
      .select("id, designer_slug, title, cost, year, property_type, style, images")
      .order("submitted_at", { ascending: false })
      .limit(500);

    const allProjects: any[] = [];
    for (const p of projectRows || []) {
      const designer = activeDesigners[p.designer_slug];
      if (!designer) continue;
      const images = Array.isArray(p.images) ? p.images : [];
      const image = images.find((u: any) => typeof u === "string" && u.startsWith("http")) || "";
      if (!image) continue;
      const meta = [p.property_type, p.cost, p.year].filter(Boolean).join(" · ");
      allProjects.push({
        projectId: p.id,
        title: p.title || "Untitled Project",
        image,
        meta,
        propertyType: p.property_type || "",
        budget: p.cost || "",
        year: p.year || "",
        designerName: designer.name,
        designerSlug: designer.slug,
        designerLogo: designer.logo,
        verified: designer.verified,
        style: p.style || p.property_type || "",
      });
    }

    // Shuffle for variety
    for (let i = allProjects.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allProjects[i], allProjects[j]] = [allProjects[j], allProjects[i]];
    }

    exploreCache = { data: allProjects, ts: Date.now() };
    return c.json({ data: allProjects });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── SAVED PROJECTS (homeowner bookmarks) ────────────────────────
app.get("/make-server-4808de5e/homeowner-saved-projects", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);
    const saved = await kv.get(`homeowner-saved:${session.userId}`) || [];
    return c.json({ data: saved });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/make-server-4808de5e/homeowner-saved-projects", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);
    const body = await c.req.json();
    const projectId = sanitizeString(body.projectId || "", 200);
    if (!projectId) return c.json({ error: "projectId required" }, 400);
    const saved: any[] = await kv.get(`homeowner-saved:${session.userId}`) || [];
    if (saved.some((s: any) => s.projectId === projectId)) {
      return c.json({ message: "Already saved" });
    }
    saved.push({
      projectId,
      title: sanitizeString(body.title || "", 200),
      image: sanitizeString(body.image || "", 1000),
      designerName: sanitizeString(body.designerName || "", 200),
      designerSlug: sanitizeString(body.designerSlug || "", 200),
      meta: sanitizeString(body.meta || "", 200),
      savedAt: new Date().toISOString(),
    });
    await kv.set(`homeowner-saved:${session.userId}`, saved);
    return c.json({ message: "Saved", data: saved });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/make-server-4808de5e/homeowner-saved-projects/:projectId", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);
    const projectId = sanitizeKvKey(c.req.param("projectId"), 100);
    if (!projectId) return c.json({ error: "Invalid project ID" }, 400);
    let saved: any[] = await kv.get(`homeowner-saved:${session.userId}`) || [];
    saved = saved.filter((s: any) => s.projectId !== projectId);
    await kv.set(`homeowner-saved:${session.userId}`, saved);
    return c.json({ message: "Removed", data: saved });
  } catch (err) {
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ─── MOOD BOARD IMAGE UPLOAD ─────────────────────────────────────
app.post("/mood-board-upload", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session: any = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);

    const userEmail = session.email || session.userId || "anonymous";
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return c.json({ error: "No file provided" }, 400);

    // Validate file type
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return c.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }, 400);
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "File too large. Max 10MB." }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${userEmail}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("mood-board-images")
      .upload(path, arrayBuffer, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      return c.json({ error: uploadErr.message }, 500);
    }

    const { data } = supabaseAdmin.storage
      .from("mood-board-images")
      .getPublicUrl(path);

    return c.json({ url: data.publicUrl });
  } catch (err: any) {
    return c.json({ error: err?.message || "Upload failed" }, 500);
  }
});

// ─── MOOD BOARD IMAGE UPLOAD FROM URL ────────────────────────────
app.post("/mood-board-upload-url", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const token = c.req.header("X-Homeowner-Token");
    if (!token) return c.json({ error: "No session token" }, 401);
    const session: any = await kv.get(`homeowner-session:${token}`);
    if (!session) return c.json({ error: "Invalid session" }, 401);

    const userEmail = session.email || session.userId || "anonymous";
    const { imageUrl } = await c.req.json();
    if (!imageUrl) return c.json({ error: "No imageUrl provided" }, 400);

    // Skip if already a Supabase storage URL
    if (imageUrl.includes("supabase.co/storage")) {
      return c.json({ url: imageUrl });
    }

    // Fetch the image
    const res = await fetch(imageUrl);
    if (!res.ok) return c.json({ url: imageUrl }); // Fallback to original

    const blob = await res.blob();
    const contentType = blob.type || "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${userEmail}/${fileName}`;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const arrayBuffer = await blob.arrayBuffer();
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("mood-board-images")
      .upload(path, arrayBuffer, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (uploadErr) {
      return c.json({ url: imageUrl }); // Fallback to original
    }

    const { data } = supabaseAdmin.storage
      .from("mood-board-images")
      .getPublicUrl(path);

    return c.json({ url: data.publicUrl });
  } catch {
    return c.json({ error: "Upload failed" }, 500);
  }
});

// =============================================
// DEBUG & MONITORING — admin-only (gated to DEBUG_ADMIN_EMAIL)
// =============================================

// Comma-separated allowlist. Either DEBUG_ADMIN_EMAIL (single) or the default below may be overridden.
const DEBUG_ADMIN_EMAILS = new Set(
  (Deno.env.get("DEBUG_ADMIN_EMAIL") || "raemerdr@gmail.com,team@orangenetworkstudios.com")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

// Resolve email + user-id from the Supabase user token, then ensure email matches DEBUG_ADMIN_EMAIL.
async function requireDebugAdmin(c: any): Promise<{ ok: true; userId: string; email: string } | { ok: false; status: number; msg: string }> {
  const userToken = c.req.header("X-User-Token");
  if (!userToken) return { ok: false, status: 401, msg: "Missing X-User-Token" };
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error } = await supabase.auth.getUser(userToken);
    if (error || !user?.id || !user.email) {
      return { ok: false, status: 401, msg: "Invalid session" };
    }
    const email = user.email.toLowerCase().trim();
    if (!DEBUG_ADMIN_EMAILS.has(email)) {
      return { ok: false, status: 403, msg: "Access denied" };
    }
    // Belt-and-suspenders: require the admin flag. Skipped for allowlisted emails
    // so a user on the allowlist can always access admin tools without a manual
    // fp3dDb promote step.
    const adminFlag = await fp3dDb.getAdmin(user.id);
    if (!adminFlag || adminFlag.isAdmin !== true) {
      // Auto-promote first time they hit an admin endpoint.
      try { await fp3dDb.upsertAdmin(user.id, { isAdmin: true, email, promotedAt: new Date().toISOString(), promotedBy: "allowlist-auto" }); } catch {}
    }
    return { ok: true, userId: user.id, email };
  } catch (err) {
    return { ok: false, status: 500, msg: String(err).slice(0, 200) };
  }
}

// --- Public: receive client-side errors from any visitor's browser ---
// --- Public: live homeowner count from ons-portal ---
app.get("/make-server-4808de5e/homeowner-count", async (c) => {
  try {
    // Check KV cache first (5-minute TTL)
    const cacheKey = "homeowner-count-cache";
    const cached = await kv.get(cacheKey);
    if (cached && cached.ts && Date.now() - cached.ts < 5 * 60 * 1000) {
      return c.json({ count: cached.count, cached: true });
    }

    const portalUrl = Deno.env.get("ONS_PORTAL_URL");
    const portalKey = Deno.env.get("ONS_PORTAL_SERVICE_ROLE_KEY");
    if (!portalUrl || !portalKey) {
      return c.json({ count: 3214, cached: false, fallback: true });
    }

    const portalClient = createClient(portalUrl, portalKey);
    const { count, error } = await portalClient
      .from("at_homeowner_distribution")
      .select("*", { count: "exact", head: true });

    if (error || count === null) {
      console.log("homeowner-count error:", error?.message);
      // Return cached value if available, else fallback
      if (cached) return c.json({ count: cached.count, cached: true });
      return c.json({ count: 3214, cached: false, fallback: true });
    }

    // Cache the result
    await kv.set(cacheKey, { count, ts: Date.now() });
    return c.json({ count, cached: false });
  } catch (err) {
    console.log("homeowner-count error:", err);
    return c.json({ count: 3214, cached: false, fallback: true });
  }
});

app.post("/make-server-4808de5e/client-error", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ ok: true, throttled: true });

    const body = await c.req.json().catch(() => ({}));
    const message = sanitizeString(String(body.message || "").slice(0, 500), 500);
    const stack = sanitizeString(String(body.stack || "").slice(0, 2000), 2000);
    const url = sanitizeString(String(body.url || "").slice(0, 300), 300);
    const userAgent = sanitizeString(String(body.userAgent || "").slice(0, 250), 250);
    const clientTs = sanitizeString(String(body.ts || "").slice(0, 40), 40);

    if (!message) return c.json({ ok: true, skipped: "empty" });

    const key = `error-log:${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    await kv.set(key, {
      source: "client",
      severity: "error",
      event: "browser_error",
      ip,
      route: url,
      message,
      stack,
      userAgent,
      clientTs,
      ts: new Date().toISOString(),
    });

    // Fire-and-forget push to ntfy (skip known noise + dedupe 5 min)
    sendNtfyError({ message, url, userAgent }).catch(() => {});

    return c.json({ ok: true });
  } catch (err) {
    console.log("client-error endpoint error:", err);
    return c.json({ ok: false }, 500);
  }
});

// --- Admin: get recent error logs ---
app.get("/make-server-4808de5e/debug/logs", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || "100", 10) || 100, 500);
    const severityFilter = c.req.query("severity") || "";
    const sourceFilter = c.req.query("source") || "";
    const entries: any[] = await kv.getByPrefix("error-log:");
    let filtered = entries;
    if (severityFilter) filtered = filtered.filter((e) => e?.severity === severityFilter);
    if (sourceFilter) filtered = filtered.filter((e) => e?.source === sourceFilter);
    // Sort newest first by ts
    filtered.sort((a, b) => String(b?.ts || "").localeCompare(String(a?.ts || "")));
    return c.json({ logs: filtered.slice(0, limit), total: filtered.length });
  } catch (err) {
    return c.json({ error: "Failed to load logs: " + String(err).slice(0, 200) }, 500);
  }
});

// --- Admin: recent zapier activity ---
app.get("/make-server-4808de5e/debug/zapier-activity", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const limit = Math.min(parseInt(c.req.query("limit") || "100", 10) || 100, 500);
    const entries: any[] = await kv.getByPrefix("zapier-log:");
    entries.sort((a, b) => String(b?.ts || "").localeCompare(String(a?.ts || "")));
    return c.json({ entries: entries.slice(0, limit), total: entries.length });
  } catch (err) {
    return c.json({ error: "Failed to load zapier activity: " + String(err).slice(0, 200) }, 500);
  }
});

// --- Admin: funnel metrics (lead counts per funnel, 24h / 7d / 30d) ---
app.get("/make-server-4808de5e/debug/funnel-metrics", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = Date.now();
    const ranges = [
      { label: "last24h", ms: 24 * 60 * 60 * 1000 },
      { label: "last7d", ms: 7 * 24 * 60 * 60 * 1000 },
      { label: "last30d", ms: 30 * 24 * 60 * 60 * 1000 },
    ];

    async function countTable(table: string, column = "created_at"): Promise<Record<string, number>> {
      const out: Record<string, number> = {};
      for (const r of ranges) {
        const since = new Date(now - r.ms).toISOString();
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .gte(column, since);
        if (error) { out[r.label] = -1; continue; }
        out[r.label] = count ?? 0;
      }
      return out;
    }

    // Count zapier hits from KV logs by hook
    async function countZapierHook(hook: string): Promise<Record<string, number>> {
      const entries: any[] = await kv.getByPrefix("zapier-log:");
      const out: Record<string, number> = {};
      for (const r of ranges) {
        const since = now - r.ms;
        out[r.label] = entries.filter((e) => e?.hook === hook && e?.ok && new Date(e.ts).getTime() >= since).length;
      }
      return out;
    }

    const funnels = await Promise.all([
      countTable("homepage_leads").then((v) => ({ name: "Homepage Hero Lead", source: "homepage_leads", ...v })),
      countTable("handshake_leads").then((v) => ({ name: "Handshake Lead", source: "handshake_leads", ...v })),
      countTable("Quote Request").then((v) => ({ name: "Quote Request", source: "Quote Request", ...v })),
      countTable("fp3d_leads").then((v) => ({ name: "Floor Plan 3D Lead", source: "fp3d_leads", ...v })),
      countZapierHook("hero-lead").then((v) => ({ name: "Zapier: hero-lead", source: "zapier", ...v })),
      countZapierHook("render-lead").then((v) => ({ name: "Zapier: render-lead", source: "zapier", ...v })),
      countZapierHook("cost-guide-lead").then((v) => ({ name: "Zapier: cost-guide-lead", source: "zapier", ...v })),
      countZapierHook("handshake-lead").then((v) => ({ name: "Zapier: handshake-lead", source: "zapier", ...v })),
    ]);

    return c.json({ funnels });
  } catch (err) {
    return c.json({ error: "Failed to load funnel metrics: " + String(err).slice(0, 200) }, 500);
  }
});

// --- Admin: per-lead-magnet metrics (counts + 14-day sparkline) ---
// Backs the "Lead Magnets" tab in the admin dashboard. Aggregates across
// every place a lead currently lands: KV (cost-guide, render-task,
// onboarding submissions, homeowner profiles), the Quote Request table,
// and the inquiries arrays nested in designer_sections. Cached for 60s
// because KV scans + table counts are expensive.
const LEAD_MAGNET_METRICS_CACHE: { at: number; data: any } = { at: 0, data: null };
const LEAD_MAGNET_METRICS_TTL_MS = 60 * 1000;

app.get("/make-server-4808de5e/admin/lead-magnet-metrics", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);

  try {
    const now = Date.now();
    if (LEAD_MAGNET_METRICS_CACHE.data && now - LEAD_MAGNET_METRICS_CACHE.at < LEAD_MAGNET_METRICS_TTL_MS) {
      return c.json({ ...LEAD_MAGNET_METRICS_CACHE.data, cached: true });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const ms24h = 24 * 60 * 60 * 1000;
    const ms7d = 7 * ms24h;
    const ms30d = 30 * ms24h;
    const SPARKLINE_DAYS = 14;

    // Bucket a list of ISO timestamps into 24h/7d/30d counts plus a
    // 14-entry per-day sparkline, oldest day first.
    function bucketize(timestamps: number[], total?: number) {
      const last24h = timestamps.filter((t) => now - t <= ms24h).length;
      const last7d = timestamps.filter((t) => now - t <= ms7d).length;
      const last30d = timestamps.filter((t) => now - t <= ms30d).length;

      const sparkline: { date: string; count: number }[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = SPARKLINE_DAYS - 1; i >= 0; i--) {
        const dayStart = today.getTime() - i * ms24h;
        const dayEnd = dayStart + ms24h;
        const count = timestamps.filter((t) => t >= dayStart && t < dayEnd).length;
        const d = new Date(dayStart);
        sparkline.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
      }

      return { total: total ?? timestamps.length, last24h, last7d, last30d, sparkline };
    }

    // Pull a timestamp out of arbitrary KV / row shapes (different magnets
    // settled on slightly different field names over time).
    function pickTs(rec: any): number | null {
      if (!rec || typeof rec !== "object") return null;
      const raw = rec.createdAt || rec.created_at || rec.ts || rec["Created Date"];
      if (!raw) return null;
      const t = new Date(String(raw)).getTime();
      return Number.isFinite(t) ? t : null;
    }

    // ── 1. Cost Guide ─────────────────────────────────────────────────
    // KV: `cost-guide:{id}` (full payload) + `cost-guide:{id}:qrId` (just a
    // string). Skip the qrId rows by requiring an object with createdAt.
    const cgEntries: any[] = await kv.getByPrefix("cost-guide:");
    const cgTimestamps = cgEntries
      .map(pickTs)
      .filter((t): t is number => t !== null);
    const costGuide = { key: "cost-guide", name: "Cost Guide", source: "kv:cost-guide:* + Quote Request", ...bucketize(cgTimestamps) };

    // ── 2. AI Render Tool ─────────────────────────────────────────────
    const renderEntries: any[] = await kv.getByPrefix("render-task:");
    const renderTimestamps = renderEntries
      .map(pickTs)
      .filter((t): t is number => t !== null);
    const completedRenderCount = renderEntries.filter((r) => r?.status === "completed" || r?.status === "succeeded").length;
    const renderTool = {
      key: "render-tool",
      name: "AI Render Tool",
      source: "kv:render-task:*",
      details: { completed: completedRenderCount },
      ...bucketize(renderTimestamps),
    };

    // ── 3. Designer Inquiries ─────────────────────────────────────────
    // Aggregate every inquiry across all designers. designer_sections.data
    // for section='inquiries' is an array of inquiry objects with createdAt.
    const { data: sectionsRaw } = await supabase
      .from("designer_sections")
      .select("data")
      .eq("section", "inquiries");
    const inquiryTimestamps: number[] = [];
    for (const row of sectionsRaw || []) {
      const list = Array.isArray((row as any).data) ? (row as any).data : [];
      for (const inq of list) {
        const t = pickTs(inq);
        if (t !== null) inquiryTimestamps.push(t);
      }
    }
    const designerInquiries = { key: "designer-inquiry", name: "Designer Inquiries", source: "designer_sections", ...bucketize(inquiryTimestamps) };

    // ── 4. Homepage Lead Form ─────────────────────────────────────────
    // Top-of-funnel "Get Matched" form on the homepage / Floor Plan
    // landing — writes directly to the homepage_leads Postgres table.
    async function tableTimestamps(table: string, column = "created_at"): Promise<{ ts: number[]; total: number; err?: string }> {
      const { count, error: cErr } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (cErr) return { ts: [], total: 0, err: cErr.message };
      const { data, error: dErr } = await supabase
        .from(table)
        .select(column)
        .order(column, { ascending: false })
        .limit(1000);
      if (dErr) return { ts: [], total: count ?? 0, err: dErr.message };
      const ts = (data || [])
        .map((r: any) => new Date(r[column]).getTime())
        .filter((t: number) => Number.isFinite(t));
      return { ts, total: count ?? ts.length };
    }

    const homepageLead = await tableTimestamps("homepage_leads").then((v) => ({
      key: "homepage-lead",
      name: "Homepage Lead Form",
      source: "table:homepage_leads",
      ...bucketize(v.ts, v.total),
      ...(v.err ? { error: v.err.slice(0, 120) } : {}),
    }));

    // ── 5. Escrow + Get-Matched (split via Zapier-log Source field) ───
    // Both pages POST to the same `concierge-match-lead` hook but tag the
    // payload with a different Source string. New entries persist that
    // string on the log; older entries (logged before the source-capture
    // change) won't, so they're attributed to neither — counts will start
    // accumulating cleanly from now.
    const zapierEntries: any[] = await kv.getByPrefix("zapier-log:");
    function zapierTimestamps(hook: string, sourceMatch: (s: string) => boolean): number[] {
      return zapierEntries
        .filter((e) => e?.ok && e?.hook === hook && typeof e?.source === "string" && sourceMatch(e.source))
        .map((e) => {
          const t = e?.ts ? new Date(e.ts).getTime() : NaN;
          return Number.isFinite(t) ? t : NaN;
        })
        .filter((t) => Number.isFinite(t));
    }
    const escrowTs = zapierTimestamps("concierge-match-lead", (s) => /escrow/i.test(s));
    const escrowLead = {
      key: "escrow-lead",
      name: "Escrow Lead Form",
      source: "zapier-log:concierge-match-lead (Source: Escrow*)",
      ...bucketize(escrowTs),
    };
    const getMatchedTs = zapierTimestamps("concierge-match-lead", (s) => /get\s*match/i.test(s));
    const getMatchedLead = {
      key: "get-matched-lead",
      name: "Get-Matched Lead Form",
      source: "zapier-log:concierge-match-lead (Source: Get Matched*)",
      ...bucketize(getMatchedTs),
    };

    // ── 6. Handshake Lead Form ────────────────────────────────────────
    // /handshake landing form — writes directly to handshake_leads.
    const handshakeLead = await tableTimestamps("handshake_leads").then((v) => ({
      key: "handshake-lead",
      name: "Handshake Lead Form",
      source: "table:handshake_leads",
      ...bucketize(v.ts, v.total),
      ...(v.err ? { error: v.err.slice(0, 120) } : {}),
    }));

    const payload = {
      magnets: [costGuide, renderTool, designerInquiries, homepageLead, escrowLead, getMatchedLead, handshakeLead],
      computedAt: new Date(now).toISOString(),
      cached: false,
    };

    LEAD_MAGNET_METRICS_CACHE.at = now;
    LEAD_MAGNET_METRICS_CACHE.data = payload;

    return c.json(payload);
  } catch (err) {
    console.log("lead-magnet-metrics error:", err);
    return c.json({ error: "Failed to load lead-magnet metrics: " + String(err).slice(0, 200) }, 500);
  }
});

// --- Admin: integration health check (pings each service) ---
app.get("/make-server-4808de5e/debug/health", async (c) => {
  const auth = await requireDebugAdmin(c);
  if (!auth.ok) return c.json({ error: auth.msg }, auth.status as any);

  type HealthStatus = "ok" | "degraded" | "down" | "unknown";
  type HealthResult = { name: string; status: HealthStatus; latencyMs: number; detail: string };

  const withTimeout = async <T,>(p: Promise<T>, ms = 5000): Promise<T> => {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms)),
    ]);
  };

  async function probeZapier(): Promise<HealthResult> {
    // Zapier catch hooks are write-only — summarize recent activity instead
    const t0 = Date.now();
    try {
      const entries: any[] = await kv.getByPrefix("zapier-log:");
      const last = entries.sort((a, b) => String(b?.ts || "").localeCompare(String(a?.ts || "")))[0];
      const recent24h = entries.filter((e) => new Date(e?.ts || 0).getTime() > Date.now() - 24 * 60 * 60 * 1000);
      const failed24h = recent24h.filter((e) => !e?.ok).length;
      const status: HealthStatus = recent24h.length === 0 ? "unknown" : failed24h === 0 ? "ok" : failed24h < recent24h.length ? "degraded" : "down";
      const detail = recent24h.length === 0
        ? "No activity in last 24h (write-only hook)"
        : `${recent24h.length} sends / ${failed24h} failed (24h); last: ${last?.hook || "—"} @ ${last?.ts?.slice(11, 19) || "—"}`;
      return { name: "Zapier Webhooks", status, latencyMs: Date.now() - t0, detail };
    } catch (err) {
      return { name: "Zapier Webhooks", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeKieAi(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const keysRaw = await kv.get("ai_model_keys");
      const apiKey = keysRaw?.kie_ai || keysRaw?.kieAi || Deno.env.get("KIE_AI_API_KEY");
      if (!apiKey) return { name: "kie.ai (Render)", status: "unknown", latencyMs: Date.now() - t0, detail: "API key not configured" };
      const res = await withTimeout(fetch("https://api.kie.ai/api/v1/chat/credit", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }));
      const body = await res.text();
      if (!res.ok) return { name: "kie.ai (Render)", status: "down", latencyMs: Date.now() - t0, detail: `HTTP ${res.status}: ${body.slice(0, 120)}` };
      let credits = "—";
      try {
        const j = JSON.parse(body);
        credits = String(j?.data ?? j?.credit ?? j?.credits ?? "—");
      } catch {}
      return { name: "kie.ai (Render)", status: "ok", latencyMs: Date.now() - t0, detail: `Credits: ${credits}` };
    } catch (err) {
      return { name: "kie.ai (Render)", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeGooglePlaces(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
      if (!apiKey) return { name: "Google Places", status: "unknown", latencyMs: Date.now() - t0, detail: "API key not configured" };
      const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Singapore&inputtype=textquery&fields=place_id&key=${apiKey}`;
      const res = await withTimeout(fetch(url));
      const j = await res.json();
      const status: HealthStatus = j?.status === "OK" ? "ok" : j?.status === "REQUEST_DENIED" ? "down" : "degraded";
      return { name: "Google Places", status, latencyMs: Date.now() - t0, detail: `status=${j?.status || "?"}` };
    } catch (err) {
      return { name: "Google Places", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeSupabaseDb(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { count, error } = await withTimeout(
        supabase.from("designers").select("*", { count: "exact", head: true }) as any
      );
      if (error) return { name: "Supabase DB", status: "down", latencyMs: Date.now() - t0, detail: String(error.message).slice(0, 150) };
      return { name: "Supabase DB", status: "ok", latencyMs: Date.now() - t0, detail: `designers rows: ${count ?? "?"}` };
    } catch (err) {
      return { name: "Supabase DB", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeSupabaseStorage(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data, error } = await withTimeout(supabase.storage.from("designer-assets").list("", { limit: 1 }) as any);
      if (error) return { name: "Supabase Storage", status: "down", latencyMs: Date.now() - t0, detail: String(error.message).slice(0, 150) };
      return { name: "Supabase Storage", status: "ok", latencyMs: Date.now() - t0, detail: `bucket reachable (${(data || []).length} sample)` };
    } catch (err) {
      return { name: "Supabase Storage", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeVercel(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const token = Deno.env.get("VERCEL_TOKEN");
      if (!token) return { name: "Vercel", status: "unknown", latencyMs: Date.now() - t0, detail: "VERCEL_TOKEN not configured" };
      const res = await withTimeout(fetch("https://api.vercel.com/v6/deployments?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      }));
      const j = await res.json();
      if (!res.ok) return { name: "Vercel", status: "down", latencyMs: Date.now() - t0, detail: `HTTP ${res.status}` };
      const latest = j?.deployments?.[0];
      const state = latest?.state || latest?.readyState || "?";
      return {
        name: "Vercel",
        status: state === "READY" || state === "ready" ? "ok" : state === "ERROR" ? "down" : "degraded",
        latencyMs: Date.now() - t0,
        detail: `latest: ${state} (${latest?.name || "—"})`,
      };
    } catch (err) {
      return { name: "Vercel", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  async function probeResend(): Promise<HealthResult> {
    const t0 = Date.now();
    try {
      const apiKey = Deno.env.get("RESEND_API_KEY");
      if (!apiKey) return { name: "Resend Email", status: "unknown", latencyMs: Date.now() - t0, detail: "RESEND_API_KEY not configured" };
      const res = await withTimeout(fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
      }));
      if (!res.ok) return { name: "Resend Email", status: "down", latencyMs: Date.now() - t0, detail: `HTTP ${res.status}` };
      const j = await res.json();
      const count = j?.data?.length ?? 0;
      return { name: "Resend Email", status: "ok", latencyMs: Date.now() - t0, detail: `${count} domain(s) configured` };
    } catch (err) {
      return { name: "Resend Email", status: "down", latencyMs: Date.now() - t0, detail: String(err).slice(0, 150) };
    }
  }

  const results = await Promise.all([
    probeZapier(),
    probeKieAi(),
    probeGooglePlaces(),
    probeSupabaseDb(),
    probeSupabaseStorage(),
    probeVercel(),
    probeResend(),
  ]);

  return c.json({ services: results, ts: new Date().toISOString() });
});

Deno.serve(app.fetch);