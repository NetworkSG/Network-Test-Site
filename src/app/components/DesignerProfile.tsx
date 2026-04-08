import { useState, useRef, useCallback, useEffect, createContext, useContext, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { sanitizeInput, sanitizeEmail } from "../utils/sanitize";
import { Navbar } from "./Navbar";
import { DesignerProfileFooter } from "./DesignerProfileFooter";
import { useDesignerData } from "./useDesignerData";
import { projectId, publicAnonKey } from "/utils/supabase/info";

// All Figma assets
import imgCover from "figma:asset/e4acf7c6e5d5f1811aa7429b53350cf1b67c5f4e.png";
import imgLogo from "figma:asset/aa188101b5fbbac719eb441e4b9accb610458b0c.png";
import imgChloe from "figma:asset/026b3e78c31a76fc3722139c09208c6cc7d88bef.png";
import imgMarcus from "figma:asset/cea54ef0f554c631157697f929f8165a7aa20f93.png";
import imgSuLin from "figma:asset/764080aebb8990bae415c1d32da309e78b076802.png";
import imgHafiz from "figma:asset/f13abbb8a968f0d63754415ad9d7f0e5a067d7a9.png";
import imgAiken from "figma:asset/772d5ab73165b6c6919706089e98ec03e7c8d086.png";
import imgRachel from "figma:asset/a3218feba2b82b2fde4d5ba04b711e31e28c2bba.png";
import imgFelicia from "figma:asset/de1f917c8bf2b7a9d1ce0dd9b4cb7ea763a941c2.png";
import imgWoodlands from "figma:asset/ffd9ddd9c56ad6f3d25ba20494e45bfec9148e73.png";
import imgHdb from "figma:asset/353919418b571292ef4b918498a0af1081842bf9.png";
import imgBca from "figma:asset/e75107ea0a4bae3c90b327e26766d1616f06a552.png";
import imgProject1 from "figma:asset/0fc1637b7695f77c9a097438445025b14c96f5ea.png";
import imgProject2 from "figma:asset/bf7d0cf68bdcc66437a7818f2fc4ab1a7e5ea3c2.png";
import imgCaseStudy1 from "figma:asset/236738fc0010876d79202e07c551861413d12dd6.png";
import imgCaseStudy2 from "figma:asset/0463a32823a04486d6fd9c60bda1c48ae00b08c5.png";
import imgCaseStudy3 from "figma:asset/1180c2e58a96bb22ca91228fda602596c093082a.png";
import imgCaseStudy4 from "figma:asset/33fe462b9db17890de38439d66dfffcaad5f4c80.png";
import imgVideo from "figma:asset/cc50b8df382d8beabfb66e5f78006760af98950e.png";
import imgGoogle from "figma:asset/9d8e189b03a63d29ac5b3a7d20746b2e0a65c2ed.png";
import imgReview1 from "figma:asset/8e4350324e724a21b5e34ff048fc9e3409e5bda6.png";
import imgReview2 from "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png";
import imgReview3 from "figma:asset/7faf17d5deb54541e63777bc7ad7d74990b0b1dd.png";
import imgReview4 from "figma:asset/3bf4f3e38477a9fe4019ae13c814f9abec16f515.png";
import imgReview5 from "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png";
import imgMap from "figma:asset/d920b76cda9183f0e3d76af83d25ee01ebb6afb9.png";
import svgPaths from "../../imports/svg-73ttrm48v1";
import { motion } from "motion/react";

/* ─── IMAGE MAP: maps KV store figma:asset references → resolved import URLs ─── */
const IMAGE_MAP: Record<string, string> = {
  "figma:asset/e4acf7c6e5d5f1811aa7429b53350cf1b67c5f4e.png": imgCover,
  "figma:asset/aa188101b5fbbac719eb441e4b9accb610458b0c.png": imgLogo,
  "figma:asset/026b3e78c31a76fc3722139c09208c6cc7d88bef.png": imgChloe,
  "figma:asset/cea54ef0f554c631157697f929f8165a7aa20f93.png": imgMarcus,
  "figma:asset/764080aebb8990bae415c1d32da309e78b076802.png": imgSuLin,
  "figma:asset/f13abbb8a968f0d63754415ad9d7f0e5a067d7a9.png": imgHafiz,
  "figma:asset/772d5ab73165b6c6919706089e98ec03e7c8d086.png": imgAiken,
  "figma:asset/a3218feba2b82b2fde4d5ba04b711e31e28c2bba.png": imgRachel,
  "figma:asset/de1f917c8bf2b7a9d1ce0dd9b4cb7ea763a941c2.png": imgFelicia,
  "figma:asset/ffd9ddd9c56ad6f3d25ba20494e45bfec9148e73.png": imgWoodlands,
  "figma:asset/353919418b571292ef4b918498a0af1081842bf9.png": imgHdb,
  "figma:asset/e75107ea0a4bae3c90b327e26766d1616f06a552.png": imgBca,
  "figma:asset/0fc1637b7695f77c9a097438445025b14c96f5ea.png": imgProject1,
  "figma:asset/bf7d0cf68bdcc66437a7818f2fc4ab1a7e5ea3c2.png": imgProject2,
  "figma:asset/236738fc0010876d79202e07c551861413d12dd6.png": imgCaseStudy1,
  "figma:asset/0463a32823a04486d6fd9c60bda1c48ae00b08c5.png": imgCaseStudy2,
  "figma:asset/1180c2e58a96bb22ca91228fda602596c093082a.png": imgCaseStudy3,
  "figma:asset/33fe462b9db17890de38439d66dfffcaad5f4c80.png": imgCaseStudy4,
  "figma:asset/cc50b8df382d8beabfb66e5f78006760af98950e.png": imgVideo,
  "figma:asset/9d8e189b03a63d29ac5b3a7d20746b2e0a65c2ed.png": imgGoogle,
  "figma:asset/8e4350324e724a21b5e34ff048fc9e3409e5bda6.png": imgReview1,
  "figma:asset/51afa0ea316295d8d1d824fcab3b3afbe1092843.png": imgReview2,
  "figma:asset/7faf17d5deb54541e63777bc7ad7d74990b0b1dd.png": imgReview3,
  "figma:asset/3bf4f3e38477a9fe4019ae13c814f9abec16f515.png": imgReview4,
  "figma:asset/31cc808cd2f94feebf8d6df2be2e78773b23d567.png": imgReview5,
  "figma:asset/d920b76cda9183f0e3d76af83d25ee01ebb6afb9.png": imgMap,
};

/** Resolve a figma:asset reference or pass through URLs */
import { resolveAsset } from "../utils/resolveAsset";
function resolveImg(ref: string): string {
  return IMAGE_MAP[ref] || resolveAsset(ref) || ref;
}

/* ─── DESIGNER DATA CONTEXT ─── */
interface DesignerCtxType {
  teamMembers: any[];
  businessInfo: any[];
  caseStudyPhases: any[];
  reviews: any[];
  reviewsData: any[];
  profile: any;
  projects: any[];
  serviceArea: any;
}

const DesignerDataContext = createContext<DesignerCtxType | null>(null);
function useDesignerCtx() {
  return useContext(DesignerDataContext);
}

/** Transform raw API data into shapes matching the hardcoded constants */
function transformApiData(api: any): DesignerCtxType {
  return {
    profile: api,

    teamMembers: api.team?.map((m: any) => ({
      ...m,
      img: resolveImg(m.image),
    })) ?? [],

    businessInfo: api.businessInfo ?? [],

    caseStudyPhases: api.caseStudies?.map((cs: any) => ({
      ...cs,
      img: resolveImg(cs.image),
    })) ?? [],

    reviews: api.reviews?.map((r: any) => ({
      ...r,
      img: resolveImg(r.image),
    })) ?? [],

    reviewsData: api.latestReviews ?? [],

    projects: api.projects?.map((p: any) => ({
      ...p,
      img: resolveImg(p.image),
    })) ?? [],

    serviceArea: api.serviceArea ?? {},
  };
}

/* ─── DATA ─── */
const teamMembers = [
  { name: "Chloe", img: imgChloe, type: "person" as const, role: "Lead Designer", specialty: "Modern Minimalist", projects: 48, experience: "6 years", bio: "Specialises in clean modern aesthetics with functional space planning for HDB & condo units.", designs: [
    { img: "https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaW50ZXJpb3IlMjBsaXZpbmclMjByb29tfGVufDF8fHx8MTc3MzI3MDkzMnww&ixlib=rb-4.1.0&q=80&w=1080", label: "HDB 4-Room Living" },
    { img: "https://images.unsplash.com/photo-1714307302586-ad71c859d3ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkaW5pbmclMjByb29tJTIwaW50ZXJpb3IlMjB3aGl0ZXxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Condo Dining" },
  ]},
  { name: "Aisyah", img: imgMarcus, type: "person" as const, role: "Senior Designer", specialty: "Japandi & Scandinavian", projects: 35, experience: "5 years", bio: "Expert in blending Japanese and Scandinavian design for warm, cosy living spaces.", designs: [
    { img: "https://images.unsplash.com/photo-1718636268253-d6ad2a0aeee9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmRpJTIwc2NhbmRpbmF2aWFuJTIwYmVkcm9vbSUyMGRlc2lnbnxlbnwxfHx8fDE3NzMyNzA5MzN8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Japandi Bedroom" },
    { img: "https://images.unsplash.com/photo-1753117034598-b7cb94f80d76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YXJtJTIwd29vZCUyMGludGVyaW9yJTIwYmF0aHJvb20lMjBzcGF8ZW58MXx8fHwxNzczMjcwOTM1fDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Warm Wood Bath" },
  ]},
  { name: "Ethan", img: imgSuLin, type: "person" as const, role: "Design Consultant", specialty: "Contemporary Luxe", projects: 52, experience: "7 years", bio: "Creates luxurious yet liveable interiors with premium material selections and bespoke carpentry.", designs: [
    { img: "https://images.unsplash.com/photo-1643034738686-d69e7bc047e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb250ZW1wb3JhcnklMjBraXRjaGVuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzczMjQ5NTMwfDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Luxury Kitchen" },
    { img: "https://images.unsplash.com/photo-1572742482459-e04d6cfdd6f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtYXJibGUlMjBiYXRocm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3MzI3MDkzNnww&ixlib=rb-4.1.0&q=80&w=1080", label: "Marble Bathroom" },
  ]},
  { name: "Arjun", img: imgHafiz, type: "person" as const, role: "Project Manager", specialty: "Landed Properties", projects: 29, experience: "4 years", bio: "Manages end-to-end renovation projects with a focus on landed and multi-storey homes.", designs: [
    { img: "https://images.unsplash.com/photo-1632214533040-eb166a3b172d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kZWQlMjBwcm9wZXJ0eSUyMHJlbm92YXRpb24lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Terrace Renovation" },
    { img: "https://images.unsplash.com/photo-1765766599489-fd53df7f8724?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbnRyeXdheSUyMGhhbGx3YXklMjBkZXNpZ258ZW58MXx8fHwxNzczMjcwOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080", label: "Grand Entryway" },
  ]},
  { name: "Raj", img: imgAiken, type: "person" as const, role: "3D Visualiser", specialty: "Photorealistic Renders", projects: 60, experience: "5 years", bio: "Brings designs to life with stunning photorealistic 3D renders before renovation begins.", designs: [
    { img: "https://images.unsplash.com/photo-1642755622834-87749d4581f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzZCUyMHJlbmRlciUyMGludGVyaW9yJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "3D Living Render" },
    { img: "https://images.unsplash.com/photo-1608682285597-156feb50eb4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwaG9tZSUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzMyNzA5MzV8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Office Visualisation" },
  ]},
  { name: "Priya", img: imgRachel, type: "person" as const, role: "Junior Designer", specialty: "BTO Packages", projects: 18, experience: "2 years", bio: "Passionate about creating beautiful starter homes with smart budget-friendly solutions.", designs: [
    { img: "https://images.unsplash.com/photo-1745429523615-2a82c60bfc02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFsbCUyMGFwYXJ0bWVudCUyMGNvenklMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwxfHx8fDE3NzMyNzA5MzR8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "BTO 3-Room Cosy" },
    { img: "https://images.unsplash.com/photo-1608682285597-156feb50eb4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwaG9tZSUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzMyNzA5MzV8MA&ixlib=rb-4.1.0&q=80&w=1080", label: "Starter Home Living" },
  ]},
  { name: "Jurong", img: imgFelicia, type: "project" as const, reels: [
    { img: "https://images.unsplash.com/photo-1631152695193-61c709e578f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIREIlMjBmbGF0JTIwcmVub3ZhdGlvbiUyMHNpbmdhcG9yZSUyMG1vZGVybnxlbnwxfHx8fDE3NzMyNzEzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "HDB 5-Room BTO — Modern Minimalist", location: "Jurong West St 91", likes: 324, comments: 18 },
    { img: "https://images.unsplash.com/photo-1761123393191-3a8733313ff5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd2hpdGUlMjBraXRjaGVuJTIwcmVub3ZhdGlvbnxlbnwxfHx8fDE3NzMyNzEzMDF8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Kitchen Overhaul — Scandinavian White", location: "Jurong East Ave 1", likes: 287, comments: 12 },
    { img: "https://images.unsplash.com/photo-1768413292551-10011d6c354e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiYXRocm9vbSUyMHJlbm92YXRpb24lMjB0aWxlc3xlbnwxfHx8fDE3NzMyNzEzMDJ8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Spa-Inspired Bathroom Renovation", location: "Jurong West St 65", likes: 198, comments: 9 },
    { img: "https://images.unsplash.com/photo-1758548157747-285c7012db5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwY29uY2VwdCUyMGFwYXJ0bWVudCUyMHJlbm92YXRpb258ZW58MXx8fHwxNzczMjcxMzAyfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Open Concept Living — Before & After", location: "Taman Jurong", likes: 412, comments: 27 },
  ]},
  { name: "Woodlands", img: imgWoodlands, type: "project" as const, reels: [
    { img: "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb25kbyUyMGxpdmluZyUyMHJvb20lMjBicmlnaHR8ZW58MXx8fHwxNzczMjcxMzAxfDA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Bright Condo Living Room Makeover", location: "Woodlands Crescent", likes: 356, comments: 21 },
    { img: "https://images.unsplash.com/photo-1773101883552-1ea68c7b471b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwYmVkcm9vbSUyMGludGVyaW9yJTIwd2FybSUyMGxpZ2h0aW5nfGVufDB8fHx8MTc3MzI3MTMwMnww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Cosy Master Bedroom — Warm Japandi", location: "Woodlands Ring Rd", likes: 278, comments: 15 },
    { img: "https://images.unsplash.com/photo-1765810655728-c622e966c6ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMG1vZGVybiUyMGJhbGNvbnklMjBvdXRkb29yJTIwbGl2aW5nfGVufDB8fHx8MTc3MzI3MTMwM3ww&ixlib=rb-4.1.0&q=80&w=1080", caption: "Balcony Garden Lounge Setup", location: "Admiralty Drive", likes: 189, comments: 8 },
    { img: "https://images.unsplash.com/photo-1765279333918-949ddcb655ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWxrJTIwaW4lMjB3YXJkcm9iZSUyMGNsb3NldCUyMGx1eHVyeXxlbnwxfHx8fDE3NzMyNzEzMDN8MA&ixlib=rb-4.1.0&q=80&w=1080", caption: "Walk-In Wardrobe — Built-In Custom", location: "Woodlands Ave 6", likes: 245, comments: 14 },
  ]},
];

const businessInfo = [
  { label: "ACRA / UEN", value: "201203456R" },
  { label: "Years in operation", value: "12 years (Est. 2012)" },
  { label: "Office address", value: "5855 W Century, Ang Mo Kio, Singapore" },
  { label: "Project types", value: "HDB, Condo, Landed, Commercial" },
  { label: "Style specialisation", value: "Modern, Japandi, Minimalist" },
  { label: "Budget range", value: "$30,000 – $120,000" },
];

const caseStudyPhases = [
  {
    phase: "PHASE I",
    title: "Concept & Spatial Planning",
    desc: "We began by refining spatial flow and aligning the layout with the client's functional requirements. Material selections were curated to establish tonal consistency and long-term durability.",
    tags: [
      { label: "Space optimization", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "grid" },
      { label: "Budget alignment", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "dollar" },
      { label: "Material curation", bg: "bg-[#e9d5ff]", text: "text-[#7c3aed]", iconColor: "#7C3AED", icon: "palette" },
    ],
    img: imgCaseStudy1,
  },
  {
    phase: "PHASE II",
    title: "Site Preparation & Technical Alignment",
    desc: "Pre-construction assessments were conducted to identify structural defects and verify dimensional accuracy. All technical parameters were documented to ensure seamless contractor coordination.",
    tags: [
      { label: "Defects inspection", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "search" },
      { label: "On-site measurements", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "ruler" },
      { label: "Technical verification", bg: "bg-[#dcfce7]", text: "text-[#16a34a]", iconColor: "#16A34A", icon: "check" },
    ],
    img: imgCaseStudy2,
  },
  {
    phase: "PHASE III",
    title: "Execution & Supervision",
    desc: "Weekly progress reviews ensured adherence to technical specifications and timeline commitments. Quality control inspections were conducted at every milestone to maintain precision.",
    tags: [
      { label: "Progress monitoring", bg: "bg-[#dcfce7]", text: "text-[#16a34a]", iconColor: "#16A34A", icon: "chart" },
      { label: "Quality control", bg: "bg-[#fef3c7]", text: "text-[#d97706]", iconColor: "#D97706", icon: "shield" },
      { label: "Timeline management", bg: "bg-[#e0f2fe]", text: "text-[#0369a1]", iconColor: "#0369A1", icon: "clock" },
    ],
    img: imgCaseStudy3,
  },
  {
    phase: "PHASE IV",
    title: "Final Reveal & Handover",
    desc: "Final detailing and finishing adjustments were completed with meticulous attention to carpentry precision and lighting calibration. The project was delivered to specification and schedule.",
    tags: [
      { label: "Final detailing", bg: "bg-[#fce7f3]", text: "text-[#be185d]", iconColor: "#BE185D", icon: "sparkle" },
      { label: "Styling & finishing", bg: "bg-[#e9d5ff]", text: "text-[#9333ea]", iconColor: "#9333EA", icon: "palette" },
      { label: "Client handover", bg: "bg-[#fef3c7]", text: "text-[#ca8a04]", iconColor: "#CA8A04", icon: "key" },
    ],
    img: imgCaseStudy4,
  },
];

const reviews = [
  {
    title: "Highly Responsive and Meticulous Designer",
    text: "Did a full condo renovation with Sora Studio and had a fantastic experience. Mina and Sana were incredibly responsive and attentive to every detail — from mater...",
    fullText: "Did a full condo renovation with Sora Studio and had a fantastic experience. Mina and Sana were incredibly responsive and attentive to every detail — from material selection to colour palettes, they guided us patiently through every decision. The 3D renders were spot-on and the final result exceeded our expectations. Communication was always prompt, and they kept us updated at every stage. Highly recommend for anyone looking for a professional yet personal touch!",
    name: "Emily Chen",
    date: "March 2024",
    initial: "E",
    bgColor: "bg-[#f55]",
    textColor: "text-white",
    img: imgReview1,
    hasVideo: false,
  },
  {
    title: "Professional, creative, and reliable",
    text: "From the first consultation to handover, the experience was smooth and reassuring. The designer understood our vision immediately and proposed practical solutio...",
    fullText: "From the first consultation to handover, the experience was smooth and reassuring. The designer understood our vision immediately and proposed practical solutions that were both aesthetic and functional. They managed the contractors efficiently and ensured quality workmanship throughout. The timeline was met with minimal delays, and the budget was respected. We especially appreciated the post-renovation follow-up to ensure everything was in order.",
    name: "Emily Chen",
    date: "March 2024",
    initial: "E",
    bgColor: "bg-[#f55]",
    textColor: "text-white",
    img: imgReview2,
    hasVideo: false,
  },
  {
    title: "Thoughtful design & smooth execution",
    text: "We chose Sora Studio after meeting a few firms and felt most comfortable with Mina's practical yet creative design suggestions. The final result looked exactly ...",
    fullText: "We chose Sora Studio after meeting a few firms and felt most comfortable with Mina's practical yet creative design suggestions. The final result looked exactly like the 3D renders — modern, functional, and beautifully finished. Every corner of the home was thoughtfully designed, from hidden storage solutions to lighting placement. The team was always available to address our concerns, and we never felt rushed. A truly seamless experience from start to finish.",
    name: "Ryan Teo",
    date: "February 2024",
    initial: "R",
    bgColor: "bg-[#fc5]",
    textColor: "text-[#282828]",
    img: imgReview3,
    hasVideo: true,
  },
  {
    title: "Efficient and caring BTO renovation",
    text: "Momo from Sora Studio helped me with a partial kitchen and living room revamp. She was cheerful and open to our ideas, offering great budget-friendly alternativ...",
    fullText: "Momo from Sora Studio helped me with a partial kitchen and living room revamp. She was cheerful and open to our ideas, offering great budget-friendly alternatives without compromising on style. The workmanship was clean and completed ahead of schedule. She even helped coordinate the delivery of our custom furniture. For a first-time homeowner, Momo made the whole renovation journey stress-free and enjoyable. Would definitely work with her again!",
    name: "Ryan Teo",
    date: "February 2024",
    initial: "R",
    bgColor: "bg-[#fc5]",
    textColor: "text-[#282828]",
    img: imgReview4,
    hasVideo: false,
  },
  {
    title: "Seamless renovation from start to finish",
    text: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the proces...",
    fullText: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the process. From demolition to the final walkthrough, every milestone was communicated clearly. The design choices were elegant yet liveable, perfectly matching our modern minimalist preference. They even handled the tricky hacking works with care and professionalism. Truly a five-star experience.",
    name: "Alicia Wong",
    date: "January 2024",
    initial: "A",
    bgColor: "bg-[#557fff]",
    textColor: "text-white",
    img: imgReview5,
    hasVideo: false,
  },
  {
    title: "Seamless renovation from start to finish",
    text: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the proces...",
    fullText: "We engaged Sora Studio for our resale condo and couldn't be happier. The team was patient, transparent with costs, and extremely organized throughout the process. From demolition to the final walkthrough, every milestone was communicated clearly. The design choices were elegant yet liveable, perfectly matching our modern minimalist preference. They even handled the tricky hacking works with care and professionalism. Truly a five-star experience.",
    name: "Alicia Wong",
    date: "January 2024",
    initial: "A",
    bgColor: "bg-[#557fff]",
    textColor: "text-white",
    img: imgReview5,
    hasVideo: false,
  },
];

/* ─── STAR ICON ─── */
function StarIcon({ className = "size-[14px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none">
      <path
        d="M7 0.5L8.91 5.09L14 5.64L10.18 9.09L11.18 14L7 11.59L2.82 14L3.82 9.09L0 5.64L5.09 5.09L7 0.5Z"
        fill="#FFA929"
      />
    </svg>
  );
}

function Stars({ count = 5, size = "size-[14px]" }: { count?: number; size?: string }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: count }).map((_, i) => (
        <StarIcon key={i} className={size} />
      ))}
    </div>
  );
}

/* ─── HERO SECTION ─── */
function HeroSection() {
  const ctx = useDesignerCtx();
  const p = ctx?.profile;
  const cp = p?.coverProject;
  const coverImg = p?.images?.cover ? resolveImg(p.images.cover) : imgCover;
  const logoImg = p?.images?.logo ? resolveImg(p.images.logo) : imgLogo;
  const companyName = p?.name || "Sora Studios";
  const taglineText = p?.tagline || "Crafting bespoke interiors for HDBs & Condos since 2014. Modern, Japandi, and Minimalist specialists. HDB Registered.";
  const availText = p?.availability || "Available for Q3 2026";
  const locText = p?.location || "Singapore Based";
  const isVerified = p?.verified ?? true;
  const coverName = cp?.name || "Serangoon Terrace";
  const coverCost = cp?.cost || "$128,500";
  const coverArea = cp?.area || "145m\u00B2";
  const coverYear = cp?.year || "2024";
  const coverStyle = cp?.style || "Modern Contemporary Luxe";

  return (
    <section className="relative w-full">
      {/* Cover Image */}
      <div className="group relative w-full h-[260px] md:h-[462px] rounded-[16px] md:rounded-[20px] overflow-hidden cursor-pointer">
        <img
          src={coverImg}
          alt={`${companyName} project`}
          className="absolute inset-0 w-full h-full object-cover scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />

        {/* Project tag */}
        <div className="absolute top-3 md:top-4 left-3 md:left-4 z-10">
          <span className="font-['Inter',sans-serif] font-semibold text-[13px] md:text-[15px] text-white">
            {coverName}
          </span>
        </div>

        {/* Project details - desktop left sidebar */}
        <div className="hidden lg:block absolute left-0 top-0 h-full w-[320px] bg-gradient-to-r from-black to-transparent -translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out">
          <div className="p-8 pt-14 space-y-5">
            <div>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#a8a8a8]">Renovation Cost</p>
              <p className="font-['Inter',sans-serif] font-medium text-[16px] text-white">{coverCost}</p>
            </div>
            <div>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#a8a8a8]">Area Size</p>
              <p className="font-['Inter',sans-serif] font-medium text-[16px] text-white">{coverArea}</p>
            </div>
            <div>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#a8a8a8]">Year of Completion</p>
              <p className="font-['Inter',sans-serif] font-medium text-[16px] text-white">{coverYear}</p>
            </div>
            <div>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#a8a8a8]">Interior Style</p>
              <p className="font-['Inter',sans-serif] font-medium text-[16px] text-white">{coverStyle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Card - desktop right */}
      <div className="hidden lg:block absolute right-6 top-[340px] w-[400px] z-10">
        <QuoteCard />
      </div>

      {/* Profile info row */}
      <div className="relative mt-[-50px] md:mt-[-80px] pl-4 md:pl-8 flex items-start gap-5 md:gap-7">
        {/* Logo */}
        <div className="relative bg-black rounded-full size-[90px] md:size-[160px] border-[3px] md:border-4 border-white shadow-lg shrink-0 overflow-hidden flex items-center justify-center z-[1]">
          <img src={logoImg} alt={companyName} className="w-[90%] h-[90%] object-cover rounded-full" />
        </div>

        {/* Name + info - desktop */}
        <div className="hidden md:block pt-[90px] lg:max-w-[520px]">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-['Inter',sans-serif] font-bold text-[24px] text-[#101828]">{companyName}</h1>
            {isVerified && (
              <div className="bg-[#2b7fff] rounded-full size-[16px] flex items-center justify-center">
                <svg className="size-[10px]" viewBox="0 0 10 7.5" fill="none">
                  <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
          <p className="font-['Inter',sans-serif] text-[16px] text-[#4a5565] leading-[24px] mb-2">
            {taglineText}
          </p>
          <div className="flex items-center gap-4 text-[14px] text-[#6a7282] font-['Inter',sans-serif]">
            <span className="flex items-center gap-1.5">
              <span className="bg-[#00c950] rounded-full size-2 inline-block" />
              {availText}
            </span>
            <span>&bull;</span>
            <span>{locText}</span>
          </div>
        </div>
      </div>

      {/* Name + info - mobile */}
      <div className="md:hidden px-2 mt-3">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#101828]">{companyName}</h1>
          {isVerified && (
            <div className="bg-[#2b7fff] rounded-full size-[14px] flex items-center justify-center">
              <svg className="size-[8px]" viewBox="0 0 10 7.5" fill="none">
                <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
          )}
        </div>
        <p className="font-['Inter',sans-serif] text-[14px] text-[#4a5565] leading-[22px] mb-2">
          {taglineText}
        </p>
        <div className="flex items-center gap-3 text-[13px] text-[#6a7282] font-['Inter',sans-serif]">
          <span className="flex items-center gap-1.5">
            <span className="bg-[#00c950] rounded-full size-2 inline-block" />
            {availText}
          </span>
          <span>&bull;</span>
          <span>{locText}</span>
        </div>
      </div>
    </section>
  );
}

/* ─── QUOTE CARD ─── */
function QuoteCard() {
  const ctx = useDesignerCtx();
  const slug = ctx?.profile?.slug || "";
  const [form, setForm] = useState({ name: "", phone: "", email: "", propertyType: "", budget: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Please fill in your name and contact number.");
      return;
    }
    if (!slug) { setError("Designer not found."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-4808de5e/designer-inquiry/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({
          name: sanitizeInput(form.name, 100),
          phone: sanitizeInput(form.phone, 20),
          email: sanitizeEmail(form.email),
          propertyType: form.propertyType,
          budget: form.budget,
          message: sanitizeInput(form.message, 2000),
          timeline: "",
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to submit. Please try again."); }
      else { setSubmitted(true); }
    } catch (err: any) {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-[17px] border border-[#f3f4f6] shadow-[0px_25px_35.9px_0px_rgba(0,0,0,0.07)] p-6 md:p-7 text-center">
        <div className="w-14 h-14 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090b] mb-2">Quote Request Sent!</h2>
        <p className="font-['Inter',sans-serif] text-[14px] text-[#747474] leading-[22px]">
          Thank you, {form.name.split(" ")[0]}! The team will get back to you within 24 hours.
        </p>
      </div>
    );
  }

  const inputCls = "w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-[14px] px-4 py-2.5 text-[14px] font-['Inter',sans-serif] text-[#09090b] placeholder:text-[#99a1af] outline-none focus:border-[#ffa929] transition-colors";
  const selectCls = "w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-[14px] px-4 py-2.5 text-[14px] font-['Inter',sans-serif] outline-none focus:border-[#ffa929] transition-colors appearance-none";

  return (
    <div className="bg-white rounded-[17px] border border-[#f3f4f6] shadow-[0px_25px_35.9px_0px_rgba(0,0,0,0.07)] p-6 md:p-7">
      <h2 className="font-['Inter',sans-serif] font-bold text-[20px] text-[#09090b] mb-1">Get Your Free Quote</h2>
      <p className="font-['Inter',sans-serif] text-[14px] text-[#747474] mb-5 leading-[22px]">
        Speak with our designers within 24 hours. No hard sell, just honest advice.
      </p>
      <div className="space-y-4">
        <div>
          <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Full Name</label>
          <input type="text" required placeholder="e.g. Jing Wei Tan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Contact Number</label>
          <input type="tel" required placeholder="+65 9XXX XXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Property Type</label>
          <select required value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} className={selectCls} style={{ color: form.propertyType ? "#09090b" : "#99a1af" }}>
            <option value="">Select Property Type</option>
            <option value="HDB">HDB</option>
            <option value="Condo">Condo</option>
            <option value="Landed">Landed</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
        <div>
          <label className="font-['Inter',sans-serif] font-medium text-[14px] text-[#09090b] block mb-1.5">Budget Range</label>
          <select required value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className={selectCls} style={{ color: form.budget ? "#09090b" : "#99a1af" }}>
            <option value="">Select Budget Range</option>
            <option value="Below $30,000">Below $30,000</option>
            <option value="$30,000 – $50,000">$30,000 – $50,000</option>
            <option value="$50,000 – $80,000">$50,000 – $80,000</option>
            <option value="$80,000 – $120,000">$80,000 – $120,000</option>
            <option value="Above $120,000">Above $120,000</option>
          </select>
        </div>
        {error && <p className="font-['Inter',sans-serif] text-[13px] text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#09090b] text-white font-['Inter',sans-serif] font-semibold text-[14px] rounded-[14px] h-[44px] tracking-[-0.35px] hover:bg-[#1a1a1a] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/></svg>
          ) : (
            <>Get Free Quotes &rarr;</>
          )}
        </button>
        <p className="font-['Inter',sans-serif] text-[12px] text-[#ababab] text-center">
          No spam. No obligation. 100% free consultation.
        </p>
      </div>
    </div>
  );
}

/* ─── STATS ROW ─── */
function StatsRow() {
  const ctx = useDesignerCtx();
  const s = ctx?.profile?.stats;
  const stats = [
    {
      icon: (
        <svg className="size-[17px]" viewBox="0 0 14.4436 13.7722" fill="none">
          <path d="M7.22 0.5L9.07 4.82L13.94 5.33L10.27 8.62L11.22 13.27L7.22 11.02L3.22 13.27L4.17 8.62L0.5 5.33L5.37 4.82L7.22 0.5Z" fill="#FFA929" />
        </svg>
      ),
      label: `${s?.rating || "4.9"} Rating`,
      sub: `${s?.reviewCount || "186"} Reviews`,
    },
    {
      icon: (
        <svg className="size-[15px]" viewBox="0 0 15.8865 15.8865" fill="none">
          <rect height="14.4423" stroke="#FFA929" strokeLinejoin="round" strokeWidth="1.44" width="14.4423" x="0.722" y="0.722" />
          <path d="M0.722 6.165H15.164" stroke="#FFA929" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.44" />
        </svg>
      ),
      label: `${s?.years || "12"} Years`,
      sub: "Experience",
    },
    {
      icon: (
        <svg className="size-[15px]" viewBox="0 0 12.9981 15.8889" fill="none">
          <path d="M6.499 0.722V15.167M0.722 4.165H12.276M0.722 8.165H12.276" stroke="#FFA929" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.44" />
        </svg>
      ),
      label: (s?.hdbCert ?? true) ? "HDB Cert." : "Registered",
      sub: (s?.bcaLicensed ?? true) ? "BCA Licensed" : "Licensed",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#fafafa] border border-[#f3f4f6] rounded-[17px] flex items-center gap-2.5 px-4 py-3 min-w-0">
          <div className="shrink-0">{s.icon}</div>
          <div>
            <p className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-[#101828] leading-tight">{s.label}</p>
            <p className="font-['Inter',sans-serif] text-[11px] md:text-[12px] text-[#6a7282] tracking-[0.15px]">{s.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── TEAM AVATARS ─── */
function TeamAvatars() {
  const ctx = useDesignerCtx();
  const members = ctx?.teamMembers ?? teamMembers;
  const [selectedMember, setSelectedMember] = useState<(typeof members)[number] | null>(null);
  const [clickOrigin, setClickOrigin] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);

  const [selectedProject, setSelectedProject] = useState<(typeof members)[number] | null>(null);
  const [reelIndex, setReelIndex] = useState(0);
  const [isProjectClosing, setIsProjectClosing] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const reelContainerRef = useRef<HTMLDivElement>(null);

  const handleProjectClose = () => {
    setIsProjectClosing(true);
    setTimeout(() => {
      setSelectedProject(null);
      setIsProjectClosing(false);
      setReelIndex(0);
    }, 350);
  };

  const handleAvatarClick = (m: (typeof members)[number], e: React.MouseEvent) => {
    if (m.type === "project") {
      setIsProjectClosing(false);
      setReelIndex(0);
      setSelectedProject(m);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setClickOrigin({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsClosing(false);
    setSelectedMember(m);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedMember(null);
      setIsClosing(false);
    }, 350);
  };

  return (
    <>
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
            onClick={(e) => handleAvatarClick(m, e)}
          >
            <div className={`rounded-full size-[74px] md:size-[80px] border-[3px] ${m.type === "project" ? "border-[#2b7fff]" : "border-[#ffa929]"} bg-white p-[3px] transition-transform duration-200 hover:scale-110`}>
              <img src={resolveImg(m.img)} alt={m.name} className="rounded-full size-full object-cover" />
            </div>
            <span className="font-['Inter',sans-serif] text-[12px] text-[#101828]">{m.name}</span>
          </div>
        ))}
      </div>

      {/* Instagram-style popup overlay */}
      {selectedMember && selectedMember.type === "person" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? "animate-[fadeOut_0.35s_ease-in_forwards]" : "animate-[fadeIn_0.3s_ease-out_forwards]"}`} />
          <div
            className={`relative bg-white rounded-[20px] w-full max-w-[380px] overflow-hidden shadow-2xl ${isClosing ? "animate-[flyOut_0.35s_cubic-bezier(0.7,0,0.84,0)_forwards]" : "animate-[flyIn_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]"}`}
            style={{
              "--origin-x": `${clickOrigin.x}px`,
              "--origin-y": `${clickOrigin.y}px`,
            } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            >
              <svg className="size-4 text-[#364153]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>

            {/* Profile header — no gradient */}
            <div className="pt-7 pb-4 px-6 flex flex-col items-center text-center">
              <div className="rounded-full size-[110px] border-[3px] border-[#ffa929] bg-white p-[3px] shadow-lg">
                <img src={resolveImg(selectedMember.img)} alt={selectedMember.name} className="rounded-full size-full object-cover" />
              </div>
              <h3 className="font-['Inter',sans-serif] font-bold text-[18px] text-[#101828] mt-3">{selectedMember.name}</h3>
              <p className="font-['Inter',sans-serif] text-[13px] text-[#2b7fff] font-medium mt-0.5">{"role" in selectedMember ? selectedMember.role : ""}</p>
              <p className="font-['Inter',sans-serif] text-[12px] text-[#6a7282] mt-0.5">{"specialty" in selectedMember ? selectedMember.specialty : ""}</p>

              {/* Stats row */}
              <div className="flex justify-center gap-5 mt-4 w-full">
                <div className="text-center flex-1">
                  <p className="font-['Inter',sans-serif] font-bold text-[17px] text-[#101828]">{"projects" in selectedMember ? selectedMember.projects : 0}</p>
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#6a7282]">Projects</p>
                </div>
                <div className="w-px bg-[#e5e7eb]" />
                <div className="text-center flex-1">
                  <p className="font-['Inter',sans-serif] font-bold text-[17px] text-[#101828]">{"experience" in selectedMember ? selectedMember.experience : ""}</p>
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#6a7282]">Experience</p>
                </div>
                <div className="w-px bg-[#e5e7eb]" />
                <div className="text-center flex-1">
                  <p className="font-['Inter',sans-serif] font-bold text-[17px] text-[#101828]">
                    <svg className="inline size-[13px] text-[#ffa929] mr-0.5 -mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    4.9
                  </p>
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#6a7282]">Rating</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e7eb] mx-4" />

            {/* Designs grid */}
            {"designs" in selectedMember && selectedMember.designs && (
              <div className="grid grid-cols-2 gap-2 p-4">
                {selectedMember.designs.map((d: { img: string; label: string }) => (
                  <div key={d.label} className="relative rounded-[12px] overflow-hidden aspect-square group/design">
                    <img src={resolveImg(d.img)} alt={d.label} className="size-full object-cover transition-transform duration-300 group-hover/design:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/design:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                      <span className="font-['Inter',sans-serif] text-[11px] font-medium text-white">{d.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instagram Reels-style popup for projects */}
      {selectedProject && "reels" in selectedProject && selectedProject.reels && (() => {
        const reels = selectedProject.reels as { img: string; caption: string; location: string; likes: number; comments: number }[];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={handleProjectClose}
          >
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-black/90 ${isProjectClosing ? "animate-[fadeOut_0.35s_ease-in_forwards]" : "animate-[fadeIn_0.25s_ease-out_forwards]"}`} />

            {/* Reels container */}
            <div
              className={`relative w-full max-w-[400px] h-[85vh] max-h-[720px] ${isProjectClosing ? "animate-[reelOut_0.35s_ease-in_forwards]" : "animate-[reelIn_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleProjectClose}
                className="absolute -top-10 right-0 z-20 size-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>

              {/* Reel card */}
              <div
                ref={reelContainerRef}
                className="relative w-full h-full rounded-[16px] overflow-hidden snap-y snap-mandatory overflow-y-auto scrollbar-hide"
                style={{ scrollBehavior: "smooth" }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollTop / el.clientHeight);
                  if (idx !== reelIndex && idx >= 0 && idx < reels.length) setReelIndex(idx);
                }}
              >
                {reels.map((reel, i) => (
                  <div key={reel.caption} className="relative w-full h-full snap-start snap-always shrink-0">
                    {/* Full-bleed image */}
                    <img
                      src={resolveImg(reel.img)}
                      alt={reel.caption}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

                    {/* Top bar — project name + location */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-3">
                      <div className="size-[36px] rounded-full border-2 border-white/80 overflow-hidden shrink-0">
                        <img src={resolveImg(selectedProject.img)} alt={selectedProject.name} className="size-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-white leading-tight truncate">{selectedProject.name} Projects</p>
                        <p className="font-['Inter',sans-serif] text-[11px] text-white/70 leading-tight truncate">{reel.location}</p>
                      </div>
                    </div>

                    {/* Right side action buttons */}
                    <div className="absolute right-3 bottom-[140px] flex flex-col items-center gap-5">
                      <button
                        className="flex flex-col items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLikedReels(prev => {
                            const next = new Set(prev);
                            if (next.has(reel.caption)) next.delete(reel.caption);
                            else next.add(reel.caption);
                            return next;
                          });
                        }}
                      >
                        <svg className={`size-7 transition-colors ${likedReels.has(reel.caption) ? "text-red-500 fill-red-500" : "text-white"}`} viewBox="0 0 24 24" fill={likedReels.has(reel.caption) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                        <span className="font-['Inter',sans-serif] text-[11px] text-white font-medium">{likedReels.has(reel.caption) ? reel.likes + 1 : reel.likes}</span>
                      </button>

                    </div>

                    {/* Bottom caption area */}
                    <div className="absolute bottom-0 left-0 right-14 p-4">
                      <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white leading-snug mb-1">{reel.caption}</p>
                      <div className="flex items-center gap-1.5">
                        <svg className="size-[12px] text-white/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span className="font-['Inter',sans-serif] text-[12px] text-white/70">{reel.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reel progress dots */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                {reels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (reelContainerRef.current) {
                        reelContainerRef.current.scrollTo({ top: i * reelContainerRef.current.clientHeight, behavior: "smooth" });
                      }
                    }}
                    className={`rounded-full transition-all duration-300 ${i === reelIndex ? "w-[6px] h-[18px] bg-white" : "size-[6px] bg-white/40"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes flyIn {
          0% {
            opacity: 0;
            transform: translate(
              calc(var(--origin-x) - 50vw),
              calc(var(--origin-y) - 50vh)
            ) scale(0.12);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes flyOut {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(var(--origin-x) - 50vw),
              calc(var(--origin-y) - 50vh)
            ) scale(0.12);
          }
        }
        @keyframes reelIn {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes reelOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(60px) scale(0.92);
          }
        }
      `}</style>
    </>
  );
}

/* ─── BIO TEXT ─── */
function BioText() {
  const ctx = useDesignerCtx();
  const bio = ctx?.profile?.bio;
  if (bio) {
    return (
      <p className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#6a7282] leading-[26px] tracking-[-0.09px]">
        {bio}
      </p>
    );
  }
  return (
    <p className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#6a7282] leading-[26px] tracking-[-0.09px]">
      Full home renovation specialists for HDB, Condo &amp; Landed properties in Singapore. Modern, Japandi &amp; Minimalist styles. Budgets from{" "}
      <span className="font-bold text-[#364153]">$30K &ndash; $120K</span>.
    </p>
  );
}

/* ─── TRUSTED SINCE ─── */
function TrustedSince() {
  const ctx = useDesignerCtx();
  const p = ctx?.profile;
  const ts = p?.trustedSince;
  const title = ts?.title || "Trusted Since 2014";
  const desc = ts?.description || "Founded by Marcus Tan, Sora Studios has transformed over 300+ homes across Singapore. We believe in transparent pricing and timelines you can trust. No hidden costs, just honest design work.";
  const badges = ts?.badges ?? ["100% Deposit Guarantee", "On-Time Completion", "Award Winning Design"];
  const certs = ts?.certifications ?? [
    { name: "HDB Registered Contractor", license: "Lic. HB-09-4421A" },
    { name: "BCA Licensed Builder", license: "Lic. HB-09-4421A" },
  ];
  const hdbImg = p?.images?.hdbCert ? resolveImg(p.images.hdbCert) : imgHdb;
  const bcaImg = p?.images?.bcaCert ? resolveImg(p.images.bcaCert) : imgBca;

  const badgeIcons = [
    <svg key="dep" className="size-[15px] shrink-0" viewBox="0 0 13.5 16.5" fill="none"><rect height="15" stroke="#00A63E" strokeLinejoin="round" strokeWidth="1.5" width="12" x="0.75" y="0.75" /><path d="M4.5 8.25L6 9.75L9 6.75" stroke="#00A63E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
    <svg key="time" className="size-[15px] shrink-0" viewBox="0 0 16.5 16.5" fill="none"><rect height="15" stroke="#155DFC" strokeLinejoin="round" strokeWidth="1.5" width="15" x="0.75" y="0.75" /><path d="M8.25 4.5V8.25L10.75 9.5" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
    <svg key="award" className="size-[18px] shrink-0" viewBox="0 0 18 18" fill="none"><path d="M9 1L11.47 6.01L17 6.82L13 10.72L13.94 16.24L9 13.65L4.06 16.24L5 10.72L1 6.82L6.53 6.01L9 1Z" stroke="#FE9A00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>,
  ];

  return (
    <div className="bg-[#f9fafb] border-y border-[#f3f4f6] rounded-[17px] px-6 md:px-12 lg:px-16 py-10 md:py-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-10">
        <div className="flex-1">
          <h2 className="font-['Inter',sans-serif] font-bold text-[22px] md:text-[24px] text-[#101828] tracking-[-0.6px] mb-3">{title}</h2>
          <p className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#4a5565] leading-[26px] mb-4">
            {desc}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {badges.map((badge: string, i: number) => (
              <span key={badge} className="flex items-center gap-2 font-['Inter',sans-serif] font-medium text-[14px] text-[#364153]">
                {badgeIcons[i % badgeIcons.length]}
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Certification logos */}
        <div className="bg-white border border-[#f3f4f6] rounded-[14px] shadow-sm flex items-center gap-8 p-6 shrink-0">
          <div className="flex flex-col items-center gap-2">
            <img src={hdbImg} alt={certs[0]?.name || "HDB Registered"} className="h-[45px] w-[170px] object-contain" />
            <span className="font-['Inter',sans-serif] font-bold text-[10px] text-[#99a1af] tracking-[0.5px] uppercase">{certs[0]?.license || "Lic. HB-09-4421A"}</span>
          </div>
          {certs.length > 1 && (
            <div className="flex flex-col items-center gap-2">
              <img src={bcaImg} alt={certs[1]?.name || "BCA Licensed"} className="h-[45px] w-[170px] object-contain" />
              <span className="font-['Inter',sans-serif] font-bold text-[10px] text-[#99a1af] tracking-[0.5px] uppercase">{certs[1]?.license || "Lic. HB-09-4421A"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── BTO PACKAGE CTA ─── */
function BtoPackageCta() {
  const ctx = useDesignerCtx();
  const bto = ctx?.profile?.btoPackage;
  const btoTitle = bto?.title || "All-Inclusive BTO Packages";
  const btoDesc = bto?.description || "Starting from $28,888 for 3-Room BTO. Includes masonry, plumbing, electrical & carpentry.";
  const btoTags = bto?.tags ?? ["0% Interest Installments", "No Hidden Costs"];
  const tagColors = [
    "bg-[#dbeafe] text-[#1447e6]",
    "bg-[#dcfce7] text-[#008236]",
    "bg-[#fef3c7] text-[#d97706]",
    "bg-[#e9d5ff] text-[#7c3aed]",
  ];

  return (
    <div className="bg-gradient-to-r from-[#eff6ff] to-[#eef2ff] border border-[#dbeafe] rounded-[14px] px-6 md:px-16 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="bg-white rounded-full size-[48px] shadow-sm shrink-0 flex items-center justify-center">
          <svg className="size-[24px]" viewBox="0 0 20 22" fill="none">
            <path d="M14 11H6M10 7V15M19 11C19 15.97 14.97 20 10 20C5.03 20 1 15.97 1 11C1 6.03 5.03 2 10 2C14.97 2 19 6.03 19 11Z" stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div>
          <h3 className="font-['Inter',sans-serif] font-semibold text-[17px] md:text-[18px] text-[#101828] mb-1">{btoTitle}</h3>
          <p className="font-['Inter',sans-serif] text-[13px] md:text-[14px] text-[#4a5565] leading-[20px]">
            {btoDesc}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {btoTags.map((tag: string, i: number) => (
              <span key={tag} className={`${tagColors[i % tagColors.length]} font-['Inter',sans-serif] font-medium text-[10px] px-2.5 py-1 rounded-full`}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <button className="bg-[#155dfc] text-white font-['Inter',sans-serif] font-medium text-[14px] rounded-[10px] shadow-md px-5 py-2.5 whitespace-nowrap hover:bg-[#1247d6] transition-colors cursor-pointer flex items-center gap-2">
        View Packages
        <svg className="size-[16px]" viewBox="0 0 16 16" fill="none">
          <path d="M3.33 8H12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
          <path d="M8 3.33L12.67 8L8 12.67" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33" />
        </svg>
      </button>
    </div>
  );
}

/* ─── PROJECTS SECTION ─── */
function ProjectsSection() {
  const ctx = useDesignerCtx();
  const projs = ctx?.projects ?? [
    { img: imgProject1, name: "Tiong Bahru Condo", meta: "HDB \u00b7 $87,460 \u00b7 2024" },
    { img: imgProject2, name: "Buona Vista Loft", meta: "HDB \u00b7 $276,540 \u00b7 2024" },
  ];
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-['Inter',sans-serif] font-semibold text-[19px] md:text-[20px] text-[#101828] tracking-[-0.88px]">Projects</h2>
        <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#6a7282]">Recent completed renovations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {projs.map((p: any) => (
          <div key={p.name} className="relative rounded-[17px] overflow-hidden h-[280px] md:h-[507px] group cursor-pointer">
            <img src={resolveImg(p.img)} alt={p.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <Link to={`/designer/${window.location.pathname.split('/designer/')[1]?.split('/')[0] || 'studio'}/project/${encodeURIComponent(p.name)}`} className="absolute inset-0 bg-gradient-to-t from-black/42 to-transparent to-[55%] z-[1]" />
            <div className="absolute bottom-4 left-5">
              <p className="font-['Inter',sans-serif] font-semibold text-[13px] md:text-[14px] text-white leading-[22px] tracking-[0.08px]">{p.name}</p>
              <p className="font-['Inter',sans-serif] text-[12px] md:text-[14px] text-[#bab7b3] tracking-[0.08px]">{p.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center font-['Inter',sans-serif] text-[13px] text-[#99a1af] tracking-[0.08px] mt-4">
        Tap a project to see details &middot; <span className="text-[#ffa929]">View all 40+ projects &rarr;</span>
      </p>
    </section>
  );
}

/* ─── TRUST & CREDENTIALS ─── */
function TrustCredentials() {
  const ctx = useDesignerCtx();
  const bInfo = ctx?.businessInfo ?? businessInfo;
  return (
    <section className="bg-[#fafafa] py-10 md:py-14 px-4 md:px-8">
      <div className="max-w-[1293px] mx-auto">
        <div className="mb-5">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[19px] md:text-[20px] text-[#101828] tracking-[-0.88px]">Trust &amp; Credentials</h2>
          <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#6a7282]">Verified licences and registrations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8">
          {/* Left column: Credential cards */}
          <div className="flex flex-col gap-3">
            {[
              { img: imgHdb, title: "HDB Registered Contractor", sub: "Sora Studios Pte Ltd \u00b7 Registered 2014", desc: "Authorised to carry out renovation works in HDB flats across Singapore." },
              { img: imgBca, title: "BCA Licensed Builder", sub: "Sora Studios Pte Ltd \u00b7 Licensed since 2015", desc: "Building & Construction Authority licensed contractor for structural and A&A works." },
            ].map((c) => (
              <div key={c.title} className="bg-white border border-[#e5e7eb] rounded-[17px] p-5 flex gap-4">
                <div className="bg-[#f8fafc] rounded-[12px] size-[69px] shrink-0 flex items-center justify-center">
                  <img src={resolveImg(c.img)} alt={c.title} className="h-[44px] w-[50px] object-contain" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-['Inter',sans-serif] font-semibold text-[15px] md:text-[16px] text-[#101828] tracking-[-0.09px]">{c.title}</p>
                    <span className="bg-[rgba(22,163,74,0.08)] text-[#16a34a] font-['Inter',sans-serif] font-medium text-[12px] px-2.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] tracking-[0.08px]">{c.sub}</p>
                  <p className="font-['Inter',sans-serif] text-[13px] text-[#99a1af] tracking-[0.08px] mt-1">{c.desc}</p>
                </div>
              </div>
            ))}

            {/* Landed renovations badge */}
            <div className="bg-[rgba(255,169,41,0.06)] border border-[rgba(255,169,41,0.27)] rounded-[17px] px-5 py-4 flex items-center gap-4">
              <svg className="size-[17px] shrink-0" viewBox="0 0 18.156 18.156" fill="none">
                <rect height="16.5" stroke="#FFA929" strokeLinejoin="round" strokeWidth="1.65" width="16.5" x="0.825" y="0.825" />
                <path d="M5 9L8 12L14 6" stroke="#FFA929" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.65" />
              </svg>
              <div>
                <p className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-[#101828]">Eligible for Landed Home Renovations</p>
                <p className="font-['Inter',sans-serif] text-[13px] text-[#6a7282] tracking-[0.08px]">Certified to undertake full A&amp;A works on landed properties</p>
              </div>
            </div>
          </div>

          {/* Right column: Business info table */}
          <div className="bg-white border border-[#e5e7eb] rounded-[17px] overflow-hidden">
            <div className="border-b border-[#f3f4f6] px-5 py-3.5">
              <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-[#6a7282] tracking-[0.42px] uppercase">Business Information</p>
            </div>
            {bInfo.map((info: any, i: number) => (
              <div key={info.label} className={`flex gap-5 px-5 py-3 ${i < bInfo.length - 1 ? "border-b border-[#f3f4f6]" : ""}`}>
                <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#6a7282] w-[160px] md:w-[180px] shrink-0">{info.label}</p>
                <p className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[15px] text-[#101828]">{info.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TAG ICON ─── */
function TagIcon({ icon, color }: { icon: string; color: string }) {
  const size = 12;
  switch (icon) {
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7" y="1" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="1" y="7" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7" y="7" width="4" height="4" rx="0.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dollar":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1V11" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 3H4.75C4.28587 3 3.84075 3.18437 3.51256 3.51256C3.18437 3.84075 3 4.28587 3 4.75C3 5.21413 3.18437 5.65925 3.51256 5.98744C3.84075 6.31563 4.28587 6.5 4.75 6.5H7.25C7.71413 6.5 8.15925 6.68437 8.48744 7.01256C8.81563 7.34075 9 7.78587 9 8.25C9 8.71413 8.81563 9.15925 8.48744 9.48744C8.15925 9.81563 7.71413 10 7.25 10H3" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "palette":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="0.5" y="0.5" width="11" height="11" rx="1" stroke={color} strokeLinejoin="round" />
          <rect x="3" y="3" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="6.5" y="3" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="3" y="6.5" width="2.5" height="2.5" rx="0.5" fill={color} />
          <rect x="6.5" y="6.5" width="2.5" height="2.5" rx="0.5" fill={color} />
        </svg>
      );
    case "search":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="5.5" cy="5.5" r="3.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 10.5L8 8" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ruler":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1" stroke={color} strokeLinejoin="round" />
          <path d="M1 4H3.5M1 6H2.5M1 8H3.5" stroke={color} strokeLinecap="round" />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1" stroke={color} strokeLinejoin="round" />
          <path d="M3.5 6L5.5 8L8.5 4" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "chart":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <rect x="1" y="6" width="2.5" height="5" rx="0.5" stroke={color} strokeLinejoin="round" />
          <rect x="4.75" y="3" width="2.5" height="8" rx="0.5" stroke={color} strokeLinejoin="round" />
          <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L2 3V6C2 8.5 3.8 10.7 6 11.5C8.2 10.7 10 8.5 10 6V3L6 1Z" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 3V6L8 7" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sparkle":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.2 4.8L11 6L7.2 7.2L6 11L4.8 7.2L1 6L4.8 4.8L6 1Z" stroke={color} strokeLinejoin="round" />
        </svg>
      );
    case "key":
      return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
          <circle cx="4" cy="7" r="2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 5.5L9 2.5M9 2.5L11 4.5M9 2.5V2.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── CASE STUDIES ─── */
function CaseStudies() {
  const ctx = useDesignerCtx();
  const phases = ctx?.caseStudyPhases ?? caseStudyPhases;
  return (
    <section className="bg-[#fafafa] py-10 md:py-14 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1293px] mx-auto">
        {/* Left-aligned header */}
        <div className="mb-8 md:mb-12">
          <h2 className="font-['Inter',sans-serif] font-semibold text-[19px] md:text-[20px] text-[#101828] tracking-[-0.88px] leading-[48px]">
            Case Study: From Blueprint to Completion
          </h2>
          <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] max-w-[684px] leading-[26px]">
            A structured overview of how this residence progressed from concept planning to final handover.
          </p>
        </div>

        {/* Timeline rows – image LEFT, dot CENTER, card RIGHT */}
        <div className="relative flex flex-col gap-10 lg:gap-14">
          {/* Vertical connecting line between dots */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[11px] bottom-[11px] w-[2px] bg-[#e5e5e5] pointer-events-none" />

          {phases.map((phase: any) => (
            <div
              key={phase.phase}
              className="flex flex-col lg:flex-row items-start lg:items-stretch relative"
            >
              {/* Image – left column */}
              <div className="w-full lg:w-[38%] shrink-0">
                <div className="rounded-[10px] overflow-hidden shadow-[0px_10px_30px_0px_rgba(0,0,0,0.04)] h-[220px] md:h-[335px]">
                  <img src={resolveImg(phase.img)} alt={phase.title} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Timeline dot – center (absolutely positioned at true center) */}
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 top-2 z-10">
                <div className="size-[18px] bg-[#e5e5e5] rounded-full flex items-center justify-center">
                  <div className="size-[4px] rounded-full" />
                </div>
              </div>

              {/* Content card – right column */}
              <div className="w-full lg:flex-1 mt-4 lg:mt-0">
                <div className="bg-white border border-[#e5e7eb] rounded-[17px] h-full p-6 flex flex-col justify-center max-w-[495px] ml-auto">
                  <p className="font-['Inter',sans-serif] font-bold text-[12px] text-[#ffa929] tracking-[1.44px] leading-[18px] mb-2">{phase.phase}</p>
                  <h3 className="font-['Inter',sans-serif] font-semibold text-[18px] md:text-[20px] text-[#101828] leading-[40px] mb-1">{phase.title}</h3>
                  <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-[#6b6b6b] leading-[27px] mb-5 max-w-[405px]">{phase.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.tags.map((t) => (
                      <span
                        key={t.label}
                        className={`${t.bg} ${t.text} font-['Inter',sans-serif] font-medium text-[12px] leading-[18px] pl-[10px] pr-3 py-1 rounded-full inline-flex items-center gap-[4px]`}
                      >
                        <TagIcon icon={t.icon} color={t.iconColor} />
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WHAT HOMEOWNERS SAY ─── */
function GoogleIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17.3308 17.3308" fill="none">
      <path d={svgPaths.p1299d240} fill="#4285F4" />
      <path d={svgPaths.pa779380} fill="#34A853" />
      <path d={svgPaths.p23f86e80} fill="#FBBC05" />
      <path d={svgPaths.p8c10180} fill="#EA4335" />
    </svg>
  );
}

const reviewsData = [
  {
    name: "Alex Goh",
    initial: "A",
    time: "2 months ago",
    text: "\"Sora Studios managed our HDB resale renovation flawlessly. Marcus was responsive even on weekends and the carpentry quality is top notch. Highly recommended!\"",
  },
  {
    name: "Sarah Lim",
    initial: "S",
    time: "1 week ago",
    text: "\"Loved the Japandi design proposal. They really listened to our needs for storage. The timeline was slightly delayed but they made up for it with excellent workmanship.\"",
  },
  {
    name: "Jasmine Tan",
    initial: "J",
    time: "3 months ago",
    text: "\"Transparent pricing from the start. No hidden variation orders. Very happy with our new kitchen!\"",
  },
];

const reviewTabs = [
  { label: "Network Reviews" },
  { label: "Facebook Reviews" },
  { label: "Google Reviews" },
];

function HomeownersSay() {
  const ctx = useDesignerCtx();
  const rData = ctx?.reviewsData ?? reviewsData;
  const rating = ctx?.profile?.stats?.rating || "4.9";
  return (
    <section className="py-10 md:py-16 px-4 md:px-8 border-b border-[#f3f4f6]">
      <div className="max-w-[1293px] mx-auto">
        {/* Centered header */}
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <h2 className="font-['Inter',sans-serif] font-bold text-[24px] text-[#101828] tracking-[-0.6px] leading-[32px] text-center">
            What Homeowners Say
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <Stars count={5} size="size-[16px]" />
            <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#4a5565]">{rating}/5 Average Rating</span>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[38px]">
          {/* LEFT: Latest Reviews */}
          <div className="w-full lg:flex-[1_1_0]">
            <h3 className="font-['Inter',sans-serif] font-semibold text-[18px] text-[#101828] leading-[28px] mb-4">
              Latest Reviews
            </h3>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-3 mb-5">
              {reviewTabs.map((tab) => (
                <button
                  key={tab.label}
                  className="bg-[#f8fafc] border border-[#e5e7eb] rounded-full px-[14px] py-[8px] flex items-center gap-[7px] cursor-pointer hover:bg-[#f1f3f5] transition-colors"
                >
                  <GoogleIcon className="size-[17px] shrink-0" />
                  <span className="font-['Inter',sans-serif] font-medium text-[13.6px] text-[#364153] tracking-[0.08px] whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Review cards */}
            <div className="flex flex-col gap-4">
              {rData.map((r: any, i: number) => (
                <div
                  key={`latest-${i}`}
                  className="bg-white border border-[#f3f4f6] rounded-[14px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] p-[21px]"
                >
                  {/* Header: avatar + name/time */}
                  <div className="flex items-center justify-between mb-[15px]">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#ffedd4] rounded-full size-[32px] flex items-center justify-center shrink-0">
                        <span className="font-['Inter',sans-serif] font-bold text-[12px] text-[#f54900]">{r.initial}</span>
                      </div>
                      <div>
                        <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#101828] leading-[20px]">{r.name}</p>
                        <p className="font-['Inter',sans-serif] text-[12px] text-[#99a1af] leading-[16px]">{r.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-[5px] mb-[15px]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="size-[12px]" viewBox="0 0 12 12" fill="none">
                        <path d={svgPaths.p295e8380} fill="#FFB900" stroke="#FFB900" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ))}
                  </div>

                  {/* Review text */}
                  <p className="font-['Inter',sans-serif] text-[14px] text-[#4a5565] leading-[22.75px]">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Video Tours & Stories */}
          <div className="w-full lg:w-[544px] shrink-0">
            <h3 className="font-['Inter',sans-serif] font-semibold text-[18px] text-[#101828] leading-[28px] mb-4">
              Video Tours &amp; Stories
            </h3>

            <div className="flex flex-col gap-6">
              {[
                { img: imgVideo, title: "How we transformed a 3-Room HDB", time: "2:45" },
                { img: imgProject2, title: "Client Interview: The Wongs", time: "4:12" },
              ].map((v) => (
                <div key={v.title} className="relative rounded-[14px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] h-[240px] md:h-[306px] cursor-pointer group">
                  <img src={resolveImg(v.img)} alt={v.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full size-[64px] shadow-[0px_20px_25px_0px_rgba(0,0,0,0.1),0px_8px_10px_0px_rgba(0,0,0,0.1)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="size-[24px] ml-1" viewBox="0 0 24 24" fill="none">
                        <path d="M6 3L20 12L6 21V3Z" fill="black" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-16">
                    <p className="font-['Inter',sans-serif] font-medium text-[16px] text-white leading-[24px]">{v.title}</p>
                    <span className="bg-black/50 text-[#d1d5dc] font-['Inter',sans-serif] text-[12px] px-2 py-0.5 rounded-[4px] mt-1 inline-block leading-[16px]">{v.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GOOGLE REVIEW CARDS (with images) ─── */
function ReviewCard({ review, index }: { review: typeof reviews[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white border border-[#f3f4f6] rounded-[16px] overflow-hidden shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
      {/* Image */}
      <div className={`relative w-full overflow-hidden ${review.hasVideo ? "h-[253px]" : "h-[160px]"}`}>
        <img
          src={resolveImg(review.img)}
          alt={review.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {review.hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full size-[32px] flex items-center justify-center shadow-md">
              <svg className="size-[16px] ml-0.5" viewBox="0 0 13.3333 13.3333" fill="none">
                <path d="M0.666667 0.666667L10 6.66667L0.666667 12.6667V0.666667Z" fill="#515151" stroke="#515151" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Stars + Verified */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex gap-[2px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="size-[14px]" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.167L8.682 4.702L12.6 5.232L9.8 7.955L10.521 11.856L7 10.069L3.479 11.856L4.2 7.955L1.4 5.232L5.318 4.702L7 1.167Z" fill="#FFA929" />
              </svg>
            ))}
          </div>
          <div className="flex items-center gap-[6px]">
            <img src={imgGoogle} alt="Google" className="size-[16px] object-contain" />
            <span className="font-['Inter',sans-serif] font-medium text-[12px] text-[#34a42f] leading-[16px]">Verified</span>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-['Inter',sans-serif] font-semibold text-[16px] text-[#242424] leading-[22px] mt-1.5 mb-2">
          {review.title}
        </h4>

        {/* Text + Read more / Read less */}
        <div className="mb-3">
          <motion.div
            initial={false}
            animate={{ height: expanded ? "auto" : "68px" }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden relative"
            ref={contentRef}
          >
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[#4a4a4a] leading-[22.75px]">
              {expanded ? review.fullText : review.text}
            </p>
          </motion.div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="font-['Inter',sans-serif] font-medium text-[14px] text-[#ffa929] mt-1 cursor-pointer hover:underline"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        </div>

        {/* Divider + Reviewer */}
        <div className="border-t border-[#f9fafb] pt-3 flex items-center gap-[10px]">
          <div className={`${review.bgColor} rounded-full size-[36px] flex items-center justify-center shrink-0`}>
            <span className={`font-['Inter',sans-serif] font-semibold text-[14px] ${review.textColor} leading-[20px]`}>
              {review.initial}
            </span>
          </div>
          <div>
            <p className="font-['Inter',sans-serif] font-medium text-[14px] text-[#1f1f1f] leading-[20px]">{review.name}</p>
            <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[#9a9a9a] leading-[16px]">{review.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleReviewCards() {
  const ctx = useDesignerCtx();
  const rvws = ctx?.reviews ?? reviews;
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const COLLAPSED_HEIGHT = 420;

  // Distribute reviews across 3 columns dynamically (masonry-style)
  const col1 = rvws.filter((_: any, i: number) => i % 3 === 0);
  const col2 = rvws.filter((_: any, i: number) => i % 3 === 1);
  const col3 = rvws.filter((_: any, i: number) => i % 3 === 2);

  // Measure the full grid height whenever it renders / resizes / data changes
  useEffect(() => {
    if (!gridRef.current) return;
    const measure = () => setContentHeight(gridRef.current?.scrollHeight ?? 0);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, [rvws.length]);

  const toggle = () => {
    if (expanded) {
      // collapsing — scroll section into view after the animation starts
      setExpanded(false);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setExpanded(true);
    }
  };

  return (
    <section ref={sectionRef} className="py-10 md:py-16 px-4 md:px-8 border-b border-[#f3f4f6] scroll-mt-[80px]">
      <div className="max-w-[1293px] mx-auto">

        {/* ── Reviews container with animated max-height ── */}
        <div className="relative">
          <div
            ref={gridRef}
            style={{
              maxHeight: expanded ? `${contentHeight}px` : `${COLLAPSED_HEIGHT}px`,
              transition: "max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
            }}
          >
            {/* Desktop: masonry 3-column layout — dynamically distributes any number of reviews */}
            <div className="hidden md:grid grid-cols-3 gap-5">
              {/* Column 1 */}
              <div className="flex flex-col gap-5">
                {col1.map((review: any, i: number) => (
                  <ReviewCard key={`col1-${i}`} review={review} index={i * 3} />
                ))}
              </div>
              {/* Column 2 */}
              <div className="flex flex-col gap-5">
                {col2.map((review: any, i: number) => (
                  <ReviewCard key={`col2-${i}`} review={review} index={i * 3 + 1} />
                ))}
              </div>
              {/* Column 3 */}
              <div className="flex flex-col gap-5">
                {col3.map((review: any, i: number) => (
                  <ReviewCard key={`col3-${i}`} review={review} index={i * 3 + 2} />
                ))}
              </div>
            </div>
            {/* Mobile: single column */}
            <div className="md:hidden flex flex-col gap-5">
              {rvws.map((review: any, i: number) => (
                <ReviewCard key={`review-m-${i}`} review={review} index={i} />
              ))}
            </div>
          </div>

          {/* Gradient fade — fades out when expanded */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none z-[2]"
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,1) 100%)",
              opacity: expanded ? 0 : 1,
              transition: "opacity 0.5s ease",
            }}
          />
        </div>

        {/* ── View More / View Less button ── */}
        <button
          onClick={toggle}
          className="flex flex-col items-center gap-[8px] mx-auto mt-7 cursor-pointer border-none bg-transparent p-2 group"
        >
          <span className="font-['Inter',sans-serif] font-medium text-[15px] text-[#333] leading-[32px] tracking-[0.01em]">
            {expanded ? "View Less" : "View More"}
          </span>
          <div
            className="size-[44px] rounded-full border-[1.5px] border-[#ccc] flex items-center justify-center group-hover:border-[#888] group-hover:bg-black/[0.04]"
            style={{
              transition: "transform 0.4s ease, border-color 0.3s ease, background 0.3s ease",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg className="size-[18px] text-[#555]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </button>

      </div>
    </section>
  );
}

/* ─── SERVICE AREA ─── */
const SG_ROUTES = [
  "via Central Expressway (CTE)",
  "via Pan Island Expressway (PIE)",
  "via Ayer Rajah Expressway (AYE)",
  "via East Coast Parkway (ECP)",
  "via Orchard Road",
  "via Bukit Timah Road",
];
const DEST_LABEL = "33 Ubi Ave 3, Singapore 408868";

// Ubi HQ coordinates
const HQ_LAT = 1.3271;
const HQ_LNG = 103.8918;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function lookupPostalCode(postal: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const res = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postal}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const match = data.results.find((r: any) => r.POSTAL === postal);
    if (!match) return null;
    return {
      lat: parseFloat(match.LATITUDE),
      lng: parseFloat(match.LONGITUDE),
      address: match.ADDRESS || match.SEARCHVAL || postal,
    };
  } catch {
    return null;
  }
}

function isValidSGPostal(v: string) {
  if (!/^\d{6}$/.test(v)) return false;
  const prefix = parseInt(v.slice(0, 2));
  return prefix >= 1 && prefix <= 82;
}

function ServiceArea() {
  const ctx = useDesignerCtx();
  const sa = ctx?.serviceArea;
  const hqLat = sa?.hqLat || HQ_LAT;
  const hqLng = sa?.hqLng || HQ_LNG;
  const destLabel = sa?.hqAddress || DEST_LABEL;
  const saDesc = sa?.description || "Based in Ubi, we cover all HDB estates and private properties across Singapore.";
  const mapUrl = sa?.mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d996.4!2d103.8918!3d1.3271!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da181f5dc73855%3A0x0!2s33+Ubi+Ave+3%2C+Singapore+408868!5e0!3m2!1sen!2ssg!4v1700000000000!5m2!1sen!2ssg";
  const companyName = ctx?.profile?.name || "Sora Studios";

  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    mins: number;
    km: string;
    arrive: string;
    route: string;
    mapsUrl: string;
  } | null>(null);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const getETA = async () => {
    setError("");
    if (!postalCode) {
      setError("Please enter a Singapore postal code.");
      return;
    }
    if (!isValidSGPostal(postalCode)) {
      setError("Please enter a valid 6-digit Singapore postal code (e.g. 238859).");
      return;
    }

    setLoading(true);
    setResult(null);

    // Verify postal code exists via Singapore OneMap API
    const location = await lookupPostalCode(postalCode);
    if (!location) {
      setLoading(false);
      setError("Address not found — this postal code doesn't exist in Singapore.");
      return;
    }

    const gmUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(location.address)}&destination=${encodeURIComponent(destLabel)}&travelmode=driving`;

    // Calculate realistic distance & ETA from real coordinates
    const straightKm = haversineKm(location.lat, location.lng, hqLat, hqLng);
    const roadKm = straightKm * (1.3 + Math.random() * 0.2); // road factor ~1.3-1.5x
    const km = Math.max(0.5, roadKm).toFixed(1);
    const avgSpeedKmh = 30 + Math.random() * 15; // 30-45 km/h avg Singapore driving
    const mins = Math.max(3, Math.round((roadKm / avgSpeedKmh) * 60));
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + mins);
    const arrStr = eta.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
    const route = SG_ROUTES[Math.floor(Math.random() * SG_ROUTES.length)];

    setResult({ mins, km, arrive: arrStr, route, mapsUrl: gmUrl });
    setLoading(false);
  };

  const etaDisplay = result
    ? result.mins >= 60
      ? { num: `${Math.floor(result.mins / 60)}${result.mins % 60 ? `:${String(result.mins % 60).padStart(2, "0")}` : ""}`, unit: "hr" }
      : { num: String(result.mins), unit: "min" }
    : null;

  return (
    <section className="bg-[#f9fafb] border-t border-[#f3f4f6] rounded-[17px] py-10 md:py-14 px-4 md:px-8">
      <div className="max-w-[1293px] mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-['DM_Sans',sans-serif] font-bold text-[22px] md:text-[24px] text-[#101828] tracking-[-0.6px] mb-2">Our Service Area</h2>
          <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-[16px] text-[#6a7282] max-w-[464px] mx-auto leading-[24px]">
            {saDesc}
          </p>
        </div>

        {/* Map card */}
        <div className="relative rounded-[22px] overflow-hidden h-[400px] md:h-[537px] group">
          {/* Google Maps iframe with dark filter */}
          <iframe
            className="absolute inset-0 w-full h-full border-none pointer-events-none"
            style={{
              filter: "saturate(0.18) brightness(0.48) hue-rotate(200deg)",
              transition: "filter 0.5s",
            }}
            src={`${mapUrl}&gestureHandling=none&zoomControl=false&mapTypeControl=false&scaleControl=false&streetViewControl=false&rotateControl=false&fullscreenControl=false`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Service Area Map"
          />

          {/* Animated Pin */}
          <div className="absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[9px] z-[2] pointer-events-none">
            <div
              className="size-[78px] rounded-full flex items-center justify-center"
              style={{
                background: "rgba(220, 48, 48, 0.2)",
                animation: "serviceAreaBreathe 2.4s ease-in-out infinite",
              }}
            >
              <div
                className="size-[52px] rounded-full flex items-center justify-center"
                style={{ background: "rgba(220, 48, 48, 0.35)" }}
              >
                <div
                  className="size-[32px] rounded-full bg-[#dc3030] flex items-center justify-center"
                  style={{ boxShadow: "0 0 0 3px rgba(255,255,255,0.2), 0 4px 16px rgba(220,48,48,0.5)" }}
                >
                  <svg className="size-[14px] fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white/[0.94] text-[#1a1f2e] text-[11px] font-medium tracking-[0.02em] px-[14px] py-[5px] rounded-full whitespace-nowrap font-['DM_Sans',sans-serif]">
              {companyName} HQ
            </div>
          </div>

          {/* ETA Result Card */}
          {(loading || result) && (
            <div
              className="absolute bottom-[90px] left-0 right-0 mx-auto z-[3] font-['DM_Sans',sans-serif]"
              style={{
                width: "min(480px, calc(100% - 40px))",
                animation: "serviceAreaFadeDown 0.3s cubic-bezier(0.16,1,0.3,1) both",
              }}
            >
              <div className="bg-white/[0.97] rounded-[16px] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-baseline">
                      {loading ? (
                        <span
                          className="inline-block size-5 rounded-full border-[2.5px] border-[#dde1ec] align-middle"
                          style={{
                            borderTopColor: "#3b4260",
                            animation: "serviceAreaSpin 0.7s linear infinite",
                          }}
                        />
                      ) : (
                        <>
                          <span className="text-[32px] font-medium text-[#1a1f2e] leading-none">{etaDisplay?.num}</span>
                          <span className="text-[14px] text-[#9aa0b4] font-normal ml-[3px]">{etaDisplay?.unit}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9aa0b4] mt-1">
                      {loading ? "Finding best route\u2026" : result?.route}
                    </div>
                  </div>
                  {result && (
                    <a
                      href={result.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-[#1a1f2e] text-white rounded-[10px] px-[14px] py-[9px] text-[11px] font-medium tracking-[0.04em] inline-flex items-center gap-[5px] no-underline whitespace-nowrap hover:bg-[#2d3449] transition-colors"
                    >
                      <svg className="size-[11px] fill-current" viewBox="0 0 24 24">
                        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                      </svg>
                      Open in Maps
                    </a>
                  )}
                </div>
                {result && (
                  <>
                    <div className="h-px bg-[#edf0f5] my-[13px]" />
                    <div className="flex gap-6">
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Distance</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">{result.km} km</span>
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Arrive by</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">{result.arrive}</span>
                      </div>
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#b0b8cc]">Mode</span>
                        <span className="text-[13px] font-medium text-[#2a3040]">Driving</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Postal Code Input — always fixed at bottom */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[3]"
            style={{ width: "min(480px, calc(100% - 40px))" }}
          >
            <div className="flex items-center gap-[10px] bg-white/[0.96] rounded-[14px] py-[9px] pr-[9px] pl-[15px]">
              <svg className="shrink-0 size-[17px] text-[#b0b8cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={postalCode}
                onChange={handleInput}
                onKeyDown={(e) => e.key === "Enter" && getETA()}
                placeholder="Enter Postal Code"
                className="flex-1 bg-transparent border-none outline-none font-['DM_Sans',sans-serif] text-[13.5px] font-normal text-[#1a1f2e] placeholder:text-[#b8bece] min-w-0"
              />
              <button
                onClick={getETA}
                className="shrink-0 size-[42px] rounded-[10px] bg-[#3b4260] border-none cursor-pointer flex items-center justify-center hover:bg-[#4e5580] active:scale-[0.93] transition-all"
                title="Get ETA"
              >
                <svg className="size-4 fill-white" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-[#c0392b] text-center mt-[7px] font-['DM_Sans',sans-serif]">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes serviceAreaBreathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes serviceAreaFadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes serviceAreaSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

/* ─── MOBILE QUOTE CARD ─── */
function MobileQuoteSection() {
  return (
    <div className="lg:hidden">
      <QuoteCard />
    </div>
  );
}

/* ─── LOADING SKELETON ─── */
function ProfileLoadingSkeleton() {
  return (
    <div className="bg-white min-h-screen font-['Inter',sans-serif]">
      <Navbar />
      <main className="pt-[130px] md:pt-[150px]">
        <div className="max-w-[1293px] mx-auto px-4 md:px-8">
          {/* Cover shimmer */}
          <div className="w-full h-[260px] md:h-[462px] rounded-[16px] md:rounded-[20px] bg-[#f3f4f6] animate-pulse" />
          {/* Profile row shimmer */}
          <div className="flex items-start gap-5 md:gap-7 mt-[-50px] md:mt-[-80px] pl-4 md:pl-8">
            <div className="size-[90px] md:size-[160px] rounded-full bg-[#e5e7eb] animate-pulse border-4 border-white shrink-0" />
            <div className="hidden md:block pt-[90px] space-y-3 flex-1 max-w-[520px]">
              <div className="h-7 w-[200px] bg-[#e5e7eb] rounded-lg animate-pulse" />
              <div className="h-5 w-[360px] bg-[#f3f4f6] rounded-lg animate-pulse" />
              <div className="h-4 w-[240px] bg-[#f3f4f6] rounded-lg animate-pulse" />
            </div>
          </div>
          {/* Stats shimmer */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2.5 max-w-[790px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[60px] bg-[#f3f4f6] rounded-[17px] animate-pulse" />
            ))}
          </div>
          {/* Bio shimmer */}
          <div className="mt-6 max-w-[768px] space-y-2">
            <div className="h-4 w-full bg-[#f3f4f6] rounded animate-pulse" />
            <div className="h-4 w-[80%] bg-[#f3f4f6] rounded animate-pulse" />
          </div>
          {/* Team shimmer */}
          <div className="mt-6 flex gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="size-[74px] md:size-[80px] rounded-full bg-[#e5e7eb] animate-pulse" />
                <div className="h-3 w-12 bg-[#f3f4f6] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── MAIN PROFILE PAGE ─── */
export function DesignerProfile() {
  const { slug } = useParams();
  const { data: apiData, loading, error } = useDesignerData(slug);

  // Transform API data into component-compatible shapes
  const ctxValue = useMemo<DesignerCtxType | null>(() => {
    if (!apiData) return null;
    return transformApiData(apiData);
  }, [apiData]);

  // Show loading skeleton while fetching
  if (loading) {
    return <ProfileLoadingSkeleton />;
  }

  // Log data source for debugging
  if (ctxValue) {
    console.log("DesignerProfile: Rendering with API data for slug:", slug);
  } else {
    console.log("DesignerProfile: Rendering with hardcoded fallback data (API returned:", error || "empty", ")");
  }

  return (
    <DesignerDataContext.Provider value={ctxValue}>
      <div className="bg-white min-h-screen font-['Inter',sans-serif]">
        <Navbar />

        <main className="pt-[130px] md:pt-[150px]">
          <div className="max-w-[1293px] mx-auto px-4 md:px-8">
            {/* Hero + Profile */}
            <HeroSection />

            {/* Stats */}
            <div className="mt-6 md:mt-8 lg:max-w-[790px]">
              <StatsRow />
            </div>

            {/* Bio */}
            <div className="mt-6 lg:max-w-[768px]">
              <BioText />
            </div>

            {/* Team Avatars */}
            <div className="mt-6">
              <TeamAvatars />
            </div>

            {/* Mobile Quote Card */}
            <div className="mt-6">
              <MobileQuoteSection />
            </div>

            {/* Trusted Since */}
            <div className="mt-8 md:mt-12">
              <TrustedSince />
            </div>

            {/* BTO Package CTA */}
            <div className="mt-6 md:mt-8">
              <BtoPackageCta />
            </div>

            {/* Projects */}
            <div className="mt-12 md:mt-16">
              <ProjectsSection />
            </div>
          </div>

          {/* Trust & Credentials (full width bg) */}
          <div className="mt-12 md:mt-16">
            <TrustCredentials />
          </div>

          {/* Case Studies */}
          <div className="mt-0">
            <CaseStudies />
          </div>

          {/* What Homeowners Say */}
          <div className="mt-0">
            <HomeownersSay />
          </div>

          {/* Google Review Cards with Images */}
          <div className="mt-0">
            <GoogleReviewCards />
          </div>

          {/* Service Area */}
          <div className="mt-0">
            <ServiceArea />
          </div>
        </main>

        {/* Footer */}
        <div className="w-full px-3 md:px-4">
          <DesignerProfileFooter />
        </div>
      </div>
    </DesignerDataContext.Provider>
  );
}