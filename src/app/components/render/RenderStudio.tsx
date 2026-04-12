import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { sanitizeInput } from "@/app/utils/sanitize";

// ─── API helpers ─────────────────────────────────────────────────
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

const AUTH_HEADERS = { Authorization: `Bearer ${publicAnonKey}` };

// ─── Types ───────────────────────────────────────────────────────
type Phase = "upload" | "idle" | "generating" | "result";

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
// (ALLOWED_DESIGN_STYLES, ALLOWED_ROOM_TYPES, ALLOWED_PROPERTY_TYPES in the edge function)
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
  const [phase, setPhase] = useState<Phase>("upload");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const [userPrompt, setUserPrompt] = useState("");
  const [adjustmentDraft, setAdjustmentDraft] = useState("");
  const [hints, setHints] = useState<Hints>({});

  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentResultUrl, setCurrentResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [rendersRemaining, setRendersRemaining] = useState<number | null>(null);
  const [rendersLimit, setRendersLimit] = useState<number>(5);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sendingToDesigner, setSendingToDesigner] = useState(false);
  const [sentToDesigner, setSentToDesigner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Hydrate remaining quota on mount ─────────────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/render-quota`, { headers: AUTH_HEADERS });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (typeof data.remaining === "number") setRendersRemaining(data.remaining);
        if (typeof data.limit === "number") setRendersLimit(data.limit);
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
            // Avoid duplicates on fast re-poll
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
          setPhase("result");
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
        return;
      }
      setUploadedImageUrl(data.url);
      setLocalPreview(`data:image/jpeg;base64,${base64}`);
      setPhase("idle");
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  // ── Generate (fresh render) ─────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!uploadedImageUrl || !userPrompt.trim() || phase === "generating") return;
    if (rendersRemaining !== null && rendersRemaining <= 0) {
      setError(
        `You've used all ${rendersLimit} renders today. Come back tomorrow, or send one of your renders to a designer for feedback.`,
      );
      return;
    }

    setError(null);
    setCurrentTaskId(null);
    setCurrentResultUrl(null);
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
      if (typeof data.rendersRemaining === "number") {
        setRendersRemaining(data.rendersRemaining);
      }
      if (typeof data.rendersLimit === "number") setRendersLimit(data.rendersLimit);
    } catch (err) {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }, [uploadedImageUrl, userPrompt, phase, hints, rendersRemaining, rendersLimit]);

  // ── Adjust (re-render from ORIGINAL image with adjustment appended) ──
  const handleAdjust = useCallback(async () => {
    if (!uploadedImageUrl || !adjustmentDraft.trim() || phase === "generating") return;
    if (rendersRemaining !== null && rendersRemaining <= 0) {
      setError(
        `You've used all ${rendersLimit} renders today. Come back tomorrow, or send one of your renders to a designer for feedback.`,
      );
      return;
    }

    setError(null);
    const prevTaskId = currentTaskId;
    setCurrentTaskId(null);
    setCurrentResultUrl(null);
    setPhase("generating");

    try {
      const res = await fetch(`${API_BASE}/render-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...AUTH_HEADERS },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl, // ← ORIGINAL image, not previous render
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
      if (typeof data.rendersRemaining === "number") {
        setRendersRemaining(data.rendersRemaining);
      }
      setAdjustmentDraft("");
    } catch (err) {
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

  // ── Reset to upload step ────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhase("upload");
    setUploadedImageUrl(null);
    setLocalPreview(null);
    setOriginalFileName(null);
    setCurrentTaskId(null);
    setCurrentResultUrl(null);
    setHistory([]);
    setUserPrompt("");
    setAdjustmentDraft("");
    setHints({});
    setError(null);
  }, []);

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

  const quotaBadge =
    rendersRemaining !== null
      ? `${rendersRemaining} of ${rendersLimit} renders left today`
      : `${rendersLimit} renders per day`;

  return (
    <section
      id="render-studio"
      className="w-full py-20 md:py-28 bg-[#f5f1e8]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2
            className="font-normal text-[#0f0f0d] leading-[1.05]"
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "clamp(36px, 5vw, 56px)",
              letterSpacing: "-0.025em",
            }}
          >
            Render your space
            <span className="italic text-[#9a9790]"> in one prompt.</span>
          </h2>
          <p className="mt-4 text-[15px] text-[#6b6860] leading-[1.6] max-w-[600px] mx-auto">
            Upload a floor plan or reference photo, describe the interior you imagine,
            and we'll generate a photorealistic render in about a minute.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fafaf8] border border-[#d8d3c8]">
            <span className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
            <span className="text-[12px] text-[#6b6860] font-medium">{quotaBadge}</span>
          </div>
        </div>

        <div className="bg-white border border-[#e5e1d6] rounded-[16px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* ── LEFT: Upload + Prompt ─────────────────── */}
            <div className="p-8 md:p-10 border-r border-[#e5e1d6]">
              {/* Upload dropzone */}
              <label className="text-[12px] text-[#6b6860] font-medium uppercase tracking-wider">
                1. Your reference image
              </label>
              <div
                ref={dropRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 relative rounded-[12px] border-2 border-dashed border-[#d8d3c8] bg-[#fafaf8] hover:border-[#0f0f0d] hover:bg-[#f5f1e8] transition-all cursor-pointer min-h-[220px] flex items-center justify-center overflow-hidden"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {localPreview ? (
                  <>
                    <img
                      src={localPreview}
                      alt="Upload preview"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[13px] font-medium">
                        Click to replace
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] text-[#6b6860]">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="mx-auto mb-3"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6b6860"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p className="text-[14px] text-[#0f0f0d] font-medium">
                          Drop your floor plan or reference photo
                        </p>
                        <p className="text-[12px] text-[#9a9790] mt-1">
                          JPG, PNG or WebP · up to 20MB
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
              {originalFileName && uploadedImageUrl && (
                <p className="text-[11px] text-[#9a9790] mt-2 truncate">
                  {originalFileName}
                </p>
              )}

              {/* Prompt textarea */}
              <label className="mt-6 block text-[12px] text-[#6b6860] font-medium uppercase tracking-wider">
                2. Describe your interior
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value.slice(0, 500))}
                placeholder="Modern Japandi living room with oak floors, warm pendant lighting, and a beige linen sofa..."
                className="mt-2 w-full min-h-[120px] rounded-[12px] border border-[#d8d3c8] bg-[#fafaf8] px-4 py-3 text-[14px] text-[#0f0f0d] leading-[1.5] focus:outline-none focus:border-[#0f0f0d] resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-[#9a9790]">
                  Interior design & architectural scenes only
                </span>
                <span className="text-[11px] text-[#9a9790] tabular-nums">
                  {userPrompt.length}/500
                </span>
              </div>

              {/* Hint chips */}
              <div className="mt-5 space-y-3">
                <ChipRow
                  label="Style (optional)"
                  options={STYLE_CHIPS}
                  value={hints.style}
                  onChange={(v) => setHints({ ...hints, style: v })}
                />
                <ChipRow
                  label="Room (optional)"
                  options={ROOM_CHIPS}
                  value={hints.room}
                  onChange={(v) => setHints({ ...hints, room: v })}
                />
                <ChipRow
                  label="Property (optional)"
                  options={PROPERTY_CHIPS}
                  value={hints.property}
                  onChange={(v) => setHints({ ...hints, property: v })}
                />
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 p-3 rounded-[8px] bg-[#fef2f2] border border-[#fecaca] text-[13px] text-[#991b1b] leading-[1.5]"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={
                  !uploadedImageUrl ||
                  !userPrompt.trim() ||
                  phase === "generating" ||
                  (rendersRemaining !== null && rendersRemaining <= 0)
                }
                className="mt-6 w-full h-[52px] rounded-[12px] bg-[#0f0f0d] text-white text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {phase === "generating"
                  ? `Generating... ${formatTime(elapsed)}`
                  : "Generate render"}
              </button>
            </div>

            {/* ── RIGHT: Result canvas ─────────────────── */}
            <div className="p-8 md:p-10 bg-[#fafaf8]">
              <label className="text-[12px] text-[#6b6860] font-medium uppercase tracking-wider">
                3. Your render
              </label>

              <div className="mt-2 relative aspect-[4/3] rounded-[12px] bg-[#e5e1d6] overflow-hidden flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {phase === "upload" || phase === "idle" ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-[#9a9790] p-6"
                    >
                      <svg
                        className="mx-auto mb-3"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-[13px]">
                        Your render will appear here
                      </p>
                    </motion.div>
                  ) : phase === "generating" ? (
                    <motion.div
                      key="gen"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <div className="w-10 h-10 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-[14px] text-[#0f0f0d] font-medium">
                        Rendering your space...
                      </p>
                      <p className="text-[12px] text-[#6b6860] mt-1 tabular-nums">
                        Elapsed: {formatTime(elapsed)}
                      </p>
                    </motion.div>
                  ) : currentResultUrl ? (
                    <motion.img
                      key={currentResultUrl}
                      src={currentResultUrl}
                      alt="AI render"
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  ) : null}
                </AnimatePresence>
              </div>

              {/* History strip */}
              {history.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {history.map((item) => (
                    <button
                      key={item.taskId}
                      onClick={() => {
                        setCurrentResultUrl(item.resultUrl);
                        setCurrentTaskId(item.taskId);
                      }}
                      className={`shrink-0 w-[64px] h-[64px] rounded-[8px] overflow-hidden border-2 transition ${
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

              {/* Adjustment row */}
              {phase === "result" && currentResultUrl && (
                <div className="mt-5">
                  <label className="text-[12px] text-[#6b6860] font-medium uppercase tracking-wider">
                    Refine your render
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={adjustmentDraft}
                      onChange={(e) => setAdjustmentDraft(e.target.value.slice(0, 300))}
                      placeholder="Make the sofa charcoal, add more plants..."
                      className="flex-1 h-[46px] rounded-[10px] border border-[#d8d3c8] bg-white px-4 text-[13px] text-[#0f0f0d] focus:outline-none focus:border-[#0f0f0d]"
                    />
                    <button
                      onClick={handleAdjust}
                      disabled={
                        !adjustmentDraft.trim() ||
                        (rendersRemaining !== null && rendersRemaining <= 0)
                      }
                      className="h-[46px] px-5 rounded-[10px] bg-[#0f0f0d] text-white text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Adjust
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9a9790] mt-1">
                    Each adjustment uses one of your daily renders.
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row gap-2">
                    {sentToDesigner ? (
                      <div className="flex-1 h-[52px] rounded-[12px] bg-[#166534] text-white text-[14px] font-medium inline-flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Sent! We'll WhatsApp you within 24h
                      </div>
                    ) : (
                      <button
                        onClick={handleSendToDesigner}
                        disabled={sendingToDesigner}
                        className="flex-1 h-[52px] rounded-[12px] bg-[#0f0f0d] text-white text-[14px] font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                      >
                        {sendingToDesigner ? "Sending..." : "Send this to a designer"}
                        {!sendingToDesigner && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="h-[52px] px-5 rounded-[12px] border border-[#d8d3c8] bg-white text-[13px] text-[#6b6860] hover:bg-[#f5f1e8] transition"
                    >
                      Start over
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
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
      <p className="text-[11px] text-[#9a9790] mb-1.5">{label}</p>
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
