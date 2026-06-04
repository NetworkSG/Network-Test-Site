import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sanitizeInput, sanitizeEmail, isValidEmail, isValidPhone } from "@/app/utils/sanitize";
import { trackLead } from "@/app/utils/metaPixel";

// ─── API helpers ─────────────────────────────────────────────────
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

const AUTH_HEADERS = { Authorization: `Bearer ${publicAnonKey}` };

// ─── Types ───────────────────────────────────────────────────────
type Phase = "home" | "uploading" | "idle" | "generating" | "result";

type Hints = {
  style?: string;
  room?: string;
  property?: string;
};

type HistoryItem = {
  taskId: string;
  resultUrl: string;
  promptUsed: string;
  createdAt: string;
};

// Suggestion chips — ALL values must match the backend whitelist exactly
const STYLE_CHIPS = [
  "Modern",
  "Japandi",
  "Scandinavian",
  "Wabi-sabi",
  "Minimalist",
  "Industrial",
];

const ROOM_CHIPS = [
  "Living Room",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Dining Room",
];

const PROPERTY_CHIPS = ["HDB", "Condo", "Landed", "Commercial"];

// ─── AI-style prompt suggestions based on chip selections ────────
const PROMPT_TEMPLATES: Record<string, Record<string, string>> = {
  Modern: {
    "Living Room": "A sleek modern living room with clean lines, neutral tones, a low-profile sofa, and floor-to-ceiling windows letting in natural light",
    "Kitchen": "A modern open-concept kitchen with handleless cabinetry, quartz countertops, integrated appliances, and pendant lighting over the island",
    "Bedroom": "A modern master bedroom with a platform bed, soft ambient lighting, built-in wardrobes, and a calming neutral palette",
    "Bathroom": "A modern bathroom with frameless glass shower, wall-mounted vanity, large format tiles, and recessed lighting",
    "Dining Room": "A modern dining space with a marble-top table, upholstered chairs, a statement chandelier, and minimalist decor",
  },
  Japandi: {
    "Living Room": "A Japandi living room blending Japanese minimalism with Scandinavian warmth — oak floors, low furniture, natural textiles, and indoor plants",
    "Kitchen": "A Japandi kitchen with light wood cabinetry, open shelving, ceramic dishware on display, and natural stone countertops",
    "Bedroom": "A serene Japandi bedroom with a low wooden bed frame, linen bedding, paper lantern lighting, and wabi-sabi accents",
    "Bathroom": "A Japandi bathroom with soaking tub, wood and stone materials, minimal fixtures, and soft natural lighting",
    "Dining Room": "A Japandi dining area with a solid wood table, handcrafted ceramics, woven pendant lights, and a warm earthy palette",
  },
  Scandinavian: {
    "Living Room": "A bright Scandinavian living room with white walls, light oak floors, a cozy sectional sofa, sheepskin throws, and abundant natural light",
    "Kitchen": "A Scandinavian kitchen with white cabinetry, butcher block counters, open shelving, and pops of muted color",
    "Bedroom": "A Scandinavian bedroom with white linen, light wood furniture, soft textiles, and a gallery wall of simple art",
    "Bathroom": "A Scandinavian bathroom with white subway tiles, warm wood accents, a freestanding bathtub, and brass fixtures",
    "Dining Room": "A Scandinavian dining room with a round oak table, wishbone chairs, a linen table runner, and a simple pendant light",
  },
  "Wabi-sabi": {
    "Living Room": "A wabi-sabi living room embracing imperfection — raw plaster walls, vintage furniture, handmade ceramics, and organic textures",
    "Kitchen": "A wabi-sabi kitchen with hand-finished concrete counters, open wood shelving, aged brass hardware, and earthy pottery",
    "Bedroom": "A wabi-sabi bedroom with an unmade linen bed, raw wood nightstand, dried flower arrangement, and textured walls",
    "Bathroom": "A wabi-sabi bathroom with a stone basin, weathered wood vanity, muted earth tones, and handmade tiles",
    "Dining Room": "A wabi-sabi dining space with a rustic reclaimed wood table, mismatched chairs, clay vases, and soft diffused lighting",
  },
  Minimalist: {
    "Living Room": "A minimalist living room with a monochromatic palette, streamlined furniture, hidden storage, and one statement art piece",
    "Kitchen": "A minimalist kitchen with flat-panel cabinets, integrated handles, clean countertops, and concealed appliances",
    "Bedroom": "A minimalist bedroom with only essential furniture, built-in closets, a simple bed frame, and a single bedside light",
    "Bathroom": "A minimalist bathroom with a floating vanity, wall-mounted toilet, frameless mirror, and a single accent material",
    "Dining Room": "A minimalist dining room with a simple rectangular table, slim chairs, bare walls, and a single overhead light",
  },
  Industrial: {
    "Living Room": "An industrial loft living room with exposed brick walls, steel beams, a worn leather sofa, Edison bulb lighting, and concrete floors",
    "Kitchen": "An industrial kitchen with stainless steel counters, open metal shelving, exposed ductwork, and a large farmhouse sink",
    "Bedroom": "An industrial bedroom with a metal bed frame, exposed brick, factory-style windows, and vintage trunk storage",
    "Bathroom": "An industrial bathroom with concrete walls, black metal fixtures, a glass-enclosed shower, and pipe-style towel racks",
    "Dining Room": "An industrial dining space with a reclaimed wood table, metal chairs, pendant cage lights, and a raw concrete floor",
  },
};

function generateSuggestedPrompt(hints: Hints): string {
  const { style, room, property } = hints;

  // Try to find a specific template
  if (style && room && PROMPT_TEMPLATES[style]?.[room]) {
    const base = PROMPT_TEMPLATES[style][room];
    return property ? `${base}, designed for a Singapore ${property}` : base;
  }

  // Build a generic prompt from whatever is selected
  const parts: string[] = [];
  if (style && room) {
    parts.push(`A ${style.toLowerCase()} ${room.toLowerCase()}`);
  } else if (style) {
    parts.push(`A ${style.toLowerCase()} interior`);
  } else if (room) {
    parts.push(`A beautifully designed ${room.toLowerCase()}`);
  }

  if (parts.length === 0) return "";

  const details = [
    "with warm lighting",
    "natural materials",
    "and a cohesive color palette",
  ];
  const base = `${parts[0]} ${details.join(", ")}`;
  return property ? `${base}, designed for a Singapore ${property}` : base;
}

// ─── Image compression (lifted from RenderToolForm) ─────────────
function compressImage(
  file: File,
  maxWidthPx = 1600,
  quality = 0.75,
): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width);
        width = maxWidthPx;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, contentType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

// ─── Component ───────────────────────────────────────────────────
export function RenderStudio() {
  const [phase, setPhase] = useState<Phase>("home");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const [userPrompt, setUserPrompt] = useState("");
  const [adjustmentDraft, setAdjustmentDraft] = useState("");
  const [hints, setHints] = useState<Hints>({});
  const [showHints, setShowHints] = useState(false);

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentResultUrl, setCurrentResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [rendersRemaining, setRendersRemaining] = useState<number | null>(null);
  const [rendersLimit, setRendersLimit] = useState<number>(5);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sendingToDesigner, setSendingToDesigner] = useState(false);
  const [suggestingPrompt, setSuggestingPrompt] = useState(false);
  const [sentToDesigner, setSentToDesigner] = useState(false);

  // Result gate: after a render completes, the image stays blurred behind a
  // "find firms" pop-up (mirrors the Cost Guide gate). The user must choose
  // "Yes" (→ contact form → matched) or "Not now" before the render is shown.
  const [resultGateAnswered, setResultGateAnswered] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const adjustRef = useRef<HTMLTextAreaElement>(null);

  // Get user name from gate contact
  const [userName, setUserName] = useState("");
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("render-gate-contact");
      if (raw) {
        const contact = JSON.parse(raw);
        if (contact.name) setUserName(contact.name.split(" ")[0]);
      }
    } catch { /* noop */ }
  }, []);

  // ── Hydrate remaining quota on mount ─────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/render-quota`, { headers: AUTH_HEADERS });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        // Public tool is capped at a single render — clamp whatever the
        // backend reports so the UI enforces 1 even before the cap deploys.
        setRendersLimit(1);
        setRendersRemaining(typeof data.remaining === "number" && data.remaining <= 0 ? 0 : 1);
      } catch {
        /* non-fatal */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ── Elapsed timer while generating ───────────────────────────────
  useEffect(() => {
    if (phase !== "generating") {
      setElapsed(0);
      return;
    }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Poll for result ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "generating" || !currentTaskId) return;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_BASE}/render-status/${currentTaskId}`, {
          headers: AUTH_HEADERS,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (data.resultUrl) {
          setCurrentResultUrl(data.resultUrl);
          setHistory((h) => {
            if (h.some((item) => item.taskId === currentTaskId)) return h;
            return [
              ...h,
              {
                taskId: currentTaskId,
                resultUrl: data.resultUrl,
                promptUsed: data.adjustmentPrompt
                  ? `${data.userPrompt || userPrompt} — ${data.adjustmentPrompt}`
                  : data.userPrompt || userPrompt,
                createdAt: data.completedAt || new Date().toISOString(),
              },
            ].slice(-6);
          });
          setRendersRemaining(0); // one render only — lock further generates
          setPhase("result");

          // Forward the "wants match" lead to Zapier — only once the render has
          // actually completed (not at the gate, not at render start). Once per
          // session, and only when they answered "Yes" on Finding an ID.
          try {
            if (!sessionStorage.getItem("render-gate-lead-sent")) {
              const rawContact = sessionStorage.getItem("render-gate-contact");
              const contact = rawContact ? JSON.parse(rawContact) : null;
              if (contact && String(contact.findingId || "").toLowerCase().startsWith("yes")) {
                sessionStorage.setItem("render-gate-lead-sent", "1");
                fetch(`${API_BASE}/render-gate-lead`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
                  body: JSON.stringify(contact),
                }).catch(() => {});
              }
            }
          } catch { /* non-fatal */ }
        } else if (data.status === "failed") {
          setError("Render failed. Please try a different prompt.");
          setPhase("idle");
        }
      } catch {
        /* retry */
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [phase, currentTaskId, userPrompt]);

  // ── Handle file select ──────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be smaller than 20MB.");
      return;
    }

    setIsUploading(true);
    setPhase("uploading");
    setOriginalFileName(file.name);
    try {
      const { base64, contentType } = await compressImage(file);
      const res = await fetch(`${API_BASE}/render-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          imageBase64: base64,
          fileName: file.name.replace(/\.\w+$/, ".jpg"),
          contentType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Upload failed. Please try again.");
        setIsUploading(false);
        setPhase("home");
        return;
      }
      setUploadedImageUrl(data.url);
      setLocalPreview(`data:image/jpeg;base64,${base64}`);
      setPhase("idle");
      // Auto-focus the prompt textarea after upload
      setTimeout(() => promptRef.current?.focus(), 100);
    } catch {
      setError("Upload failed. Please try again.");
      setPhase("home");
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── Generate (fresh render) ─────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!uploadedImageUrl || !userPrompt.trim() || phase === "generating") return;
    if (rendersRemaining !== null && rendersRemaining <= 0) {
      setError(
        "That's your free render for today. Come back tomorrow, or send this one to a designer for real-world feedback.",
      );
      return;
    }

    setError(null);
    setCurrentTaskId(null);
    setCurrentResultUrl(null);
    setResultGateAnswered(false);
    setSentToDesigner(false);
    setPhase("generating");

    try {
      const res = await fetch(`${API_BASE}/render-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          userPrompt: sanitizeInput(userPrompt, 500),
          hints,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Render failed. Please try again.");
        setPhase("idle");
        if (typeof data.remaining === "number") setRendersRemaining(data.remaining);
        return;
      }
      setCurrentTaskId(data.taskId);
      // Render cap is fixed at 1 on the client; the completion handler zeroes
      // the remaining count, so we don't echo the backend's per-call numbers.
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }, [uploadedImageUrl, userPrompt, phase, hints, rendersRemaining, rendersLimit]);

  // ── Adjust (re-render from ORIGINAL image with adjustment appended) ──
  const handleAdjust = useCallback(async () => {
    if (!uploadedImageUrl || !adjustmentDraft.trim() || phase === "generating") return;
    if (rendersRemaining !== null && rendersRemaining <= 0) {
      setError(
        "That's your free render for today. Come back tomorrow, or send this one to a designer for real-world feedback.",
      );
      return;
    }

    setError(null);
    const prevTaskId = currentTaskId;
    setCurrentTaskId(null);
    setCurrentResultUrl(null);
    setResultGateAnswered(false);
    setSentToDesigner(false);
    setPhase("generating");

    try {
      const res = await fetch(`${API_BASE}/render-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          userPrompt: sanitizeInput(userPrompt, 500),
          adjustmentPrompt: sanitizeInput(adjustmentDraft, 300),
          hints,
          parentTaskId: prevTaskId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Adjustment failed. Please try again.");
        setPhase("idle");
        if (typeof data.remaining === "number") setRendersRemaining(data.remaining);
        return;
      }
      setCurrentTaskId(data.taskId);
      setAdjustmentDraft("");
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }, [
    uploadedImageUrl,
    adjustmentDraft,
    userPrompt,
    phase,
    hints,
    currentTaskId,
    rendersRemaining,
    rendersLimit,
  ]);

  // Auto-submit "Send to designer" using contact info saved during gate sign-up
  const handleSendToDesigner = useCallback(async () => {
    if (!currentTaskId || sendingToDesigner || sentToDesigner) return;
    let contact: Record<string, string> = {};
    try {
      const raw = sessionStorage.getItem("render-gate-contact");
      if (raw) contact = JSON.parse(raw);
    } catch { /* noop */ }
    if (!contact.name || !contact.email || !contact.whatsapp) {
      setError("Missing contact info. Please go back and fill in the form.");
      return;
    }
    setSendingToDesigner(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/render-lead-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          taskId: currentTaskId,
          name: contact.name,
          whatsapp: contact.whatsapp,
          email: contact.email,
          propertyType: contact.propertyType || undefined,
          budget: contact.budget || undefined,
          timeline: contact.timeline || undefined,
          findingId: contact.findingId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send. Please try again.");
      } else {
        setSentToDesigner(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSendingToDesigner(false);
    }
  }, [currentTaskId, sendingToDesigner, sentToDesigner]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Handle prompt submit on Enter (without Shift)
  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleAdjustKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdjust();
    }
  };

  // Auto-resize textareas
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const isHome = phase === "home" || phase === "uploading";
  const hasResult = phase === "result" && currentResultUrl;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── MAIN CONTENT AREA ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-40 pt-8">
        <AnimatePresence mode="wait">
          {/* ── HOME STATE: Greeting + upload prompt ──────────── */}
          {isHome && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-[640px] w-full"
            >
              {userName && (
                <p className="text-[15px] text-[#6b6860] mb-2">
                  Hi {userName}
                </p>
              )}
              <h1
                className="text-[#0f0f0d] leading-[1.1]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(32px, 5vw, 48px)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                }}
              >
                What should we render?
              </h1>
              <p className="mt-4 text-[15px] text-[#6b6860] leading-[1.6] max-w-[480px] mx-auto">
                Upload a photo, describe the interior you imagine, and get a photorealistic
                render in about a minute — you've got one, so make it count.
              </p>

              {phase === "uploading" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 flex flex-col items-center gap-3"
                >
                  <div className="w-10 h-10 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[13px] text-[#6b6860]">Uploading your image...</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── IDLE STATE: Image uploaded, shown as preview ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[540px] text-center"
            >
              {/* Uploaded image — medium preview */}
              <div className="relative rounded-[14px] overflow-hidden border border-[#e5e1d6] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                {localPreview && (
                  <img
                    src={localPreview}
                    alt="Your uploaded reference"
                    className="w-full aspect-[3/2] object-cover"
                  />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-[6px] bg-black/60 text-white text-[11px] font-medium hover:bg-black/80 transition backdrop-blur-sm"
                >
                  Replace
                </button>
              </div>
              <p className="mt-3 text-[13px] text-[#6b6860]">
                Describe what you'd like this space to look like below.
              </p>
            </motion.div>
          )}

          {/* ── GENERATING STATE ──────────────────────────────── */}
          {phase === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-[640px]"
            >
              <div className="w-14 h-14 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h2
                className="text-[#0f0f0d] leading-[1.15]"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "clamp(24px, 4vw, 36px)",
                  fontWeight: 400,
                }}
              >
                Rendering your space...
              </h2>
              <p className="mt-3 text-[14px] text-[#6b6860] tabular-nums">
                Elapsed: {formatTime(elapsed)}
              </p>
              <p className="mt-1 text-[12px] text-[#9a9790]">
                This usually takes 30–90 seconds
              </p>
            </motion.div>
          )}

          {/* ── RESULT STATE ──────────────────────────────────── */}
          {hasResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[800px]"
            >
              {/* Main result image — kept blurred until the gate is cleared. */}
              <div className="relative rounded-[16px] overflow-hidden border border-[#e5e1d6] shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                <motion.img
                  key={currentResultUrl}
                  src={currentResultUrl}
                  alt="AI render"
                  className="w-full aspect-[4/3] object-cover"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    filter: resultGateAnswered ? "none" : "blur(22px)",
                    transform: resultGateAnswered ? "none" : "scale(1.05)",
                    transition: "filter 0.5s ease",
                    userSelect: "none",
                  }}
                />
              </div>

              {/* History strip */}
              {history.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto justify-center">
                  {history.map((item) => (
                    <button
                      key={item.taskId}
                      onClick={() => {
                        setCurrentResultUrl(item.resultUrl);
                        setCurrentTaskId(item.taskId);
                      }}
                      className={`shrink-0 w-[56px] h-[56px] rounded-[10px] overflow-hidden border-2 transition ${
                        currentTaskId === item.taskId
                          ? "border-[#0f0f0d]"
                          : "border-transparent hover:border-[#d8d3c8]"
                      }`}
                    >
                      <img
                        src={item.resultUrl}
                        alt="history"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                {sentToDesigner ? (
                  <div className="h-[48px] px-6 rounded-[12px] bg-[#166534] text-white text-[14px] font-medium inline-flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Sent! We'll WhatsApp you within the day
                  </div>
                ) : (
                  <button
                    onClick={handleSendToDesigner}
                    disabled={sendingToDesigner}
                    className="h-[48px] px-6 rounded-[12px] bg-[#0f0f0d] text-white text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {sendingToDesigner ? "Sending..." : "Get matched"}
                    {!sendingToDesigner && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner — shown in any phase */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 max-w-[600px] w-full p-3 rounded-[10px] bg-[#fef2f2] border border-[#fecaca] text-[13px] text-[#991b1b] leading-[1.5] text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM INPUT BAR ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Fade gradient above the bar */}
        <div className="h-8 bg-gradient-to-t from-[#f0ede6] to-transparent pointer-events-none" />
        <div className="bg-[#f0ede6] px-6 pb-6">
          <div className="max-w-[680px] mx-auto">
            {/* Hint chips — togglable */}
            <AnimatePresence>
              {showHints && (phase === "home" || phase === "idle" || phase === "result") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="space-y-2 p-4 rounded-[14px] bg-[#fafaf8] border border-[#d8d3c8]">
                    <ChipRow
                      label="Style"
                      options={STYLE_CHIPS}
                      value={hints.style}
                      onChange={(v) => setHints({ ...hints, style: v })}
                    />
                    <ChipRow
                      label="Room"
                      options={ROOM_CHIPS}
                      value={hints.room}
                      onChange={(v) => setHints({ ...hints, room: v })}
                    />
                    <ChipRow
                      label="Property"
                      options={PROPERTY_CHIPS}
                      value={hints.property}
                      onChange={(v) => setHints({ ...hints, property: v })}
                    />
                    {/* AI Suggest prompt button */}
                    {(hints.style || hints.room) && (
                      <button
                        onClick={async () => {
                          if (suggestingPrompt) return;
                          setSuggestingPrompt(true);
                          try {
                            const res = await fetch(`${API_BASE}/render-suggest-prompt`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
                              body: JSON.stringify({ imageUrl: uploadedImageUrl, hints }),
                            });
                            const data = await res.json();
                            if (res.ok && data.prompt) {
                              setUserPrompt(data.prompt);
                              setShowHints(false);
                              setTimeout(() => {
                                if (promptRef.current) autoResize(promptRef.current);
                              }, 50);
                            } else {
                              // Fallback to local generation
                              const suggested = generateSuggestedPrompt(hints);
                              if (suggested) {
                                setUserPrompt(suggested);
                                setShowHints(false);
                                setTimeout(() => {
                                  if (promptRef.current) autoResize(promptRef.current);
                                }, 50);
                              }
                            }
                          } catch {
                            // Fallback to local generation on network error
                            const suggested = generateSuggestedPrompt(hints);
                            if (suggested) {
                              setUserPrompt(suggested);
                              setShowHints(false);
                              setTimeout(() => {
                                if (promptRef.current) autoResize(promptRef.current);
                              }, 50);
                            }
                          } finally {
                            setSuggestingPrompt(false);
                          }
                        }}
                        disabled={suggestingPrompt}
                        className="w-full mt-1 h-[36px] rounded-[8px] bg-[#0f0f0d] text-white text-[12px] font-medium hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {suggestingPrompt ? (
                          <>
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            Thinking...
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z" />
                            </svg>
                            Suggest a prompt
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main input container */}
            <div className="flex items-end gap-2 p-3 rounded-[16px] bg-[#fafaf8] border border-[#d8d3c8] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              {/* Attach / Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-[#6b6860] hover:bg-[#f0ede6] transition"
                title="Upload image"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {/* Hint chips toggle */}
              <button
                onClick={() => setShowHints(!showHints)}
                className={`shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center transition ${
                  showHints ? "bg-[#0f0f0d] text-white" : "text-[#6b6860] hover:bg-[#f0ede6]"
                }`}
                title="Style options"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                  <circle cx="9" cy="8" r="2" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="16" r="2" fill="currentColor" stroke="none" />
                </svg>
              </button>

              {/* Prompt / Adjust textarea */}
              {phase === "result" ? (
                <textarea
                  ref={adjustRef}
                  value={adjustmentDraft}
                  onChange={(e) => {
                    setAdjustmentDraft(e.target.value.slice(0, 300));
                    autoResize(e.target);
                  }}
                  onKeyDown={handleAdjustKeyDown}
                  placeholder="Refine your render — e.g. make the sofa charcoal, add more plants..."
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] text-[#0f0f0d] leading-[1.5] resize-none focus:outline-none placeholder:text-[#9a9790] py-2"
                />
              ) : (
                <textarea
                  ref={promptRef}
                  value={userPrompt}
                  onChange={(e) => {
                    setUserPrompt(e.target.value.slice(0, 500));
                    autoResize(e.target);
                  }}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={
                    uploadedImageUrl
                      ? "Describe your dream interior — e.g. Modern Japandi living room with oak floors..."
                      : "Upload an image first, then describe your interior..."
                  }
                  rows={1}
                  disabled={phase === "generating"}
                  className="flex-1 bg-transparent text-[14px] text-[#0f0f0d] leading-[1.5] resize-none focus:outline-none placeholder:text-[#9a9790] py-2 disabled:opacity-50"
                />
              )}

              {/* Quota ring + Submit button */}
              <QuotaRing used={rendersLimit - (rendersRemaining ?? rendersLimit)} limit={rendersLimit} />

              <button
                onClick={phase === "result" ? handleAdjust : handleGenerate}
                disabled={
                  phase === "generating" ||
                  (phase === "result"
                    ? !adjustmentDraft.trim()
                    : !uploadedImageUrl || !userPrompt.trim()) ||
                  (rendersRemaining !== null && rendersRemaining <= 0)
                }
                className="shrink-0 w-[40px] h-[40px] rounded-full bg-[#0f0f0d] text-white flex items-center justify-center hover:opacity-90 active:scale-[0.95] transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {phase === "generating" ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* Character counter */}
            {uploadedImageUrl && phase !== "home" && (
              <div className="mt-1.5 flex justify-end">
                <span className="text-[11px] text-[#9a9790] tabular-nums">
                  {phase === "result" ? `${adjustmentDraft.length}/300` : `${userPrompt.length}/500`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result gate — blurs the render behind a "find firms" pop-up. */}
      <ResultGate
        open={phase === "result" && !!currentResultUrl && !resultGateAnswered}
        taskId={currentTaskId}
        onReveal={(submitted) => {
          setResultGateAnswered(true);
          if (submitted) setSentToDesigner(true);
        }}
      />
    </div>
  );
}

// ─── Result gate (mirrors the Cost Guide lead pop-up) ──────────────
// Shown over the blurred render once it finishes. "Yes" expands a contact
// form (prefilled from the entry-gate sign-up) that sends the render to a
// designer; "Not now" just unlocks the render. Either way the user must act.
function ResultGate({
  open,
  taskId,
  onReveal,
}: {
  open: boolean;
  taskId: string | null;
  onReveal: (submitted: boolean) => void;
}) {
  const [choice, setChoice] = useState<"" | "yes" | "no">("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the entry-gate contact each time the gate opens.
  useEffect(() => {
    if (!open) return;
    setChoice("");
    setError(null);
    try {
      const raw = sessionStorage.getItem("render-gate-contact");
      if (raw) {
        const c = JSON.parse(raw);
        setName(c.name || "");
        setWhatsapp(c.whatsapp || "");
        setEmail(c.email || "");
      }
    } catch { /* noop */ }
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const canSubmit =
    name.trim().length >= 2 &&
    isValidPhone(whatsapp.trim()) &&
    isValidEmail(email.trim()) &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !taskId) return;
    setSubmitting(true);
    setError(null);
    let stored: Record<string, string> = {};
    try {
      const raw = sessionStorage.getItem("render-gate-contact");
      if (raw) stored = JSON.parse(raw);
    } catch { /* noop */ }
    try {
      const res = await fetch(`${API_BASE}/render-lead-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          taskId,
          name: sanitizeInput(name, 100),
          whatsapp: sanitizeInput(whatsapp, 20),
          email: sanitizeEmail(email),
          propertyType: stored.propertyType || undefined,
          budget: stored.budget || undefined,
          timeline: stored.timeline || undefined,
          findingId: stored.findingId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      trackLead("render-tool-submit");
      onReveal(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="result-gate"
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 font-['DM_Sans',sans-serif]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-[rgba(24,22,18,0.55)] backdrop-blur-[10px]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-[#f0ede6] border border-[#d8d3c8] rounded-[16px] p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          >
            <h2
              className="text-[#0f0f0d] leading-[1.2]"
              style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 26, fontWeight: 500, letterSpacing: "-0.5px" }}
            >
              Find firms built for{" "}
              <span style={{ fontStyle: "italic", color: "#6b6860" }}>your scope.</span>
            </h2>
            <p className="text-[14px] text-[#6b6860] leading-[1.6] mt-2.5 mb-5">
              Love this render? Get matched with three firms who can bring it to life — aligned to your scope and budget.
            </p>

            {/* Yes reveals the form; Not now just unlocks the render. */}
            <div className="flex gap-2.5" style={{ marginBottom: choice === "yes" ? 18 : 0 }}>
              <button
                type="button"
                onClick={() => setChoice("yes")}
                className="flex-1 h-[48px] rounded-[10px] text-[14px] font-semibold transition"
                style={{
                  background: choice === "yes" ? "#0f0f0d" : "#faf8f2",
                  color: choice === "yes" ? "#fff" : "#0f0f0d",
                  border: `1px solid ${choice === "yes" ? "#0f0f0d" : "#d8d3c8"}`,
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onReveal(false)}
                className="flex-1 h-[48px] rounded-[10px] text-[14px] font-semibold transition"
                style={{ background: "#faf8f2", color: "#0f0f0d", border: "1px solid #d8d3c8" }}
              >
                Not now
              </button>
            </div>

            {choice === "yes" && (
              <div className="mt-1 space-y-3">
                <GateField label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                  />
                </GateField>
                <GateField label="WhatsApp (SG)">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="8123 4567"
                    className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                  />
                </GateField>
                <GateField label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full h-[44px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                  />
                </GateField>
                {error && (
                  <div className="p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[12px] text-[#991b1b] leading-[1.5]">
                    {error}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full h-[48px] rounded-[10px] bg-[#0f0f0d] text-white text-[13px] font-semibold hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {submitting ? "Submitting…" : "Submit and get matched"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function GateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] text-[#6b6860] font-medium uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// ─── Quota ring (circular progress) ─────────────────────────────
function QuotaRing({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const fraction = limit > 0 ? used / limit : 0;
  const size = 40;
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return (
    <div className="shrink-0 relative w-[40px] h-[40px] flex items-center justify-center" title={`${remaining} of ${limit} renders left today`}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d8d3c8"
          strokeWidth={stroke}
        />
        {/* Used portion (orange) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E97315"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="text-[12px] font-semibold text-[#0f0f0d] tabular-nums leading-none">
        {remaining}
      </span>
    </div>
  );
}

// ─── Chip row helper ─────────────────────────────────────────────
function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <p className="text-[11px] text-[#9a9790] mb-1.5 font-medium uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(active ? undefined : opt)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition ${
                active
                  ? "bg-[#0f0f0d] text-white border-[#0f0f0d]"
                  : "bg-white text-[#6b6860] border-[#d8d3c8] hover:border-[#0f0f0d]"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
