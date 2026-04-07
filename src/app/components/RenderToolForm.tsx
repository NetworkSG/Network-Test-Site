import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import { projectId, publicAnonKey } from "/utils/supabase/info";

import imgBefore from "figma:asset/c280f9f6aaab4ae8bddb90591c886526cb64a9c8.png";
import imgAfter from "figma:asset/f07ac02def74d08b83946b312fd388bd8374c28c.png";

// Before/After comparison slider
function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };
    const handleUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-[12px] overflow-hidden cursor-col-resize select-none shadow-[0px_25px_35.9px_rgba(0,0,0,0.07)]"
      onMouseDown={(e) => { isDragging.current = true; updatePosition(e.clientX); }}
      onTouchStart={(e) => { isDragging.current = true; updatePosition(e.touches[0].clientX); }}
    >
      {/* After image (rendered) — full background */}
      <img src={imgAfter} alt="After — 3D Render" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before image (wireframe) — clipped by slider */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
        <img src={imgBefore} alt="Before — Wireframe" className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* Slider line */}
      <div className="absolute top-0 bottom-0 w-[2px] bg-white/90 pointer-events-none z-10" style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }} />

      {/* Slider handle */}
      <div
        className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[44px] h-[44px] bg-white rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.25)] flex items-center justify-center pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l6-6-6-6" />
          <path d="M9 6l-6 6 6 6" />
        </svg>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full pointer-events-none z-10">
        <span className="font-['DM_Sans',sans-serif] font-medium text-[11px]">After</span>
      </div>
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-[#0f0f0d] px-3 py-1 rounded-full pointer-events-none z-10">
        <span className="font-['DM_Sans',sans-serif] font-medium text-[11px]">Before</span>
      </div>
    </div>
  );
}

const TOTAL_STEPS = 9;
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

const STYLE_IMAGES: Record<string, string> = {
  Modern: "/r1.jpeg",
  Japandi: "/r2.jpeg",
  Scandinavian: "/r3.jpeg",
  "Wabi-sabi": "/r4.jpeg",
  Minimalist: "/r5.jpeg",
  Industrial: "/r6.jpeg",
};

// Step 1: Contact Details
function StepContact({
  data,
  onChange,
}: {
  data: { name: string; whatsapp: string; email: string };
  onChange: (field: string, value: string) => void;
}) {
  const [touched, setTouched] = useState<{ whatsapp: boolean; email: boolean }>({
    whatsapp: false,
    email: false,
  });

  const whatsappHasError = touched.whatsapp && data.whatsapp && data.whatsapp.length < 8;
  const emailHasError =
    touched.email &&
    data.email &&
    !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(data.email);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">
      {/* Left side */}
      <div className="flex-1 w-full lg:max-w-[420px]">
        <h1 className="leading-[1.1] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
          <span className="block font-normal text-[#0f0f0d]" style={{ fontSize: "clamp(28px, 3.8vw, 44px)", letterSpacing: "-0.025em" }}>
            See Your Home in 3D Before You Renovate.
          </span>
          <span className="font-normal italic text-[#9a9790]" style={{ fontSize: "clamp(22px, 2.5vw, 34px)" }}>
            Upload a photo, pick a style, get a free render.
          </span>
        </h1>
        <p className="font-['DM_Sans',sans-serif] text-[13px] md:text-[14px] text-[#6b6860] leading-[1.6] mb-8">
          We'll use your details to send your free 3D render and connect you
          with matched renovation teams when you're ready.
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full border border-[#d8d3c8] rounded-[10px] px-5 py-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#0f0f0d] outline-none focus:border-[#0f0f0d] transition-colors bg-[#fafaf8]"
          />
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="WhatsApp Number"
              value={data.whatsapp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                onChange("whatsapp", val);
              }}
              onFocus={() => setTouched((t) => ({ ...t, whatsapp: false }))}
              onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))}
              className={`w-full border rounded-[10px] px-5 py-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#0f0f0d] outline-none transition-colors bg-[#fafaf8] ${
                whatsappHasError
                  ? "border-red-400"
                  : "border-[#d8d3c8] focus:border-[#0f0f0d]"
              }`}
            />
            {whatsappHasError && (
              <p className="mt-1.5 ml-1 font-['DM_Sans',sans-serif] text-[12px] text-red-500">
                Please enter a valid 8-digit number
              </p>
            )}
          </div>
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              onFocus={() => setTouched((t) => ({ ...t, email: false }))}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={`w-full border rounded-[10px] px-5 py-4 font-['DM_Sans',sans-serif] text-[14px] text-[#0f0f0d] placeholder-[#0f0f0d] outline-none transition-colors bg-[#fafaf8] ${
                emailHasError
                  ? "border-red-400"
                  : "border-[#d8d3c8] focus:border-[#0f0f0d]"
              }`}
            />
            
            {emailHasError && (
              <p className="mt-1.5 ml-1 font-['DM_Sans',sans-serif] text-[12px] text-red-500">
                {!data.email.includes("@")
                  ? "Please include an '@' in the email address"
                  : !data.email.split("@")[1]?.includes(".")
                  ? "Please enter a complete email domain (e.g. gmail.com)"
                  : "Please enter a valid email address"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Before/After comparison slider */}
      <div className="hidden lg:flex flex-1 items-center justify-end">
        <div className="relative w-full max-w-[520px]">
          <BeforeAfterSlider />
        </div>
      </div>
    </div>
  );
}

// Step 2: Property Type
function StepPropertyType({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    {
      label: "HDB",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
          <path d="M10 9h4" />
          <path d="M10 13h4" />
        </svg>
      ),
    },
    {
      label: "Condo",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
        </svg>
      ),
    },
    {
      label: "Landed",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V10l7-7 7 7v11" />
          <path d="M9 21v-6h6v6" />
          <rect x="9" y="10" width="6" height="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        What type of property are you renovating?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        This helps us create a more accurate 3D render — every property has
        different layouts, rules, and renovation possibilities.
      </p>

      <div className="flex flex-col gap-4 max-w-[480px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.label)}
            className={`flex items-center justify-between px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] ${
              selected === opt.label
                ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {opt.label}
            </span>
            <span className="opacity-60">{opt.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 3: Timeline
function StepTimeline({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    "I've already collected my keys / ready to start",
    "In 1–3 months",
    "In 3–6 months",
    "In 6 months or later",
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        When are you planning to start your renovation?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        This helps us create a render that matches your timeline
      </p>

      <div className="flex flex-col gap-4 max-w-[520px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              selected === opt
                ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {opt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 4: Budget
function StepBudget({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = [
    "$30K – $50K",
    "$50K – $80K",
    "$80K – $100K",
    "$100K – $200K",
    "$200K – $400K",
    "$400K & Above",
  ];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        What's your estimated renovation budget?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        This helps our AI create a more realistic render for your space.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-[520px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              selected === opt
                ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {opt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 5: Meeting Preference
function StepMeetingPreference({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const options = ["Virtual", "Physical"];
  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        How would you prefer to meet your designer?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Let us know so we can arrange the right type of consultation.
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-[400px] mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center justify-center px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] ${
              selected === opt
                ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 6: Design Style
function StepDesignStyle({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  const styles = ["Modern", "Japandi", "Scandinavian", "Wabi-sabi", "Minimalist", "Industrial"];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        What design style do you want?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Pick the vibe that feels closest to what you want. This helps our AI
        create a render that actually matches your taste.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-[560px] mx-auto">
        {styles.map((style) => {
          const isSelected = selected === style;
          return (
            <motion.button
              key={style}
              onClick={() => onSelect(style)}
              layout
              className={`flex flex-col rounded-[12px] border transition-colors duration-200 bg-[#fafaf8] overflow-hidden text-left ${
                isSelected
                  ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                  : "border-[#d8d3c8] hover:border-[#9a9790]"
              }`}
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
            >
              <div className={`px-6 py-5 ${isSelected ? "bg-[#e8e4db]" : ""}`}>
                <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
                  {style}
                </span>
              </div>
              <AnimatePresence>
                {isSelected && STYLE_IMAGES[style] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 180, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <ImageWithFallback
                      src={STYLE_IMAGES[style]}
                      alt={`${style} interior`}
                      className="w-full h-[180px] object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Step 6: Upload Space
function StepUpload({
  file,
  onFileChange,
  preview,
  setPreview,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
  preview: string | null;
  setPreview: (v: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      alert("Only JPG and PNG files are accepted");
      return;
    }
    onFileChange(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Let's see your space.
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Upload a photo of your room so our AI can create a 3D render that
        matches your actual space.
      </p>

      <div className="max-w-[520px] mx-auto">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`rounded-[16px] border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center min-h-[280px] mb-5 ${
            dragOver
              ? "border-[#0f0f0d] bg-[#fafaf8]"
              : "border-[#d8d3c8] bg-[#fafaf8]"
          }`}
        >
          {preview ? (
            <div className="relative w-full h-[280px] rounded-[12px] overflow-hidden">
              <img
                src={preview}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileChange(null);
                  setPreview(null);
                }}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors shadow-md"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0f0f0d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <p className="font-['DM_Sans',sans-serif] font-semibold text-[16px] text-[#0f0f0d] mb-1">
                No Image Selected
              </p>
              <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] mb-0.5">
                Upload floorplan here.
              </p>
              <p className="font-['DM_Sans',sans-serif] text-[12px] text-[#9a9790]">
                JPG, PNG · Max 10MB
              </p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full bg-[#0f0f0d] text-white font-['DM_Sans',sans-serif] font-medium text-[15px] rounded-[12px] px-8 py-4 hover:bg-[#0f0f0d] transition-colors"
        >
          + Upload image
        </button>
      </div>
    </div>
  );
}

// Step 7: Room Type
function StepRoomType({
  selected,
  onSelect,
  uploadPreview,
}: {
  selected: string;
  onSelect: (v: string) => void;
  uploadPreview: string | null;
}) {
  const rooms = ["Living Room", "Bathroom", "Kitchen", "Dining Room", "Bedroom"];

  return (
    <div className="w-full max-w-[740px] mx-auto text-center">
      <h1 className="font-semibold text-[28px] md:text-[40px] text-[#0f0f0d] tracking-[-1.5px] leading-[1.2] mb-4" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
        Which room should we render?
      </h1>
      <p className="font-['DM_Sans',sans-serif] text-[14px] md:text-[15px] text-[#6b6860] leading-[1.6] mb-10 max-w-[520px] mx-auto">
        Our AI will create a 3D visualization based on your space, budget, and
        style.
      </p>

      {/* Preview of uploaded image */}
      <div className="max-w-[560px] mx-auto mb-10">
        <div className="w-full h-[220px] rounded-[16px] overflow-hidden bg-[#e8e4db]">
          {uploadPreview ? (
            <img
              src={uploadPreview}
              alt="Your uploaded space"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-['DM_Sans',sans-serif] text-[13px] text-[#9a9790]">
                Your uploaded image
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Room options - 2 col grid with last item centered */}
      <div className="grid grid-cols-2 gap-4 max-w-[520px] mx-auto">
        {rooms.slice(0, 4).map((room) => (
          <button
            key={room}
            onClick={() => onSelect(room)}
            className={`flex items-center px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left ${
              selected === room
                ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
                : "border-[#d8d3c8] hover:border-[#9a9790]"
            }`}
          >
            <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
              {room}
            </span>
          </button>
        ))}
      </div>
      {/* Centered last item */}
      <div className="flex justify-center mt-4 max-w-[520px] mx-auto">
        <button
          onClick={() => onSelect(rooms[4])}
          className={`flex items-center px-6 py-5 rounded-[12px] border transition-all duration-200 bg-[#fafaf8] text-left w-[calc(50%-8px)] ${
            selected === rooms[4]
              ? "border-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.1)]"
              : "border-[#d8d3c8] hover:border-[#9a9790]"
          }`}
        >
          <span className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d]">
            {rooms[4]}
          </span>
        </button>
      </div>
    </div>
  );
}

// Step 8: Render Processing
function StepThankYou({
  taskId,
  resultUrl,
  uploadPreview,
  designStyle,
  roomType,
  quoteRequestId,
  contact,
  propertyType,
  timeline,
  budget,
}: {
  taskId: string | null;
  resultUrl: string | null;
  uploadPreview: string | null;
  designStyle: string;
  contact: { name: string; whatsapp: string; email: string };
  propertyType: string;
  timeline: string;
  budget: string;
  meetingPreference: string;
  roomType: string;
  quoteRequestId: string | null;
}) {
  const [status, setStatus] = useState<string>(resultUrl ? "completed" : "processing");
  const [renderResult, setRenderResult] = useState<string | null>(resultUrl);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [resultSaved, setResultSaved] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // When render completes, save to Supabase, send to Zapier, THEN show thank you
  useEffect(() => {
    if (!renderResult || !taskId || resultSaved) return;
    setResultSaved(true);

    const saveAndNotify = async () => {
      let imageUrl = renderResult;

      // Try saving to Supabase first
      try {
        console.log("Saving render result to Supabase storage...");
        const res = await fetch(`${API_BASE}/render-save-result`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            taskId,
            resultUrl: renderResult,
            quoteRequestId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Failed to save render result:", data);
        } else {
          console.log("Render result saved:", data);
          if (data.imageStorageUrl) imageUrl = data.imageStorageUrl;
        }
      } catch (err) {
        console.error("Error saving render result:", err);
      }

      // Always send to Zapier regardless of Supabase save result
      try {
        const formData = new FormData();
        formData.append("First Name", contact.name);
        formData.append("Contact Phone", contact.whatsapp);
        formData.append("Email Address", contact.email);
        formData.append("Property Type", propertyType);
        formData.append("Renovation Budget", budget);
        formData.append("Key Date", timeline);
        formData.append("Meeting Preference", meetingPreference);
        formData.append("Lead Form", "AI 3D Render");
        formData.append("Hook Id", quoteRequestId || "");
        formData.append("3D Render Image", imageUrl);
        await fetch("https://hooks.zapier.com/hooks/catch/20249199/uzpio2p/", {
          method: "POST",
          body: formData,
        });
        console.log("Zapier notified with render image URL");
      } catch (err) {
        console.error("Zapier notification failed:", err);
      }

      // Everything done — show thank you page
      setShowThankYou(true);
    };

    saveAndNotify();
  }, [renderResult, taskId, quoteRequestId, resultSaved]);

  // Poll for result
  useEffect(() => {
    if (!taskId || renderResult) return;
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${API_BASE}/render-status/${taskId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          console.warn("Poll response not ok:", res.status);
          return;
        }

        const data = await res.json();
        console.log("Poll status:", JSON.stringify(data));

        if (data.resultUrl) {
          setStatus("completed");
          setRenderResult(data.resultUrl);
          // Zapier is called after Supabase save completes (in the save effect above)
        } else if (data.status === "failed" || data.status === "FAILED") {
          setStatus("failed");
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("Poll request timed out, will retry...");
        } else {
          console.warn("Poll fetch error (will retry):", err.message);
        }
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [taskId, renderResult]);

  // Elapsed timer while processing
  useEffect(() => {
    if (status !== "processing") return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col items-center justify-center py-10 md:py-20">
      <AnimatePresence mode="wait">
        {!showThankYou ? (
          /* Brief rendering animation — 3 seconds */
          <motion.div
            key="rendering"
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="w-full px-8 py-12 flex flex-col items-center justify-center gap-6">
              <div className="w-10 h-10 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-[20px] text-[#0f0f0d] tracking-[-0.8px] leading-[1.2]" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  Generating your AI design...
                </p>
                <p className="font-['DM_Sans',sans-serif] font-normal text-[14px] text-[#6b6860] mt-3 leading-[1.5]">
                  This typically takes 1 to 3 minutes. Please don't close this page.
                </p>
                <p className="font-['DM_Sans',sans-serif] font-normal text-[14px] text-[#9a9790] mt-2 tabular-nums leading-[1.5]">
                  Elapsed: {formatTime(elapsedSeconds)}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Thank you page */
          <motion.div
            key="thankyou"
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Check icon */}
            <div className="w-14 h-14 rounded-full bg-[#0f0f0d] flex items-center justify-center mx-auto mb-7">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>

            <h1 className="text-center leading-[1.15] mb-3" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              <span className="block font-normal text-[#0f0f0d]" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.025em" }}>
                Your AI Design is on Its Way.
              </span>
              <span className="font-normal italic text-[#9a9790]" style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                Our team will contact you shortly.
              </span>
            </h1>

            <p className="font-['DM_Sans',sans-serif] text-[15px] text-[#6b6860] leading-[1.75] mb-10 text-center max-w-[420px] mx-auto">
              A member of our team will share your AI design with you via WhatsApp along with next steps for your renovation.
            </p>

            {/* What's next card */}
            <div className="bg-[#fafaf8] rounded-[12px] border border-[#d8d3c8] p-7 mb-10">
              <p className="font-['DM_Sans',sans-serif] font-medium text-[15px] text-[#0f0f0d] mb-4">What happens next</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">Your 3D render is being generated now</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">Our team will share it with you via WhatsApp</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f0f0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17L4 12" /></svg>
                  <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6]">Get matched to verified designers who fit your budget</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => navigate("/")}
                className="h-[52px] px-8 text-[14px] font-medium hover:opacity-85 active:scale-[0.98] cursor-pointer"
                style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>
                Back to home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Progress bar
function ProgressBar({ step }: { step: number }) {
  const progress = (step / (TOTAL_STEPS - 1)) * 100; // exclude thank you from progress
  return (
    <div className="w-full h-[3px] bg-[#d8d3c8] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[#0f0f0d] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  );
}

export function RenderToolForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({
    name: "",
    whatsapp: "",
    email: "",
  });
  const [propertyType, setPropertyType] = useState("");
  const [timeline, setTimeline] = useState("");
  const [budget, setBudget] = useState("");
  const [meetingPreference, setMeetingPreference] = useState("");
  const [designStyle, setDesignStyle] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [roomType, setRoomType] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quoteRequestId, setQuoteRequestId] = useState<string | null>(null);

  // Compress image client-side to stay under Edge Function body size limits (~2MB safe)
  const compressImage = (file: File, maxWidthPx = 1600, quality = 0.75): Promise<{ base64: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        // Scale down if wider than maxWidthPx
        if (width > maxWidthPx) {
          height = Math.round((height * maxWidthPx) / width);
          width = maxWidthPx;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        // Always output as JPEG for smallest size
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        console.log(`Image compressed: ${file.size} bytes -> ~${Math.ceil(base64.length * 0.75)} bytes (${width}x${height})`);
        resolve({ base64, contentType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async () => {
    if (!uploadedFile || submitting) return;
    setSubmitting(true);

    try {
      // Step 1: Compress and upload image to storage
      console.log("Compressing image before upload...");
      const { base64: imageBase64, contentType: compressedType } = await compressImage(uploadedFile);
      console.log("Uploading compressed image to storage...");

      const uploadRes = await fetch(`${API_BASE}/render-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          imageBase64,
          fileName: uploadedFile.name.replace(/\.\w+$/, ".jpg"),
          contentType: compressedType,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        console.error("Image upload failed:", uploadData);
        alert("Failed to upload image. Please try again.");
        setSubmitting(false);
        return;
      }

      console.log("Image uploaded, URL:", uploadData.url);

      // Step 2: Create render task
      const taskRes = await fetch(`${API_BASE}/render-task`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          imageUrl: uploadData.url,
          designStyle,
          roomType,
          propertyType,
          timeline,
          budget,
          contact: {
            name: contact.name,
            whatsapp: contact.whatsapp,
            email: contact.email,
          },
        }),
      });

      const taskData = await taskRes.json();
      console.log("Render task response:", taskData);

      if (!taskRes.ok) {
        console.error("Render task creation failed:", taskData);
        alert("Failed to start render. Please try again.");
        setSubmitting(false);
        return;
      }

      setTaskId(taskData.taskId);
      if (taskData.quoteRequestId) {
        setQuoteRequestId(taskData.quoteRequestId);
      }

      // Zapier webhook fires after render completes (in StepThankYou useEffect)
      setStep(9); // Go to thank you
    } catch (err) {
      console.error("Error submitting render request:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 1:
        return (
          contact.name.trim() !== "" &&
          contact.whatsapp.trim().length === 8 &&
          /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(contact.email)
        );
      case 2:
        return propertyType !== "";
      case 3:
        return timeline !== "";
      case 4:
        return budget !== "";
      case 5:
        return meetingPreference !== "";
      case 6:
        return designStyle !== "";
      case 7:
        return uploadedFile !== null;
      case 8:
        return roomType !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif] flex flex-col overflow-x-hidden">
      {/* Header with nav */}
      <nav className="sticky top-0 z-50 bg-[#f0ede6]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-[56px] md:h-[64px] px-6 md:px-10">
          <div
            className="w-[110px] h-[23px] bg-[#2b2b2b] shrink-0 cursor-pointer"
            onClick={() => navigate("/")}
            style={{
              maskImage: `url('${imgRectangle1}')`,
              maskSize: "111.804px 22.909px",
              maskRepeat: "no-repeat",
              maskPosition: "0px 0px",
              WebkitMaskImage: `url('${imgRectangle1}')`,
              WebkitMaskSize: "111.804px 22.909px",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "0px 0px",
            }}
          />
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Home</a>
            <a href="/render-tool" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>3D Render</a>
            <a href="/floorplan3d" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Floor Layout Planner</a>
            <a href="/cost-guide" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Cost Guide</a>
            <a href="/networkxhandshake" className="text-[13px] font-normal cursor-pointer hover:opacity-60" style={{ color: "#6b6860", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Handshake</a>
          </div>
          <a href="/" className="hidden md:block text-[12px] font-medium px-5 py-2.5 hover:opacity-80 no-underline" style={{ background: "#0f0f0d", color: "#fafaf8", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>Get matched</a>
        </div>
        <div className="h-[1px]" style={{ background: "#d8d3c8" }} />
      </nav>

      {/* Main content area */}
      <main className="flex-1 flex items-center px-6 md:px-12">
        <div className="max-w-[1293px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 1 && (
                <StepContact
                  data={contact}
                  onChange={(field, value) =>
                    setContact((prev) => ({ ...prev, [field]: value }))
                  }
                />
              )}
              {step === 2 && (
                <StepPropertyType
                  selected={propertyType}
                  onSelect={setPropertyType}
                />
              )}
              {step === 3 && (
                <StepTimeline selected={timeline} onSelect={setTimeline} />
              )}
              {step === 4 && (
                <StepBudget selected={budget} onSelect={setBudget} />
              )}
              {step === 5 && (
                <StepMeetingPreference selected={meetingPreference} onSelect={setMeetingPreference} />
              )}
              {step === 6 && (
                <StepDesignStyle
                  selected={designStyle}
                  onSelect={setDesignStyle}
                />
              )}
              {step === 7 && (
                <StepUpload file={uploadedFile} onFileChange={setUploadedFile} preview={preview} setPreview={setPreview} />
              )}
              {step === 8 && (
                <StepRoomType
                  selected={roomType}
                  onSelect={setRoomType}
                  uploadPreview={preview}
                />
              )}
              {step === 9 && <StepThankYou taskId={taskId} resultUrl={resultUrl} uploadPreview={preview} designStyle={designStyle} roomType={roomType} quoteRequestId={quoteRequestId} contact={contact} propertyType={propertyType} timeline={timeline} budget={budget} meetingPreference={meetingPreference} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      {step < 9 && (
        <footer className="px-6 md:px-12 pb-8 md:pb-10">
          <div className="max-w-[1293px] mx-auto">
            {/* Progress bar */}
            <div className="mb-6">
              <ProgressBar step={step} />
            </div>

            <div className="flex items-center justify-between">
              {/* Back button */}
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="font-['DM_Sans',sans-serif] font-medium text-[14px] text-[#0f0f0d] bg-[#fafaf8] border border-[#d8d3c8] rounded-[10px] px-8 py-3 hover:bg-[#e8e4db] transition-colors shadow-[0px_1px_3px_rgba(0,0,0,0.06)]"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Next button */}
              <button
                onClick={step === 8 ? handleSubmit : handleNext}
                disabled={!canGoNext() || (step === 8 && submitting)}
                className={`font-['DM_Sans',sans-serif] font-medium text-[14px] text-white rounded-[10px] px-8 py-3 transition-all duration-200 ${
                  canGoNext() && !(step === 8 && submitting)
                    ? "bg-[#0f0f0d] hover:bg-[#0f0f0d] shadow-[0px_4px_12px_rgba(0,0,0,0.15)]"
                    : "bg-[#d4d4d8] cursor-not-allowed"
                }`}
              >
                {step === 8
                  ? submitting
                    ? "Generating..."
                    : "Generate Render"
                  : "Next"}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}