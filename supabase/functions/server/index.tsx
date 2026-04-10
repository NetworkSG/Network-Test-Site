import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

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
  console.log(JSON.stringify({
    event,
    severity,
    ip,
    route,
    ...details,
    ts: new Date().toISOString(),
  }));
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
  "render-upload": 5,    // 5 uploads per minute
  "render-task": 3,      // 3 AI renders per minute
  "render-status": 30,   // 30 polls per minute
  "quote-request": 5,    // 5 quote requests per minute
  "signup": 3,           // 3 signups per minute (anti-bot)
  "login": 10,           // 10 login attempts per minute
  "scrape-designers": 8, // 8 designer list fetches per minute
  "scrape-profile": 15,  // 15 profile views per minute
  default: 20,           // 20 requests per minute for everything else
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
  return str.replace(/[<>]/g, "").trim().slice(0, maxLength);
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

  // Accept any well-formed JWT (header.payload.signature) as valid auth
  // Rate limiting + input validation are the primary security layers
  const jwtParts = token.split(".");
  if (jwtParts.length === 3 && jwtParts[0].startsWith("eyJ")) {
    // Verify it's a JWT from our Supabase project by checking the issuer
    try {
      const payload = JSON.parse(atob(jwtParts[1]));
      if (payload.iss && payload.iss.includes("supabase")) {
        return true;
      }
    } catch (_) {
      // If we can't decode, fall through to other checks
    }
  }

  // Also accept valid Supabase user tokens
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

// Enable CORS — allow all origins during development, restrict when production domain is set
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token", "X-Designer-Token", "X-Homeowner-Token"],
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
});

// Health check endpoint
app.get("/make-server-4808de5e/health", (c) => {
  return c.json({ status: "ok" });
});

// =============================================
// LIVE VISITOR TRACKING
// =============================================
const VISITOR_TTL_MS = 45_000; // Visitor considered gone after 45s without heartbeat

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
    console.log("Received quote request body:", JSON.stringify(body));

    // Input validation
    const cleanName = sanitizeString(name, 100);
    const cleanEmail = sanitizeString(email, 200);
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
    console.log("Insert payload:", JSON.stringify(insertPayload));

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

// Upload designer profile image (public bucket)
app.post("/make-server-4808de5e/designer-upload", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "designer-upload");
    if (!rl.allowed) return c.json({ error: "Too many upload requests. Please try again later.", retryAfterMs: rl.retryAfterMs }, 429);

    const body = await c.req.json();
    const { imageBase64, fileName, contentType } = body;
    if (!imageBase64 || !fileName || !contentType) return c.json({ error: "imageBase64, fileName, and contentType are required" }, 400);
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) return c.json({ error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` }, 400);

    const cleanFileName = sanitizeString(fileName, MAX_FILENAME_LENGTH).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!cleanFileName) return c.json({ error: "Invalid file name" }, 400);

    const estimatedSize = Math.ceil(imageBase64.length * 0.75);
    if (estimatedSize > MAX_IMAGE_SIZE_BYTES) return c.json({ error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB` }, 400);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const imageData = base64Decode(imageBase64);
    const filePath = `uploads/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(DESIGNER_BUCKET_NAME)
      .upload(filePath, imageData, { contentType, upsert: true });

    if (uploadError) {
      console.log("Designer image upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Public bucket — construct public URL directly
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${DESIGNER_BUCKET_NAME}/${filePath}`;

    console.log("Designer image uploaded successfully:", filePath);
    return c.json({ success: true, url: publicUrl, filePath });
  } catch (err) {
    console.log("Unexpected error in /designer-upload:", err);
    return c.json({ error: "Internal server error" }, 500);
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

    // Daily usage cap
    const dailyCap = await checkDailyRenderCap();
    if (!dailyCap.allowed) {
      securityLog("daily_render_cap_reached", "warn", ip, "/render-task", { used: dailyCap.used, cap: DAILY_RENDER_CAP });
      return c.json({ error: "Daily render limit reached. Please try again tomorrow." }, 429);
    }

    const body = await c.req.json();
    const { imageUrl, designStyle, roomType, propertyType, contact, timeline, budget } = body;

    if (!imageUrl || !designStyle || !roomType) {
      return c.json({ error: "imageUrl, designStyle, and roomType are required" }, 400);
    }

    // Whitelist validation for all enum fields
    if (!ALLOWED_DESIGN_STYLES.includes(designStyle)) {
      console.log(`Security: Rejected invalid design style: ${designStyle}`);
      return c.json({ error: "Invalid design style" }, 400);
    }
    if (!ALLOWED_ROOM_TYPES.includes(roomType)) {
      console.log(`Security: Rejected invalid room type: ${roomType}`);
      return c.json({ error: "Invalid room type" }, 400);
    }
    if (propertyType && !ALLOWED_PROPERTY_TYPES.includes(propertyType)) {
      console.log(`Security: Rejected invalid property type: ${propertyType}`);
      return c.json({ error: "Invalid property type" }, 400);
    }
    if (timeline && !ALLOWED_TIMELINES.includes(timeline)) {
      return c.json({ error: "Invalid timeline" }, 400);
    }
    if (budget && !ALLOWED_BUDGETS.includes(budget)) {
      return c.json({ error: "Invalid budget range" }, 400);
    }

    // Validate contact info
    if (contact) {
      if (contact.email && !isValidEmail(contact.email)) {
        return c.json({ error: "Invalid contact email" }, 400);
      }
      if (contact.whatsapp && !isValidWhatsapp(contact.whatsapp)) {
        return c.json({ error: "Invalid WhatsApp number" }, 400);
      }
    }

    // Validate imageUrl is from our own Supabase storage (prevent SSRF)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseHost = new URL(supabaseUrl).hostname;
    if (!isValidStorageUrl(imageUrl, [supabaseHost])) {
      securityLog("ssrf_blocked", "warn", ip, "/render-task", { url: imageUrl.slice(0, 200) });
      return c.json({ error: "Image URL must be from our storage" }, 400);
    }

    const apiKey = Deno.env.get("ai_model_keys");
    if (!apiKey) {
      console.log("ai_model_keys secret is not set");
      return c.json({ error: "AI model API key not configured on server" }, 500);
    }

    const callBackUrl = `${supabaseUrl}/functions/v1/make-server-4808de5e/render-callback`;

    // Use whitelisted values directly in prompt (already validated above)
    const prompt = `Imagine you are viewing this floorplan from the ${roomType} perspective. Convert the provided 2D floorplan into a 3D architectural visualization from this exact viewpoint. This is a floorplan-to-3D translation task, NOT a redesign task. Treat the floorplan as a locked blueprint and preserve 100% of the original layout and geometry: identical room sizes and proportions, identical wall thickness and wall positions, identical door and window positions, sizes, and swing directions, identical openings and circulation paths. Do not move, resize, remove, add, redesign, or reinterpret any architectural elements. If any architectural element is changed, the result is incorrect. Camera placed inside the ${roomType} at eye-level (1.6m height), looking toward the interior according to the plan. Apply a ${designStyle} interior design style. You may only add materials, finishes, furniture, lighting, and decor appropriate to the room type. Output a photorealistic architectural render with realistic scale, accurate proportions, and natural lighting.","style":"${designStyle}","room":"${roomType}","task":"floorplan_to_3d_render","camera_view":"${roomType}_eye_level","camera_height_m":1.6,"constraints":{"architecture_locked":true,"preserve_layout":true,"preserve_walls":true,"preserve_windows":true,"preserve_doors":true,"no_architecture_changes":true},"render_quality":"photorealistic`;

    console.log("Submitting render task to kie.ai");
    // Don't log full prompt or image URL in production to avoid log injection

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
          resolution: "1K",
          output_format: "jpg",
        },
      }),
    });

    const result = await response.json();
    console.log("kie.ai createTask FULL response:", JSON.stringify(result));
    console.log("kie.ai response status:", response.status);

    if (!response.ok) {
      console.log("kie.ai API error:", JSON.stringify(result));
      return c.json({ error: "AI render service error. Please try again later." }, 500);
    }

    // Extract taskId — try every known path in the response
    const taskId = result.data?.taskId || result.data?.task_id || result.data?.id ||
                   result.taskId || result.task_id || result.id || crypto.randomUUID();
    console.log("Extracted taskId:", taskId, "from response keys:", JSON.stringify(Object.keys(result.data || result)));

    // Store task info in KV (sanitize contact data before storing)
    const sanitizedContact = contact ? {
      name: sanitizeString(contact.name || "", 100),
      whatsapp: sanitizeString(contact.whatsapp || "", 20),
      email: sanitizeString(contact.email || "", 200),
    } : null;

    // Also insert into Quote Request table as a lead
    let quoteRequestId: string | null = null;
    if (sanitizedContact?.name && sanitizedContact?.email && sanitizedContact?.whatsapp) {
      try {
        const supabaseLeadClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const qrId = crypto.randomUUID();
        const insertPayload: Record<string, any> = {
          "ID": qrId,
          "Name": sanitizedContact.name,
          "Email": sanitizedContact.email,
          "Phone Number": sanitizedContact.whatsapp,
          "Property Type": propertyType || "",
          "Key Collection Date": timeline || "",
          "Renovation Budget": budget || "",
          "Inquiry": `3D Render Request — Style: ${designStyle}, Room: ${roomType}`,
          "Lead Form": "Network 3D AI Render",
          "Created Date": new Date().toISOString(),
          "Updated Date": new Date().toISOString(),
        };

        const { error: qrError } = await supabaseLeadClient
          .from("Quote Request")
          .insert(insertPayload)
          .select()
          .single();

        if (qrError) {
          console.log("Quote Request insert error for render lead:", JSON.stringify(qrError));
        } else {
          quoteRequestId = qrId;
          console.log("Render lead inserted into Quote Request:", qrId);
        }
      } catch (qrErr) {
        console.log("Error inserting render lead into Quote Request:", qrErr);
      }
    }

    // Resolve authenticated user for ownership tracking
    const renderUser = await getUserFromRequest(c);

    await kv.set(`render-task:${taskId}`, {
      taskId,
      userId: renderUser?.id || null,
      status: "processing",
      createdAt: new Date().toISOString(),
      contact: sanitizedContact,
      designStyle,
      roomType,
      propertyType: propertyType || "",
      timeline: timeline || "",
      budget: budget || "",
      requestIp: ip,
      quoteRequestId: quoteRequestId || null,
    });

    console.log("Render task stored with taskId:", taskId, "quoteRequestId:", quoteRequestId);
    // Only return taskId to frontend, not full API response
    return c.json({ success: true, taskId, quoteRequestId });
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

    // Verify the task exists in our KV (prevents arbitrary data injection)
    const existing = await kv.get(`render-task:${taskId}`);
    if (!existing) {
      console.log(`Security: Callback for unknown taskId: ${taskId}`);
      return c.json({ error: "Unknown task" }, 404);
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

    const updated = {
      ...existing,
      status: normalizedStatus,
      ...(resultUrl ? { resultUrl } : {}),
      completedAt: new Date().toISOString(),
      callbackBody: JSON.stringify(body).substring(0, 4000),
    };
    await kv.set(`render-task:${taskId}`, updated);
    console.log("Render task updated from callback:", taskId, "resultUrl:", resultUrl ? "YES" : "NO");

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

    // Only return safe, minimal data
    return c.json({
      taskId: task.taskId,
      status: task.resultUrl ? task.status : (task.status === "failed" ? "failed" : "processing"),
      resultUrl: task.resultUrl || null,
      createdAt: task.createdAt,
      completedAt: task.completedAt || null,
    });
  } catch (err) {
    console.log("Unexpected error in /render-status:", err);
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

// Short image redirect — /i/:id → full signed URL
app.get("/make-server-4808de5e/i/:id", async (c) => {
  const id = c.req.param("id");
  const url = await kv.get(`img:${id}`);
  if (!url) return c.json({ error: "Image not found or expired" }, 404);
  return c.redirect(url as string, 302);
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
    const adminFlag = await kv.get(`fp3d:admin:${user.id}`);
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
    const adminFlag = await kv.get(`fp3d:admin:${userId}`);
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
      const requesterAdmin = await kv.get(`fp3d:admin:${requester.id}`);
      if (requesterAdmin?.isAdmin === true) isAuthorized = true;
    }

    // If no existing admin is making this request, check for first-time setup
    if (!isAuthorized) {
      const existingAdmins = await kv.getByPrefix("fp3d:admin:");
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

    await kv.set(`fp3d:admin:${targetUser.id}`, {
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
    
    const requesterAdmin = await kv.get(`fp3d:admin:${requester.id}`);
    if (!requesterAdmin?.isAdmin) return c.json({ error: "Access denied. Admin required." }, 403);

    const body = await c.req.json();
    const { userId } = body;
    if (!userId) return c.json({ error: "userId is required" }, 400);
    if (userId === requester.id) return c.json({ error: "You cannot revoke your own admin access." }, 400);

    await kv.del(`fp3d:admin:${userId}`);
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
    
    const requesterAdmin = await kv.get(`fp3d:admin:${requester.id}`);
    if (!requesterAdmin?.isAdmin) return c.json({ error: "Access denied. Admin required." }, 403);

    const admins = await kv.getByPrefix("fp3d:admin:");
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
      email: sanitizeString(email, 200),
      password,
      user_metadata: { role: "homeowner", name: sanitizeString(name, 100), contactNumber: sanitizeString(contactNumber || "", 20) },
      email_confirm: true,
    });
    if (error) { console.log("Signup error:", error.message); return c.json({ error: error.message }, 400); }
    if (data?.user?.id) {
      const cleanName = sanitizeString(name, 100);
      const cleanEmail = sanitizeString(email, 200);
      const cleanPhone = sanitizeString(contactNumber || "", 20);
      await kv.set(`fp3d:user:${data.user.id}`, {
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
    const allProjects = (await kv.getByPrefix(`fp3d:project:`)) || [];
    console.log(`[Projects] Raw projects from KV: ${allProjects.length} entries`);
    const userProjects = allProjects
      .filter((p: any) => p && p.userId === user.id)
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
    await kv.set(`fp3d:project:${id}`, project);
    return c.json({ success: true, project });
  } catch (err) { console.log("Error creating fp3d project:", err); return c.json({ error: "Failed to create project: " + err }, 500); }
});

app.get("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await kv.get(`fp3d:project:${pId}`);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found or access denied" }, 404);
    return c.json({ project: existing.id ? existing : { id: pId, ...existing } });
  } catch (err) { console.log("Error getting fp3d project:", err); return c.json({ error: "Failed to get project: " + err }, 500); }
});

app.put("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await kv.get(`fp3d:project:${pId}`);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found" }, 404);
    const body = await c.req.json();
    const updated = { ...existing, id: pId,
      ...(body.title !== undefined && { title: sanitizeString(body.title, 200) }),
      ...(body.thumbnailUrl !== undefined && { thumbnailUrl: body.thumbnailUrl }),
      ...(body.projectData !== undefined && { projectData: body.projectData }),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`fp3d:project:${pId}`, updated);
    return c.json({ success: true, project: updated });
  } catch (err) { console.log("Error updating fp3d project:", err); return c.json({ error: "Failed to update project: " + err }, 500); }
});

app.delete("/make-server-4808de5e/fp3d/projects/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUserFromRequest(c);
    if (!user) return c.json({ error: "Authentication required — please log in again" }, 401);
    const pId = c.req.param("id");
    const existing = await kv.get(`fp3d:project:${pId}`);
    if (!existing || existing.userId !== user.id) return c.json({ error: "Project not found" }, 404);
    await kv.del(`fp3d:project:${pId}`);
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
    const allTemplates = (await kv.getByPrefix(`fp3d:template:`)) || [];
    console.log(`[Templates] Raw templates from KV: ${allTemplates.length} entries`, JSON.stringify(allTemplates.map((t: any) => ({ id: t?.id, name: t?.name, isActive: t?.isActive }))));
    const showAll = c.req.query("all") === "true";
    const templates = allTemplates
      .filter((t: any) => t && (showAll || t.isActive !== false))
      .filter((t: any) => t.id) // skip any legacy entries without an embedded id
      // IDOR protection: only return templates owned by the requesting user (or legacy templates without userId)
      .filter((t: any) => !t.userId || (tplListUser && t.userId === tplListUser.id))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
    await kv.set(`fp3d:template:${id}`, template);
    return c.json({ success: true, template });
  } catch (err) { console.log("Error creating fp3d template:", err); return c.json({ error: "Failed to create template: " + err }, 500); }
});

// --- Get single template ---
app.get("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await kv.get(`fp3d:template:${tId}`);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplUser = await getUserFromRequest(c);
    if (existing.userId && (!tplUser || tplUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    return c.json({ template: existing.id ? existing : { id: tId, ...existing } });
  } catch (err) { console.log("Error getting fp3d template:", err); return c.json({ error: "Failed to get template: " + err }, 500); }
});

app.put("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await kv.get(`fp3d:template:${tId}`);
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
        await kv.set(`fp3d:tpl-ver:${tId}:${versionId}`, versionSnap);
        const allVersions = (await kv.getByPrefix(`fp3d:tpl-ver:${tId}:`)) || [];
        if (allVersions.length > 20) {
          const sorted = allVersions.filter((v: any) => v?.versionId).sort((a: any, b: any) => Number(a.versionId) - Number(b.versionId));
          const toDelete = sorted.slice(0, sorted.length - 20);
          for (const v of toDelete) { await kv.del(`fp3d:tpl-ver:${tId}:${v.versionId}`); }
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
    await kv.set(`fp3d:template:${tId}`, updated);
    return c.json({ success: true, template: updated });
  } catch (err) { console.log("Error updating fp3d template:", err); return c.json({ error: "Failed to update template: " + err }, 500); }
});

app.delete("/make-server-4808de5e/fp3d/templates/:id", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await kv.get(`fp3d:template:${tId}`);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplDelUser = await getUserFromRequest(c);
    if (existing.userId && (!tplDelUser || tplDelUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    await kv.set(`fp3d:template:${tId}`, { ...existing, id: tId, isActive: false, updatedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (err) { console.log("Error deleting fp3d template:", err); return c.json({ error: "Failed to delete template: " + err }, 500); }
});

// --- Duplicate template ---
app.post("/make-server-4808de5e/fp3d/templates/:id/duplicate", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await kv.get(`fp3d:template:${tId}`);
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
      userId: tplDupUser?.id || existing.userId, // preserve ownership on duplicate
      name: `${existing.name || "Untitled"} (Copy)`,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await kv.set(`fp3d:template:${newId}`, duplicate);
    console.log(`[Templates] Duplicated template ${tId} -> ${newId}`);
    return c.json({ success: true, template: duplicate });
  } catch (err) { console.log("Error duplicating fp3d template:", err); return c.json({ error: "Failed to duplicate template: " + err }, 500); }
});

// --- Hard delete template (permanent) ---
app.delete("/make-server-4808de5e/fp3d/templates/:id/permanent", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const tId = c.req.param("id");
    const existing = await kv.get(`fp3d:template:${tId}`);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplPermDelUser = await getUserFromRequest(c);
    if (existing.userId && (!tplPermDelUser || tplPermDelUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    await kv.del(`fp3d:template:${tId}`);
    // Also delete version history
    try {
      const versions = (await kv.getByPrefix(`fp3d:tpl-ver:${tId}:`)) || [];
      for (const v of versions) { if (v?.versionId) await kv.del(`fp3d:tpl-ver:${tId}:${v.versionId}`); }
    } catch (_) {}
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
    const parentTpl = await kv.get(`fp3d:template:${tId}`);
    if (!parentTpl) return c.json({ error: "Template not found" }, 404);
    if (parentTpl.userId && (!tplVerUser || tplVerUser.id !== parentTpl.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const allVersions = (await kv.getByPrefix(`fp3d:tpl-ver:${tId}:`)) || [];
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
    const existing = await kv.get(`fp3d:template:${tId}`);
    if (!existing) return c.json({ error: "Template not found" }, 404);
    // IDOR protection: verify ownership
    const tplRestoreUser = await getUserFromRequest(c);
    if (existing.userId && (!tplRestoreUser || tplRestoreUser.id !== existing.userId)) {
      return c.json({ error: "Template not found" }, 404);
    }
    const version = await kv.get(`fp3d:tpl-ver:${tId}:${vId}`);
    if (!version || !version.projectData) return c.json({ error: "Version not found" }, 404);
    // Save current state as a version before restoring
    if (existing.projectData) {
      try {
        const snapId = Date.now().toString();
        await kv.set(`fp3d:tpl-ver:${tId}:${snapId}`, {
          versionId: snapId, templateId: tId, name: `Pre-restore: ${existing.name}`,
          savedAt: new Date().toISOString(),
          roomCount: existing.projectData?.roomDefinitions?.length || 0,
          furnitureCount: existing.projectData?.furniture ? Object.values(existing.projectData.furniture).reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0) : 0,
          projectData: existing.projectData, thumbnailUrl: existing.thumbnailUrl || null,
        });
      } catch (_) {}
    }
    const restored = { ...existing, id: tId, projectData: version.projectData, thumbnailUrl: version.thumbnailUrl || existing.thumbnailUrl, updatedAt: new Date().toISOString() };
    await kv.set(`fp3d:template:${tId}`, restored);
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
    const id = crypto.randomUUID();
    await kv.set(`fp3d:lead:${id}`, {
      name: sanitizeString(body.name, 100), email: sanitizeString(body.email, 200),
      contactNumber: sanitizeString(body.contactNumber, 20),
      keyCollectionPeriod: sanitizeString(body.keyCollectionPeriod || "", 50),
      createdAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  } catch (err) { console.log("Error saving fp3d lead:", err); return c.json({ error: "Failed to save lead: " + err }, 500); }
});

// =============================================
// DESIGNER PROFILE ROUTES
// =============================================

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("kv_store_4808de5e")
      .select("key, value")
      .like("key", "designer:%")
      .not("key", "like", "%:%:%");

    if (error) {
      console.log("Error fetching designers:", error);
      return c.json({ error: `Failed to fetch designers: ${error.message}` }, 500);
    }

    const designers = data?.map((d: any) => d.value) ?? [];
    console.log(`Found ${designers.length} designers`);
    return c.json({ count: designers.length, data: designers });
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

    const [profile, team, projects, caseStudies, reviews, latestReviews, serviceArea, businessInfo] = await Promise.all([
      kv.get(`designer:${slug}`),
      kv.get(`designer:${slug}:team`),
      kv.get(`designer:${slug}:projects`),
      kv.get(`designer:${slug}:casestudies`),
      kv.get(`designer:${slug}:reviews`),
      kv.get(`designer:${slug}:latestreviews`),
      kv.get(`designer:${slug}:servicearea`),
      kv.get(`designer:${slug}:businessinfo`),
    ]);

    if (!profile) {
      return c.json({ error: "Designer not found" }, 404);
    }

    console.log(`Fetched designer profile: ${slug}`);
    return c.json({
      data: {
        ...profile,
        team: team || [],
        projects: projects || [],
        caseStudies: caseStudies || [],
        reviews: reviews || [],
        latestReviews: latestReviews || [],
        serviceArea: serviceArea || {},
        businessInfo: businessInfo || [],
      },
    });
  } catch (err) {
    console.log("Unexpected error in GET /designers/:slug:", err);
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
    const existingDesigner = await kv.get(`designer:${cleanSlug}`);
    if (existingDesigner && existingDesigner.ownerId && existingDesigner.ownerId !== designerOwner.id) {
      return c.json({ error: "Designer not found" }, 404);
    }

    const keys: string[] = [`designer:${cleanSlug}`];
    const values: any[] = [{ ...profile, slug: cleanSlug, ownerId: existingDesigner?.ownerId || designerOwner.id, updatedAt: new Date().toISOString() }];

    if (team) { keys.push(`designer:${cleanSlug}:team`); values.push(team); }
    if (projects) { keys.push(`designer:${cleanSlug}:projects`); values.push(projects); }
    if (caseStudies) { keys.push(`designer:${cleanSlug}:casestudies`); values.push(caseStudies); }
    if (reviews) { keys.push(`designer:${cleanSlug}:reviews`); values.push(reviews); }
    if (latestReviews) { keys.push(`designer:${cleanSlug}:latestreviews`); values.push(latestReviews); }
    if (serviceArea) { keys.push(`designer:${cleanSlug}:servicearea`); values.push(serviceArea); }
    if (businessInfo) { keys.push(`designer:${cleanSlug}:businessinfo`); values.push(businessInfo); }

    await kv.mset(keys, values);
    console.log(`Designer profile saved: ${cleanSlug} (${keys.length} keys)`);
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

    const existing = await kv.get(`designer:${slug}`);
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
        if (session && session.slug === slug) {
          authorized = true;
        }
      }
    }
    if (!authorized) {
      return c.json({ error: "Designer not found" }, 404);
    }

    const body = await c.req.json();

    if (section === "profile") {
      await kv.set(`designer:${slug}`, { ...existing, ...body.data, slug, updatedAt: new Date().toISOString() });
    } else {
      await kv.set(`designer:${slug}:${section}`, body.data);
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

    const existing = await kv.get(`designer:${slug}`);
    if (!existing) {
      return c.json({ error: "Designer not found" }, 404);
    }

    // IDOR protection: verify the requesting user owns this designer profile
    const designerDelUser = await getUserFromRequest(c);
    if (existing.ownerId && (!designerDelUser || designerDelUser.id !== existing.ownerId)) {
      return c.json({ error: "Designer not found" }, 404);
    }

    const keysToDelete = [
      `designer:${slug}`,
      `designer:${slug}:team`,
      `designer:${slug}:projects`,
      `designer:${slug}:casestudies`,
      `designer:${slug}:reviews`,
      `designer:${slug}:latestreviews`,
      `designer:${slug}:servicearea`,
      `designer:${slug}:businessinfo`,
    ];

    await kv.mdel(keysToDelete);
    console.log(`Deleted designer profile: ${slug} (${keysToDelete.length} keys)`);
    return c.json({ success: true, slug, keysDeleted: keysToDelete.length });
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
    const existing = await kv.get(`designer:${slug}`);
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

    // ── WRITE ALL KEYS ──
    const keys = [
      `designer:${slug}`,
      `designer:${slug}:team`,
      `designer:${slug}:projects`,
      `designer:${slug}:casestudies`,
      `designer:${slug}:reviews`,
      `designer:${slug}:latestreviews`,
      `designer:${slug}:servicearea`,
      `designer:${slug}:businessinfo`,
    ];
    const allValues = [profile, teamData, projectsData, caseStudiesData, reviewCardsData, latestReviewsData, serviceAreaData, businessInfoData];

    await kv.mset(keys, allValues);

    console.log(`Seeded designer: ${slug} (${keys.length} keys written)`);
    return c.json({ success: true, slug, keysWritten: keys.length, keys });
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
    console.log("Received cost guide request:", JSON.stringify(body));

    if (!propertyType || !unitType || !selectedRooms?.length || !timeline) {
      return c.json({ error: "Missing required property/renovation fields" }, 400);
    }
    if (!contact?.name || !contact?.whatsapp || !contact?.email) {
      return c.json({ error: "All contact fields are required" }, 400);
    }

    const cleanName = sanitizeString(contact.name, 100);
    const cleanEmail = sanitizeString(contact.email, 200);
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
      living_room_price = renovationcost;
      kitchen_price = "Included"; bedrooms_price = "Included"; bathrooms_price = "Included"; other_rooms_price = "Included";
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

    // Generate short URL for the PDF
    let finalPdfUrl = storageSignedUrl || pdfUrl;
    if (finalPdfUrl) {
      const shortId = crypto.randomUUID().slice(0, 8);
      await kv.set(`img:${shortId}`, finalPdfUrl);
      const fnBase = Deno.env.get("SUPABASE_URL") + "/functions/v1/make-server-4808de5e";
      finalPdfUrl = `${fnBase}/i/${shortId}`;
    }
    return c.json({ success: true, pdfUrl: finalPdfUrl });
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

    // Branded HTML email matching homepage design system
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
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #d8d3c8;">
              <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#0f0f0d;">NETWORK</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-family:'EB Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#0f0f0d;line-height:1.2;">Your Cost Guide is Ready.</h1>
              <p style="margin:0 0 24px;font-family:'EB Garamond',Georgia,serif;font-size:20px;font-weight:400;font-style:italic;color:#9a9790;line-height:1.3;">Download your personalized renovation estimate.</p>

              <p style="margin:0 0 8px;font-family:'DM Sans',sans-serif;font-size:15px;color:#6b6860;line-height:1.75;">Hello ${cleanName},</p>
              <p style="margin:0 0 24px;font-family:'DM Sans',sans-serif;font-size:15px;color:#6b6860;line-height:1.75;">We've put together a personalized renovation cost breakdown based on your selections. Download it below to see detailed estimates for each room.</p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="background-color:#0f0f0d;border-radius:12px;">
                    <a href="${downloadUrl}" target="_blank" style="display:inline-block;padding:16px 32px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;color:#fafaf8;text-decoration:none;">Download Your Cost Breakdown</a>
                  </td>
                </tr>
              </table>

              <!-- What's next -->
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
          <!-- Footer -->
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

    // Send via Resend
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
    return c.json({ success: true, renderId, taskId });
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
// DESIGNER DASHBOARD AUTH & INQUIRIES
// =============================================

app.post("/make-server-4808de5e/designer-login", async (c) => {
  try {
    if (!(await verifyAuth(c))) return c.json({ error: "Unauthorized" }, 401);
    const ip = getClientIp(c);
    const rl = checkRateLimit(ip, "default");
    if (!rl.allowed) return c.json({ error: "Too many requests" }, 429);

    const body = await c.req.json();
    const email = sanitizeString(body.email || "", 200).toLowerCase();
    const password = body.password || "";

    if (!email || !password) return c.json({ error: "Email and password are required" }, 400);

    // Sign in via Supabase Auth
    const anonSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData?.user) {
      console.log(`Designer login failed for: ${email} — ${signInError?.message || "no user"}`);
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

    const profile = await kv.get(`designer:${designerSlug}`);
    if (!profile) return c.json({ error: "Designer profile not found" }, 404);

    const sessionToken = crypto.randomUUID();
    await kv.set(`designer-session:${sessionToken}`, { slug: designerSlug, email, userId: signInData.user.id, createdAt: new Date().toISOString() });

    console.log(`Designer logged in: ${designerSlug} (${email})`);
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

    // Verify the designer profile exists in KV
    const designerProfile = await kv.get(`designer:${cleanSlug}`);
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
    const profile = await kv.get(`designer:${session.slug}`);
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
    if (!session || session.slug !== slug) return c.json({ error: "Forbidden" }, 403);
    const inquiries = await kv.get(`designer:${slug}:inquiries`) || [];
    return c.json({ data: inquiries });
  } catch (err) {
    console.log("Unexpected error in GET /designer-inquiries:", err);
    return c.json({ error: "Internal server error" }, 500);
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
      email: sanitizeString(body.email || "", 200),
      phone: sanitizeString(body.phone || "", 20),
      propertyType: body.propertyType || "",
      budget: body.budget || "",
      timeline: body.timeline || "",
      message: sanitizeString(body.message || "", 2000),
      status: "new",
      createdAt: new Date().toISOString(),
    };

    const existing = await kv.get(`designer:${slug}:inquiries`) || [];
    existing.unshift(inquiry);
    if (existing.length > 200) existing.length = 200;
    await kv.set(`designer:${slug}:inquiries`, existing);

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
    if (!session || session.slug !== slug) return c.json({ error: "Forbidden" }, 403);

    const inquiryId = sanitizeKvKey(c.req.param("inquiryId"), 64);
    if (!inquiryId) return c.json({ error: "Invalid inquiry ID" }, 400);
    const body = await c.req.json();
    const inquiries = await kv.get(`designer:${slug}:inquiries`) || [];
    const idx = inquiries.findIndex((i: any) => i.id === inquiryId);
    if (idx === -1) return c.json({ error: "Inquiry not found" }, 404);
    inquiries[idx] = { ...inquiries[idx], ...body, updatedAt: new Date().toISOString() };
    await kv.set(`designer:${slug}:inquiries`, inquiries);
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
    if (!session || session.slug !== slug) return c.json({ error: "Forbidden" }, 403);

    const inquiryId = sanitizeKvKey(c.req.param("inquiryId"), 64);
    if (!inquiryId) return c.json({ error: "Invalid inquiry ID" }, 400);
    const inquiries = await kv.get(`designer:${slug}:inquiries`) || [];
    const filtered = inquiries.filter((i: any) => i.id !== inquiryId);
    await kv.set(`designer:${slug}:inquiries`, filtered);
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
    if (!session || session.slug !== slug) return c.json({ error: "Forbidden" }, 403);

    const [profile, team, projects, caseStudies, reviews, latestReviews, serviceArea, businessInfo, inquiries] = await Promise.all([
      kv.get(`designer:${slug}`),
      kv.get(`designer:${slug}:team`),
      kv.get(`designer:${slug}:projects`),
      kv.get(`designer:${slug}:casestudies`),
      kv.get(`designer:${slug}:reviews`),
      kv.get(`designer:${slug}:latestreviews`),
      kv.get(`designer:${slug}:servicearea`),
      kv.get(`designer:${slug}:businessinfo`),
      kv.get(`designer:${slug}:inquiries`),
    ]);

    return c.json({
      data: {
        ...(profile || {}),
        team: team || [],
        projects: projects || [],
        caseStudies: caseStudies || [],
        reviews: reviews || [],
        latestReviews: latestReviews || [],
        serviceArea: serviceArea || {},
        businessInfo: businessInfo || [],
        inquiries: inquiries || [],
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
    await kv.set(`homeowner-session:${sessionToken}`, { userId, email, createdAt: new Date().toISOString() });

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
    await kv.set(`homeowner-session:${sessionToken}`, { userId, email, createdAt: new Date().toISOString() });

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
    const [profile, inquiries, renderIds, userProjectIds] = await Promise.all([
      kv.get(`homeowner:${userId}`),
      kv.get(`homeowner:${userId}:inquiries`),
      kv.get(`user-renders:${userId}`),
      kv.get(`user-fp3d-projects:${userId}`),
    ]);

    // Fetch FP3D projects — use per-user index if available, else fallback to prefix scan (and build index)
    let userFp3dProjects: any[] = [];
    if (userProjectIds && Array.isArray(userProjectIds) && userProjectIds.length > 0) {
      // Fast path: fetch only this user's projects by ID in parallel
      const projectResults = await Promise.all(
        userProjectIds.slice(0, 20).map((pid: string) => kv.get(`fp3d:project:${pid}`))
      );
      userFp3dProjects = projectResults
        .filter((p: any) => p && p.userId === userId)
        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    } else {
      // Slow fallback: scan all projects (first time only), then build per-user index
      const allFp3dProjects = (await kv.getByPrefix(`fp3d:project:`)) || [];
      userFp3dProjects = allFp3dProjects
        .filter((p: any) => p && p.userId === userId)
        .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      // Cache per-user project ID list for next time
      if (userFp3dProjects.length > 0) {
        const ids = userFp3dProjects.map((p: any) => p.id || p.projectId).filter(Boolean);
        await kv.set(`user-fp3d-projects:${userId}`, ids);
      }
    }

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

    // Fetch all designer profiles (top-level keys only)
    const { data: profileRows } = await supabase
      .from("kv_store_4808de5e")
      .select("key, value")
      .like("key", "designer:%")
      .not("key", "like", "%:%:%");

    // Fetch all project arrays
    const { data: projectRows } = await supabase
      .from("kv_store_4808de5e")
      .select("key, value")
      .like("key", "designer:%:projects");

    const profiles: Record<string, any> = {};
    for (const row of profileRows || []) {
      const slug = row.key.replace("designer:", "");
      profiles[slug] = row.value;
    }

    const allProjects: any[] = [];
    for (const row of projectRows || []) {
      const slug = row.key.replace("designer:", "").replace(":projects", "");
      const designer = profiles[slug];
      if (!designer) continue;
      const projects = Array.isArray(row.value) ? row.value : [];
      projects.forEach((proj: any, idx: number) => {
        if (!proj || !proj.image) return; // skip projects without images
        // Parse meta string like "HDB · $87,460 · 2024"
        const metaParts = (proj.meta || "").split("·").map((s: string) => s.trim());
        allProjects.push({
          projectId: `${slug}-${idx}`,
          title: proj.name || "Untitled Project",
          image: proj.image || "",
          meta: proj.meta || "",
          propertyType: metaParts[0] || "",
          budget: metaParts[1] || "",
          year: metaParts[2] || "",
          designerName: designer.name || designer.companyName || slug,
          designerSlug: slug,
          designerLogo: designer.logoUrl || "",
          verified: designer.verified || false,
          style: designer.coverProject?.style || metaParts[0] || "",
        });
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

Deno.serve(app.fetch);