import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  MapPin, BadgeCheck, DollarSign, Ruler, Layers, ArrowUp, ArrowLeft, ArrowRight,
  ZoomIn, X, ChevronLeft, ChevronRight, Play, Calendar, HardHat, Wrench,
  Star, Send, CheckCircle, ChevronDown, Camera, FileText, ShieldCheck, MessageSquare,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { resolveAsset } from "../utils/resolveAsset";
import { Navbar } from "./Navbar";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface GalleryImg { src: string; caption?: string; room?: string; }
interface SimilarProject {
  id: number; image: string; title: string; firm: string; location: string;
  budget: string; type: string; style: string; size: string; verified: boolean; tags: string[];
}

// ─── Demo Data (will be replaced by KV data per designer) ──────────────────────
const HERO_IMAGE = "https://images.unsplash.com/photo-1672927936377-97d1be3976cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsdXh1cnklMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzcyMjE5MDM3fDA&ixlib=rb-4.1.0&q=80&w=1080";

const BEFORE_IMAGES: GalleryImg[] = [
  { src: "https://images.unsplash.com/photo-1638890929259-ba364d3a0d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGFwYXJ0bWVudCUyMGJhcmUlMjB3YWxscyUyMHJlbm92YXRpb24lMjBiZWZvcmV8ZW58MXx8fHwxNzcyMjcxMTE0fDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Living area in original developer condition" },
  { src: "https://images.unsplash.com/photo-1676502576266-b9bebcbc033d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMGJhcmUlMjBraXRjaGVuJTIwYmVmb3JlJTIwcmVub3ZhdGlvbnxlbnwxfHx8fDE3NzIyNzExMTl8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Open kitchen — basic fittings, no storage" },
  { src: "https://images.unsplash.com/photo-1639379381376-3aad8fa8b7d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbXB0eSUyMHJvb20lMjBjb25jcmV0ZSUyMGZsb29yJTIwYmFyZSUyMHdhbGxzJTIwYmVmb3JlfGVufDF8fHx8MTc3MjI3MTEyNHww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Master bedroom — bare concrete, no finishes" },
];

const DESIGN_IMAGES: GalleryImg[] = [
  { src: "https://images.unsplash.com/photo-1707968781621-db823bedc3d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMG1vb2Rib2FyZCUyMG1vb2QlMjBpbnNwaXJhdGlvbnxlbnwxfHx8fDE3NzIyNzExMTV8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Primary moodboard — Japandi warmth & texture" },
  { src: "https://images.unsplash.com/photo-1724786594289-41ebbf53a35b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMHJlbmRlciUyMDNkJTIwdmlzdWFsaXphdGlvbiUyMGZsb29yJTIwcGxhbnxlbnwxfHx8fDE3NzIyNzExMTl8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "3D render — living & dining layout proposal" },
  { src: "https://images.unsplash.com/photo-1625343517206-44d93e5f7953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbSUyMHNvZmElMjB3YXJtJTIwdG9uZXMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzIyNzExMjN8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Style reference — warm tones, tactile layering" },
];

const WIP_IMAGES: GalleryImg[] = [
  { src: "https://images.unsplash.com/photo-1634586621169-93e12e0bd604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjByZW5vdmF0aW9uJTIwd29yayUyMGluJTIwcHJvZ3Jlc3N8ZW58MXx8fHwxNzcyMjA2MjY2fDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Structural works — week 3" },
  { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwcmVub3ZhdGlvbiUyMGNvbnN0cnVjdGlvbiUyMHdvcmtlcnN8ZW58MXx8fHwxNzc0MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Joinery fitting — week 10" },
];

const FINAL_IMAGES: GalleryImg[] = [
  { src: "https://images.unsplash.com/photo-1672927936377-97d1be3976cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsdXh1cnklMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzcyMjE5MDM3fDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Living Room — The social heart", room: "Living Room" },
  { src: "https://images.unsplash.com/photo-1771372343841-d7d1b58391a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjYWJpbmV0cyUyMG1hcmJsZSUyMGNvdW50ZXJ0b3B8ZW58MXx8fHwxNzcyMjcxMTIwfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Kitchen — Sage joinery meets honed marble", room: "Kitchen" },
  { src: "https://images.unsplash.com/photo-1758448511421-debb41f3e621?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBkaW5pbmclMjByb29tJTIwcGVuZGFudCUyMGxpZ2h0cyUyMHdvb2QlMjB0YWJsZXxlbnwxfHx8fDE3NzIyNzExMjF8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Dining Room — Oak island under statement pendants", room: "Dining" },
  { src: "https://images.unsplash.com/photo-1765547090903-348b711f0eee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2FuZGluYXZpYW4lMjBtaW5pbWFsaXN0JTIwYmVkcm9vbSUyMGZpbmFsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyMjcxMTE2fDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Master Bedroom — Calm, restful, refined", room: "Bedroom" },
  { src: "https://images.unsplash.com/photo-1771681587476-f2846a2c9102?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXRocm9vbSUyMG1hcmJsZSUyMHRpbGVzJTIwbHV4dXJ5JTIwc2hvd2VyfGVufDF8fHx8MTc3MjI3MTEyM3ww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Master Bath — Marble slab, rain shower", room: "Bathroom" },
  { src: "https://images.unsplash.com/photo-1766330977451-de1b64b5e641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBob21lJTIwb2ZmaWNlJTIwc3R1ZHklMjByb29tJTIwYm9va3NoZWxmfGVufDF8fHx8MTc3MjI3MTEyMXww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Study / Reading Nook — Built-in shelving", room: "Study" },
];

const SIMILAR_PROJECTS: SimilarProject[] = [
  { id: 1, image: "https://images.unsplash.com/photo-1625343517206-44d93e5f7953?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbSUyMHNvZmElMjB3YXJtJTIwdG9uZXMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzIyNzExMjN8MA&ixlib=rb-4.1.0&q=80&w=400", title: "The Mercer Loft", firm: "Studio Haven", location: "Tanjong Pagar", budget: "$98k", type: "Condo", style: "Japandi", size: "1,200 sqft", verified: true, tags: ["Japandi", "Full Reno", "Open Plan"] },
  { id: 2, image: "https://images.unsplash.com/photo-1765547090903-348b711f0eee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2FuZGluYXZpYW4lMjBtaW5pbWFsaXN0JTIwYmVkcm9vbSUyMGZpbmFsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyMjcxMTE2fDA&ixlib=rb-4.1.0&q=80&w=400", title: "The Highline", firm: "Atelier Nord", location: "Buona Vista", budget: "$135k", type: "Condo", style: "Scandinavian", size: "1,600 sqft", verified: true, tags: ["Scandinavian", "Full Reno", "4-Bedroom"] },
  { id: 3, image: "https://images.unsplash.com/photo-1771372343841-d7d1b58391a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwd2hpdGUlMjBjYWJpbmV0cyUyMG1hcmJsZSUyMGNvdW50ZXJ0b3B8ZW58MXx8fHwxNzcyMjcxMTIwfDA&ixlib=rb-4.1.0&q=80&w=400", title: "Casa Verde", firm: "Greenline Design", location: "Holland Village", budget: "$112k", type: "Condo", style: "Biophilic", size: "1,350 sqft", verified: true, tags: ["Biophilic", "Marble", "Full Reno"] },
];

const TIMELINE = [
  { week: "Week 1–2", label: "Hacking & Demolition", done: true },
  { week: "Week 3–5", label: "Electrical & Plumbing Rough-in", done: true },
  { week: "Week 6–8", label: "Wall, Ceiling & Floor Works", done: true },
  { week: "Week 9–11", label: "Carpentry & Joinery Fitting", done: true },
  { week: "Week 12–13", label: "Painting & Final Finishes", done: true },
  { week: "Week 14", label: "Styling & Handover", done: true },
];

// ─── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: {
  images: GalleryImg[]; currentIndex: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "ArrowRight") onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
  }, [handleKeyDown]);

  const current = images[currentIndex];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <button className="absolute top-5 right-5 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2" onClick={onClose}><X size={22} /></button>
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-widest font-medium">{currentIndex + 1} / {images.length}</div>
      {images.length > 1 && <button className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft size={24} /></button>}
      <div className="relative max-w-5xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
        <img src={current.src} alt={current.caption || ""} className="max-w-full max-h-[80vh] object-contain" style={{ borderRadius: "17px", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }} />
        {current.caption && <p className="text-white/70 text-sm text-center mt-4 font-normal">{current.caption}</p>}
      </div>
      {images.length > 1 && <button className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3" onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight size={24} /></button>}
      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((img, i) => (
            <div key={i} className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}>
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryImage({ src, caption, className = "", style, onClick }: {
  src: string; caption?: string; className?: string; style?: React.CSSProperties; onClick: () => void;
}) {
  return (
    <div className={`relative group cursor-pointer overflow-hidden ${className}`} style={style} onClick={onClick}>
      <img src={src} alt={caption || ""} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3"><ZoomIn size={20} className="text-white" /></div>
      </div>
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)" }}>
          <span className="text-white text-xs font-medium leading-snug">{caption}</span>
        </div>
      )}
    </div>
  );
}

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3.5 py-2">
      {icon && <span className="text-white/60">{icon}</span>}
      <span className="text-white/55 text-xs font-normal">{label}:</span>
      <span className="text-white text-xs font-semibold">{value}</span>
    </div>
  );
}

// ─── Section Label Pill ────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center bg-[#F6F6F6] border border-[#E5E7EB] rounded-full px-4 py-1.5 mb-3">
      <span className="text-xs font-medium text-[#09090B] tracking-[-0.4px]">{label}</span>
    </div>
  );
}

// ─── Primary CTA Button (Pill) ────────────────────────────────────────────────
function PillCTA({ label, onClick, size = "medium" }: { label: string; onClick?: () => void; size?: "small" | "medium" }) {
  const sizeClass = size === "small" ? "px-5 py-3" : "px-8 py-4";
  return (
    <div className="inline-flex items-center bg-[#F6F6F6] border border-white rounded-full p-1">
      <button onClick={onClick} className={`${sizeClass} bg-[#09090B] text-white rounded-full font-medium text-sm tracking-[-0.7px] flex items-center gap-2 transition-all hover:bg-[#1a1a1f]`} style={{ boxShadow: "0 4px 4px rgba(0,0,0,0.25)" }}>
        {label} <ArrowRight size={14} />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export function ProjectPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [lightbox, setLightbox] = useState<{ images: GalleryImg[]; index: number } | null>(null);
  const [activeRoom, setActiveRoom] = useState("All");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const enquiryRef = useRef<HTMLElement>(null);

  const rooms = ["All", "Living Room", "Kitchen", "Dining", "Bedroom", "Bathroom", "Study"];
  const filteredFinal = activeRoom === "All" ? FINAL_IMAGES : FINAL_IMAGES.filter((img) => img.room === activeRoom);

  const firmName = "Luminary Interiors";
  const firmInitials = "LI";
  const projectTitle = "The Aldrich Residence";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══ NAVBAR (same as homepage) ═══════════════════════════════════════ */}
      <Navbar />

      {/* ═══ HERO ═════════════════���═══════════════════════════════════════════ */}
      <section className="max-w-[1270px] mx-auto px-4 md:px-8 pt-36 md:pt-40 pb-2">
        <div className="relative w-full overflow-hidden" style={{ borderRadius: "29px", height: "min(88vh, 700px)" }}>
          <img src={HERO_IMAGE} alt={projectTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.3) 50%, rgba(9,9,11,0.05) 100%)", borderRadius: "inherit" }} />

          {/* Top badges */}
          <div className="absolute top-6 left-6 flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-[#FFF6DC] border border-[#FFEAB1] text-[#09090B] text-xs font-medium px-3 py-1.5 rounded-full" style={{ boxShadow: "0 8px 33.4px rgba(0,0,0,0.18)" }}>
              <BadgeCheck size={13} className="text-[#09090B]" /> Verified Project
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] text-white border border-white/25 font-bold">{firmInitials}</div>
                <span className="text-white/75 text-sm">{firmName}</span>
              </div>
              <h1 className="text-white font-semibold mb-3" style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-2.4px" }}>{projectTitle}</h1>
              <div className="flex items-center gap-1.5 text-white/70 text-sm mb-7">
                <MapPin size={14} className="text-white/50" /> <span>Orchard Road, Singapore</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <StatPill icon={<DollarSign size={13} />} label="Budget" value="$120,000" />
                <StatPill icon={<Ruler size={13} />} label="Size" value="1,450 sqft" />
                <StatPill icon={<Layers size={13} />} label="Scope" value="Full Renovation" />
                <StatPill icon={null} label="Type" value="Condominium" />
                <StatPill icon={null} label="Duration" value="14 Weeks" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BEFORE ══════════════════════════════════════════════════════════ */}
      <section id="before" className="max-w-[1270px] mx-auto px-4 md:px-8 pt-10 pb-20">
        <SectionLabel label="Where It Began" />
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-[#09090B] font-semibold mt-1" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>Before</h2>
            <p className="text-[#71717A] mt-3 max-w-md leading-relaxed text-lg font-normal">
              The starting canvas — a 1,450 sqft condominium unit in bare developer-standard finishes, with no personality and a disconnected layout.
            </p>
          </div>
          <div className="bg-white rounded-[17px] px-6 py-5 max-w-xs border border-[#F3F4F6]" style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
            <p className="text-xs text-[#ABABAB] uppercase tracking-widest mb-1 font-medium">Design Brief</p>
            <p className="text-[#747474] leading-relaxed text-sm font-normal">
              "We want warmth, openness, and a home that feels curated — not cookie-cutter. Something that tells our story."
            </p>
            <p className="text-xs text-[#ABABAB] mt-2 font-normal">— The Aldrich Family</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GalleryImage src={BEFORE_IMAGES[0].src} caption={BEFORE_IMAGES[0].caption} style={{ height: "440px", borderRadius: "17px" }} onClick={() => setLightbox({ images: BEFORE_IMAGES, index: 0 })} />
          <div className="flex flex-col gap-5" style={{ height: "440px" }}>
            {BEFORE_IMAGES.slice(1, 3).map((img, i) => (
              <GalleryImage key={i} src={img.src} caption={img.caption} className="flex-1" style={{ borderRadius: "17px" }} onClick={() => setLightbox({ images: BEFORE_IMAGES, index: i + 1 })} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DESIGN DIRECTION ════════════════════════════════════════════════ */}
      <section id="design" className="py-20 bg-[#F6F6F6]">
        <div className="max-w-[1270px] mx-auto px-4 md:px-8">
          <SectionLabel label="The Vision Behind It" />
          <h2 className="text-[#09090B] font-semibold mt-1 mb-4" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>Design Direction</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <p className="text-[#747474] leading-relaxed text-lg font-normal">
              The design concept was anchored in Japandi sensibility — the harmonious blend of Japanese minimalism and Scandinavian warmth. We sought to create spaces that breathe, that invite stillness, and that age gracefully.
            </p>
            <div>
              <p className="text-[#71717A] leading-relaxed text-lg font-normal">
                Every material choice was deliberate. Pale oak flooring throughout. Hand-trowelled limewash walls for depth. Brushed brass accents — sparingly applied — for warmth and continuity.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Japandi", "Warm Neutrals", "Tactile Textures", "Biophilic", "Open Plan"].map((tag) => (
                  <span key={tag} className="text-sm text-[#09090B] bg-white border border-[#E5E7EB] rounded-full px-4 py-1.5 font-normal">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: "2fr 1fr" }}>
            <GalleryImage src={DESIGN_IMAGES[0].src} caption={DESIGN_IMAGES[0].caption} className="w-full" style={{ height: "480px", borderRadius: "17px" }} onClick={() => setLightbox({ images: DESIGN_IMAGES, index: 0 })} />
            <div className="flex flex-col gap-5" style={{ height: "480px" }}>
              {DESIGN_IMAGES.slice(1, 3).map((img, i) => (
                <GalleryImage key={i} src={img.src} caption={img.caption} className="flex-1" style={{ borderRadius: "17px" }} onClick={() => setLightbox({ images: DESIGN_IMAGES, index: i + 1 })} />
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div className="mt-8 p-7 bg-white rounded-[17px] flex flex-wrap gap-6 items-center border border-[#F3F4F6]">
            <div>
              <p className="text-xs text-[#ABABAB] uppercase tracking-widest mb-2 font-medium">Colour Palette</p>
              <div className="flex gap-3">
                {[{ color: "#e8e0d4", name: "Linen" }, { color: "#c4a98a", name: "Warm Brass" }, { color: "#7a6a50", name: "Oak" }, { color: "#4a5a4a", name: "Sage" }, { color: "#2a2520", name: "Ebony" }].map((s) => (
                  <div key={s.name} className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full border border-[#E5E7EB]" style={{ background: s.color, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }} />
                    <span className="text-[10px] text-[#ABABAB]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-12 w-px bg-[#E5E7EB] hidden md:block" />
            <div>
              <p className="text-xs text-[#ABABAB] uppercase tracking-widest mb-2 font-medium">Key Materials</p>
              <div className="flex flex-wrap gap-2">
                {["Pale Oak Flooring", "Limewash Walls", "Honed Marble", "Brushed Brass", "Sage Joinery"].map((m) => (
                  <span key={m} className="text-xs text-[#09090B] bg-[#F6F6F6] rounded-full px-3 py-1 border border-[#E5E7EB] font-normal">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRANSFORMATION ══════════════════════════════════════════════════ */}
      <section id="transformation" className="max-w-[1270px] mx-auto px-4 md:px-8 py-20">
        <SectionLabel label="Walls Coming Down" />
        <h2 className="text-[#09090B] font-semibold mt-1 mb-3" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>Transformation</h2>
        <p className="text-[#71717A] mb-12 max-w-xl leading-relaxed text-lg font-normal">
          Fourteen weeks of meticulous craftsmanship, documented from demolition day to final coat.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-5">
              {WIP_IMAGES.map((img, i) => (
                <GalleryImage key={i} src={img.src} caption={img.caption} style={{ height: "250px", borderRadius: "17px" }} onClick={() => setLightbox({ images: WIP_IMAGES, index: i })} />
              ))}
            </div>
            {/* Video placeholder */}
            <div className="relative overflow-hidden bg-[#09090B] cursor-pointer group" style={{ height: "270px", borderRadius: "17px" }} onClick={() => setVideoPlaying(!videoPlaying)}>
              {!videoPlaying ? (
                <>
                  <img src={WIP_IMAGES[0].src} alt="Video thumbnail" className="w-full h-full object-cover opacity-35" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 group-hover:bg-white/25 transition-colors">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-semibold">Renovation Timelapse</p>
                      <p className="text-white/55 text-xs mt-0.5 font-normal">14 weeks · 3 min 42 sec</p>
                    </div>
                  </div>
                </>
              ) : (
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" className="w-full h-full" allow="autoplay" title="Renovation Timelapse" />
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[17px] p-7 h-full border border-[#F3F4F6]" style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
              <p className="text-xs text-[#ABABAB] uppercase tracking-widest mb-6 font-medium">Project Timeline</p>
              <div className="flex flex-col gap-0">
                {TIMELINE.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-[#09090B] text-white" : "bg-[#E5E7EB] text-[#ABABAB]"}`}>
                        <span className="text-[9px]">✓</span>
                      </div>
                      {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] my-1" style={{ minHeight: "28px" }} />}
                    </div>
                    <div className="pb-5">
                      <p className="text-[10px] tracking-widest uppercase text-[#71717A] mb-0.5 font-semibold">{item.week}</p>
                      <p className="text-sm text-[#09090B] font-medium">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E5E7EB] mt-2 pt-5 grid grid-cols-2 gap-4">
                {[{ label: "Contractors", value: "7 Trades" }, { label: "Milestones", value: "12 Passed" }, { label: "Site Visits", value: "28 Total" }, { label: "On Schedule", value: "100%" }].map((s) => (
                  <div key={s.label}>
                    <p className="text-xs text-[#ABABAB] font-normal">{s.label}</p>
                    <p className="text-sm text-[#09090B] mt-0.5 font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL REVEAL ════════════════════════════════════════════════════ */}
      <section id="final-reveal" className="py-20 bg-[#F6F6F6]">
        <div className="max-w-[1270px] mx-auto px-4 md:px-8">
          <SectionLabel label="The Finished Home" />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-[#09090B] font-semibold mt-1 mb-2" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>Final Reveal</h2>
              <p className="text-[#71717A] max-w-md leading-relaxed text-lg font-normal">
                The finished home — every room a testament to patience, precision, and a considered design process.
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:pb-0 scrollbar-none">
              {rooms.map((room) => (
                <button key={room} onClick={() => setActiveRoom(room)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition-all whitespace-nowrap shrink-0 font-medium tracking-[-0.35px] ${
                    activeRoom === room ? "bg-[#09090B] text-white border-[#09090B]" : "bg-white text-[#71717A] border-[#E5E7EB] hover:border-[#09090B] hover:text-[#09090B]"
                  }`}
                >{room}</button>
              ))}
            </div>
          </div>

          <GalleryImage src={filteredFinal[0]?.src} caption={filteredFinal[0]?.caption} className="w-full mb-5" style={{ height: "clamp(220px, 42vw, 560px)", borderRadius: "17px" }} onClick={() => setLightbox({ images: filteredFinal, index: 0 })} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {filteredFinal.slice(1).map((img, i) => (
              <GalleryImage key={i} src={img.src} caption={img.caption} style={{ height: "clamp(140px, 22vw, 270px)", borderRadius: "17px" }} onClick={() => setLightbox({ images: filteredFinal, index: i + 1 })} />
            ))}
          </div>

          {/* Quote block */}
          <div className="mt-14 bg-[#09090B] p-8 md:p-12 text-center" style={{ borderRadius: "29px" }}>
            <div className="text-4xl text-white/20 mb-4" style={{ fontFamily: "Georgia, serif" }}>"</div>
            <p className="text-[#B0B0B0] max-w-2xl mx-auto leading-relaxed text-lg font-light italic">
              Working with Luminary Interiors was the single best decision we made during our renovation. They listened deeply, challenged us thoughtfully, and delivered a home that feels entirely, completely ours.
            </p>
            <div className="flex items-center justify-center gap-3 mt-7">
              <div className="w-10 h-10 bg-[#374151] rounded-full flex items-center justify-center text-white text-xs font-bold">AT</div>
              <div className="text-left">
                <p className="text-white font-semibold">Alex & Tricia Aldrich</p>
                <p className="text-[#B0B0B0] text-xs font-normal">Homeowners · Orchard Road, Singapore</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VERIFIED BLOCK ══════════════════════════════════════════════════ */}
      <section className="max-w-[1270px] mx-auto px-4 md:px-8 py-16">
        <div className="bg-white rounded-[17px] p-8 border border-[#F3F4F6]" style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 mb-7">
            <BadgeCheck size={20} className="text-[#09090B]" />
            <span className="text-[#09090B] font-semibold">About This Listing</span>
            <div className="flex-1 h-px bg-[#E5E7EB] ml-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <BadgeCheck size={18} />, title: "Verified Project", desc: "Client identity and ownership confirmed." },
              { icon: <Camera size={18} />, title: "Documented by Network", desc: "Photography captured by our certified team." },
              { icon: <FileText size={18} />, title: "Details Reviewed", desc: "Budget, scope, and specs validated by editorial." },
              { icon: <ShieldCheck size={18} />, title: "Firm Accredited", desc: "Active accreditation with our network." },
            ].map((b, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-[12px] bg-[#F6F6F6] flex items-center justify-center shrink-0 mt-0.5 text-[#09090B]">{b.icon}</div>
                <div>
                  <p className="text-[#09090B] font-semibold text-sm">✔ {b.title}</p>
                  <p className="text-[#ABABAB] mt-1 leading-relaxed text-sm font-normal">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E5E7EB] mt-8 pt-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-[#09090B] flex items-center justify-center text-white text-sm font-bold">{firmInitials}</div>
              <div>
                <p className="text-[#09090B] font-semibold">{firmName}</p>
                <p className="text-xs text-[#ABABAB] font-normal">Est. 2014 · Singapore · 87 Projects Completed</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {"★★★★★".split("").map((s, i) => <span key={i} className="text-[#09090B] text-xs">{s}</span>)}
                  <span className="text-xs text-[#ABABAB] ml-1 font-normal">4.9 (142 reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Full Renovation", "Condominium", "Landed", "Commercial"].map((tag) => (
                <span key={tag} className="text-xs text-[#09090B] bg-[#F6F6F6] rounded-full px-3 py-1 border border-[#E5E7EB] font-normal">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SIMILAR PROJECTS ════════════════════════════════════════════════ */}
      <section className="max-w-[1270px] mx-auto px-4 md:px-8 pb-20">
        <SectionLabel label="You Might Also Like" />
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-[#09090B] font-semibold" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>Similar Projects</h2>
            <p className="text-[#71717A] mt-2 text-lg font-normal">Curated based on similar budget, property type, and renovation scope.</p>
          </div>
          <PillCTA label="Browse All" size="small" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIMILAR_PROJECTS.map((p) => (
            <div key={p.id} className="group bg-white rounded-[17px] overflow-hidden border border-[#F3F4F6] hover:border-[#E5E7EB] transition-all duration-300" style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
              <div className="relative overflow-hidden" style={{ height: "230px" }}>
                <img src={resolveAsset(p.image)} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                {p.verified && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#FFF6DC] border border-[#FFEAB1] rounded-full px-2.5 py-1">
                    <BadgeCheck size={11} className="text-[#09090B]" />
                    <span className="text-[10px] text-[#09090B] font-semibold">Verified</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#09090B]/75 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-medium">{p.type}</div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[#09090B] font-bold text-base tracking-[-0.5px]">{p.title}</h3>
                  <span className="text-[#09090B] text-sm shrink-0 font-bold">{p.budget}</span>
                </div>
                <p className="text-[#71717A] text-sm mb-3 font-normal">{p.firm}</p>
                <div className="flex items-center gap-1 text-[#ABABAB] text-xs mb-3 font-normal">
                  <MapPin size={11} className="text-[#71717A]" /> {p.location} <span className="mx-1 text-[#E5E7EB]">·</span> {p.size}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-[#09090B] bg-[#F6F6F6] rounded-full px-2.5 py-0.5 border border-[#E5E7EB] font-normal">{tag}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 text-xs border border-[#E5E7EB] rounded-[14px] text-[#09090B] hover:border-[#09090B] transition-all bg-transparent font-medium tracking-[-0.35px]">View Project</button>
                  <PillCTA label="Enquire" onClick={() => setEnquiryOpen(true)} size="small" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ENQUIRY SECTION ═════════════════════════════════════════════════ */}
      <EnquiryInline sectionRef={enquiryRef} firmName={firmName} />

      {/* ═══ FOOTER CTA ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-[1170px] mx-auto text-center">
          <h2 style={{ fontSize: "48px", lineHeight: 1.1, letterSpacing: "-2.4px" }}>
            <span className="font-semibold text-[#09090B]">Love this project?</span>
            <br />
            <span className="font-medium text-[#71717A]">Start your own renovation story.</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <PillCTA label="Get Matched Now" onClick={() => navigate("/get-matched")} />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="px-4 md:px-8 pb-8">
        <div className="max-w-[1170px] mx-auto bg-[#F6F6F6] rounded-[29px] p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[#09090B] font-semibold text-lg tracking-[-0.5px]">Network</span>
              <span className="text-[#71717A] text-sm font-normal">· {projectTitle} — Case Study</span>
            </div>
            <p className="text-sm text-[#71717A] font-normal">© 2026 Interior Network. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ═══ BACK TO TOP ═════════════════════════════════════════════════════ */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "#09090B", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
      >
        <ArrowUp size={16} className="text-white" />
      </button>

      {/* ═══ LIGHTBOX ════════════════════════════════════════════════════════ */}
      {lightbox && (
        <Lightbox images={lightbox.images} currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox((prev) => prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null)}
          onNext={() => setLightbox((prev) => prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null)}
        />
      )}

      {/* ═══ ENQUIRY MODAL ═══════════════════════════════════════════════════ */}
      {enquiryOpen && <EnquiryModal firmName={firmName} onClose={() => setEnquiryOpen(false)} />}
    </div>
  );
}

// ─── Enquiry Inline Section ────────────────────────────────────────────────────
function EnquiryInline({ sectionRef, firmName }: { sectionRef: React.RefObject<HTMLElement | null>; firmName: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", propertyType: "", budget: "", stylePreference: "" });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <section ref={sectionRef} className="py-20 px-4 md:px-8" style={{ background: "#09090B", borderRadius: 0 }}>
      <div className="max-w-[1170px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          <div className="lg:col-span-2">
            <SectionLabel label="Start a Conversation" />
            <h2 className="text-white font-semibold mt-2 mb-4" style={{ fontSize: "48px", letterSpacing: "-2.4px", lineHeight: 1.1 }}>
              Ready to Transform<br />Your Home?
            </h2>
            <p className="text-[#B0B0B0] leading-relaxed text-lg font-normal mb-8">
              Share your project details with {firmName} and receive a personalised consultation within 1–2 business days.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: "⚡", title: "Fast Response", desc: "Reply within 24 hours" },
                { icon: "🔒", title: "Privacy First", desc: "Your data stays confidential" },
                { icon: "🎯", title: "No Obligation", desc: "Initial consultation is free" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 bg-white/5 rounded-[17px] border border-white/10">
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-[#B0B0B0] text-sm font-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-[17px] p-8 border border-[#F3F4F6]" style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
              {submitted ? (
                <div className="py-12 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-[#F6F6F6] rounded-full flex items-center justify-center mb-2"><CheckCircle size={32} className="text-[#09090B]" /></div>
                  <h3 className="text-[#09090B] font-semibold text-xl tracking-[-0.5px]">Your Enquiry is Sent!</h3>
                  <p className="text-[#71717A] text-sm max-w-xs leading-relaxed font-normal">{firmName} will review your details and get back within 1–2 business days.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Full Name *" type="text" placeholder="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                    <FormField label="Phone" type="tel" placeholder="+65 9xxx xxxx" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  </div>
                  <FormField label="Email Address *" type="email" placeholder="your@email.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <div className="grid grid-cols-3 gap-4">
                    <FormSelect label="Property Type" value={form.propertyType} options={["HDB", "Condominium", "Landed", "Commercial"]} onChange={(v) => setForm({ ...form, propertyType: v })} />
                    <FormSelect label="Budget (S$)" value={form.budget} options={["Under S$30k", "S$30k–S$60k", "S$60k–S$100k", "S$100k–S$150k", "S$150k+"]} onChange={(v) => setForm({ ...form, budget: v })} />
                    <FormSelect label="Style" value={form.stylePreference} options={["Japandi", "Scandinavian", "Modern", "Contemporary", "Minimalist"]} onChange={(v) => setForm({ ...form, stylePreference: v })} />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-[#09090B] hover:bg-[#1a1a1f] text-white rounded-[14px] text-sm font-semibold tracking-[-0.35px] flex items-center justify-center gap-2 transition-all">
                    <Send size={15} /> Send Enquiry to {firmName}
                  </button>
                  <p className="text-center text-xs text-[#ABABAB] font-normal">Free consultation · No obligation · Confidential</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────────
function FormField({ label, type, placeholder, value, onChange, required }: {
  label: string; type: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-[#09090B] font-medium">{label}</label>
      <input required={required} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2.5 bg-[#F9FAFB] rounded-[14px] text-[#09090B] text-sm font-normal outline-none focus:ring-2 focus:ring-[#09090B]/10 placeholder:text-[#99A1AF] border border-[#E5E7EB] focus:border-[#09090B] transition-all"
      />
    </div>
  );
}

function FormSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-[#09090B] font-medium">{label}</label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-2.5 bg-[#F9FAFB] rounded-[14px] text-sm font-normal outline-none focus:ring-2 focus:ring-[#09090B]/10 border border-[#E5E7EB] focus:border-[#09090B] transition-all pr-8"
          style={{ color: value ? "#09090B" : "#99A1AF" }}
        >
          <option value="" disabled>Select</option>
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Enquiry Modal ─────────────────────────────────────────────────────────────
function EnquiryModal({ firmName, onClose }: { firmName: string; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", propertyType: "", budget: "" });

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(9,9,11,0.65)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="bg-white rounded-[17px] w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#F3F4F6]" onClick={(e) => e.stopPropagation()} style={{ boxShadow: "0 25px 35.9px rgba(0,0,0,0.07)" }}>
        <div className="flex items-start justify-between p-7 pb-4">
          <div>
            <div className="text-xs text-[#ABABAB] uppercase tracking-widest mb-1 font-medium">Send an Enquiry</div>
            <h2 className="text-[#09090B] font-semibold text-xl tracking-[-0.5px]">Get in Touch with<br />{firmName}</h2>
          </div>
          <button onClick={onClose} className="text-[#ABABAB] hover:text-[#09090B] transition-colors p-1 rounded-full hover:bg-[#F6F6F6]"><X size={20} /></button>
        </div>
        <div className="px-7 pb-7">
          {submitted ? (
            <div className="py-12 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-[#F6F6F6] rounded-full flex items-center justify-center mb-2"><CheckCircle size={32} className="text-[#09090B]" /></div>
              <h3 className="text-[#09090B] font-semibold text-xl tracking-[-0.5px]">Enquiry Sent!</h3>
              <p className="text-[#71717A] text-sm max-w-xs leading-relaxed font-normal">Thank you! {firmName} will get back to you within 1–2 business days.</p>
              <button onClick={onClose} className="mt-4 px-8 py-3 bg-[#09090B] text-white rounded-full text-sm font-medium tracking-[-0.35px] hover:bg-[#1a1a1f] transition-colors">Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Full Name *" type="text" placeholder="Jane Tan" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <FormField label="Phone" type="tel" placeholder="+65 9123 4567" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <FormField label="Email *" type="email" placeholder="jane@email.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <div className="grid grid-cols-2 gap-3">
                <FormSelect label="Property Type" value={form.propertyType} options={["HDB", "Condominium", "Landed", "Commercial"]} onChange={(v) => setForm({ ...form, propertyType: v })} />
                <FormSelect label="Budget (S$)" value={form.budget} options={["Under S$30k", "S$30k–S$60k", "S$60k–S$100k", "S$100k–S$150k", "S$150k+"]} onChange={(v) => setForm({ ...form, budget: v })} />
              </div>
              <button type="submit" className="w-full py-3.5 bg-[#09090B] hover:bg-[#1a1a1f] text-white rounded-[14px] text-sm font-semibold tracking-[-0.35px] flex items-center justify-center gap-2 transition-all">
                <Send size={15} /> Send Enquiry
              </button>
              <p className="text-center text-xs text-[#ABABAB] font-normal">Your details are shared only with this firm.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
