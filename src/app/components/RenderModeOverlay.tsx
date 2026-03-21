import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";
import {
  ChevronLeft,
  Crosshair,
  Plus,
  Minus,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Camera,
  Loader2,
  Sparkles,
  Check,
  Home,
  Eye,
  ChevronRight,
  Paintbrush,
} from "lucide-react";
import { projectId as supaProjectId, publicAnonKey } from "/utils/supabase/info";
import { supabase as supabaseClient } from "./supabaseClient";

const API = `https://${supaProjectId}.supabase.co/functions/v1/make-server-4808de5e`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.access_token) {
      headers["X-User-Token"] = data.session.access_token;
    }
  } catch (_) {}
  return headers;
}

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */
type AspectRatio = "16:9" | "4:3" | "1:1";

interface RenderSettings {
  turnOffFloor: boolean;
  background: string; // "default" | bg id
  designStyle: string; // "none" | style id
}

interface SceneRef {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: any;
  groundPlane: THREE.Mesh | null;
  flyToPos: (pos: [number, number, number], target: [number, number, number], duration?: number) => void;
}

export interface RenderRoomDef {
  id: string;
  label: string;
  shortLabel: string;
  bounds: [number, number, number, number]; // xMin, xMax, zMin, zMax
}

interface RenderModeOverlayProps {
  sceneRef: React.RefObject<SceneRef | null>;
  onBack: () => void;
  editorProjectId?: string;
  editorProjectName?: string;
  rooms?: RenderRoomDef[];
}

/* ═══════════════════════════════════════════════════════
   Background Presets
   ═══════════════════════════════════════════════════════ */
const BG_PRESETS = [
  { id: "default", label: "Default", color: "#FFFFFF", thumb: null },
  {
    id: "park",
    label: "Park",
    color: "#D4E6D0",
    thumb: "https://images.unsplash.com/photo-1729206819594-b71b29ce631b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJrJTIwZ3JlZW4lMjB0cmVlcyUyMG91dGRvb3IlMjBzdW5ueXxlbnwxfHx8fDE3NzM2NTQ4ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "beach",
    label: "Beach",
    color: "#F5D5A0",
    thumb: "https://images.unsplash.com/photo-1697504379515-7c68171429b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGJlYWNoJTIwc3Vuc2V0JTIwcGFub3JhbWljfGVufDF8fHx8MTc3MzY1NDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "city",
    label: "City",
    color: "#C8D4E0",
    thumb: "https://images.unsplash.com/photo-1582625687024-4363b746e2f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjaXR5JTIwc2t5bGluZSUyMHVyYmFuJTIwZGF5dGltZXxlbnwxfHx8fDE3NzM2NTQ4ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "forest",
    label: "Forest",
    color: "#A8C0A0",
    thumb: "https://images.unsplash.com/photo-1634468788219-c6cd502e40de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjB0cmVlcyUyMG5hdHVyZSUyMHN1bmxpZ2h0fGVufDF8fHx8MTc3MzY1NDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "night",
    label: "Night City",
    color: "#1A1A2E",
    thumb: "https://images.unsplash.com/photo-1757843298369-6e5503c14bfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwbmlnaHQlMjBsaWdodHMlMjBza3lsaW5lfGVufDF8fHx8MTc3MzY1NDg4Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "cloudy",
    label: "Overcast",
    color: "#C0C8D0",
    thumb: "https://images.unsplash.com/photo-1763306625846-e8341843d2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbG91ZHklMjBza3klMjBvdmVyY2FzdCUyMGxhbmRzY2FwZXxlbnwxfHx8fDE3NzM2NTQ4ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "suburb",
    label: "Suburban",
    color: "#D8DCC8",
    thumb: "https://images.unsplash.com/photo-1763564447000-1543c3bdb8a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMHN1YnVyYmFuJTIwc3RyZWV0JTIwZGF5dGltZXxlbnwxfHx8fDE3NzM2NTQ4ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "sunrise",
    label: "Golden Hour",
    color: "#F0D0A0",
    thumb: "https://images.unsplash.com/photo-1635713256240-842030676891?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwaG9yaXpvbiUyMGdvbGRlbiUyMGhvdXJ8ZW58MXx8fHwxNzczNjU0ODg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

/* ═══════════════════════════════════════════════════════
   Design Style Presets
   ═══════════════════════════════════════════════════════ */
const DESIGN_STYLES = [
  { id: "none", label: "None", desc: "No style applied", thumb: null },
  {
    id: "scandinavian",
    label: "Scandinavian",
    desc: "Light wood, hygge warmth, cozy textiles",
    thumb: "https://images.unsplash.com/photo-1738520420690-9680253bf40b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2FuZGluYXZpYW4lMjBjb3p5JTIwaW50ZXJpb3IlMjB3b29kfGVufDF8fHx8MTc3MzczODM1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "traditional",
    label: "Traditional",
    desc: "Classic elegance, rich wood, ornate details",
    thumb: "https://images.unsplash.com/photo-1772380174547-0eae2188c985?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGNsYXNzaWMlMjBpbnRlcmlvciUyMGRlc2lnbiUyMGVsZWdhbnR8ZW58MXx8fHwxNzczODQzNTE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "japandi",
    label: "Japandi",
    desc: "Japanese minimalism meets Nordic simplicity",
    thumb: "https://images.unsplash.com/photo-1584515453937-c00929e621d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHplbiUyMGludGVyaW9yJTIwbWluaW1hbHxlbnwxfHx8fDE3NzM3MzgzNTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "modern",
    label: "Modern",
    desc: "Clean lines, neutral palette, minimal decor",
    thumb: "https://images.unsplash.com/photo-1547587091-f883cf8f0c12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsaXN0JTIwaW50ZXJpb3IlMjB3aGl0ZXxlbnwxfHx8fDE3NzM3MzgzNTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "transitional",
    label: "Transitional",
    desc: "Blend of traditional and contemporary",
    thumb: "https://images.unsplash.com/photo-1696938944368-7abfb4233ded?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFuc2l0aW9uYWwlMjBpbnRlcmlvciUyMGRlc2lnbiUyMG5ldXRyYWwlMjB3YXJtfGVufDF8fHx8MTc3Mzg0MzUxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "resort",
    label: "Resort",
    desc: "Tropical luxury, open spaces, natural materials",
    thumb: "https://images.unsplash.com/photo-1752769041878-f24e37fd6aea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMHJlc29ydCUyMHZpbGxhJTIwaW50ZXJpb3IlMjBsdXh1cnl8ZW58MXx8fHwxNzczODQzNTE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    desc: "Less is more, white space, essential forms",
    thumb: "https://images.unsplash.com/photo-1559051704-a687a261e2e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd2hpdGUlMjBpbnRlcmlvciUyMGNsZWFuJTIwc2ltcGxlfGVufDF8fHx8MTc3Mzg0MzUxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "retro",
    label: "Retro",
    desc: "70s vibes, bold shapes, funky patterns",
    thumb: "https://images.unsplash.com/photo-1751956155457-1e8ff7fbc295?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRybyUyMDcwcyUyMGludGVyaW9yJTIwZGVzaWduJTIwY29sb3JmdWx8ZW58MXx8fHwxNzczODQzNTE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "farmhouse",
    label: "Farmhouse",
    desc: "Rustic charm, wood beams, cozy textures",
    thumb: "https://images.unsplash.com/photo-1768486143865-342d8cc12c90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXN0aWMlMjBmYXJtaG91c2UlMjBpbnRlcmlvciUyMHdvb2QlMjBiZWFtc3xlbnwxfHx8fDE3NzM3MzgzNjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "contemporary",
    label: "Contemporary",
    desc: "Current trends, sleek finishes, open plan",
    thumb: "https://images.unsplash.com/photo-1758448721205-8465cebc26af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb250ZW1wb3JhcnklMjBzbGVlayUyMGludGVyaW9yJTIwZGVzaWdufGVufDF8fHx8MTc3Mzg0MzUyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "vintage",
    label: "Vintage",
    desc: "Antique charm, patina, nostalgic warmth",
    thumb: "https://images.unsplash.com/photo-1759774314733-215a4776151f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYW50aXF1ZSUyMGludGVyaW9yJTIwZGVjb3IlMjByb29tfGVufDF8fHx8MTc3Mzg0MzUyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "colourful",
    label: "Colourful",
    desc: "Bold hues, vibrant accents, playful energy",
    thumb: "https://images.unsplash.com/photo-1729482436140-8190b963379d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvdXJmdWwlMjB2aWJyYW50JTIwaW50ZXJpb3IlMjBib2xkJTIwZGVjb3J8ZW58MXx8fHwxNzczODQzNTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "industrial",
    label: "Industrial",
    desc: "Exposed brick, metal accents, raw textures",
    thumb: "https://images.unsplash.com/photo-1767294274791-00850286c180?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwbG9mdCUyMGludGVyaW9yJTIwYnJpY2t8ZW58MXx8fHwxNzczNzM4MzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "modern-luxe",
    label: "Modern Luxe",
    desc: "Glamorous gold, marble, luxury finishes",
    thumb: "https://images.unsplash.com/photo-1693842899089-f5058316ad0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsdXhlJTIwZ2xhbW9yb3VzJTIwaW50ZXJpb3IlMjBnb2xkJTIwbWFyYmxlfGVufDF8fHx8MTc3Mzg0MzUyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "dark",
    label: "Dark",
    desc: "Moody tones, dramatic contrast, deep hues",
    thumb: "https://images.unsplash.com/photo-1769600149573-df057212b3fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9vZHklMjBpbnRlcmlvciUyMGRlc2lnbiUyMGJsYWNrJTIwd2FsbHN8ZW58MXx8fHwxNzczODQzNTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "eclectic",
    label: "Eclectic",
    desc: "Mixed styles, curated chaos, personality",
    thumb: "https://images.unsplash.com/photo-1707047754373-ba65fd3f249f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY2xlY3RpYyUyMG1peGVkJTIwaW50ZXJpb3IlMjBkZXNpZ24lMjBib2hlbWlhbiUyMGFydHxlbnwxfHx8fDE3NzM4NDM1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "wabi-sabi",
    label: "Wabi-Sabi",
    desc: "Imperfect beauty, natural materials, organic",
    thumb: "https://images.unsplash.com/photo-1762541088571-34a2949af8a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3YWJpJTIwc2FiaSUyMGltcGVyZmVjdCUyMGludGVyaW9yJTIwbmF0dXJhbCUyMHJ1c3RpY3xlbnwxfHx8fDE3NzM4NDM1MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "unique",
    label: "Unique",
    desc: "One-of-a-kind, artistic, unconventional",
    thumb: "https://images.unsplash.com/photo-1768141740872-7cda6ed54c34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bmlxdWUlMjBjcmVhdGl2ZSUyMGludGVyaW9yJTIwYXJjaGl0ZWN0dXJlJTIwc3RhdGVtZW50fGVufDF8fHx8MTc3Mzg0MzUyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

/* ═══════════════════════════════════════════════════════
   Resolution helpers
   ═══════════════════════════════════════════════════════ */
function getResolution(aspect: AspectRatio): [number, number] {
  switch (aspect) {
    case "16:9": return [2560, 1440];
    case "4:3": return [2560, 1920];
    case "1:1": return [2560, 2560];
  }
}

/* ═══════════════════════════════════════════════════════
   Toggle Switch Component
   ══════════════════════════════════════════════════════ */
function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 ${
        enabled ? "bg-[#09090B]" : "bg-[#E5E7EB]"
      }`}
    >
      <div
        className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
          enabled ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Render Mode Overlay
   ═══════════════════════════════════════════════════════ */
export function RenderModeOverlay({ sceneRef, onBack, editorProjectId, editorProjectName, rooms }: RenderModeOverlayProps) {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [showSettings, setShowSettings] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [settings, setSettings] = useState<RenderSettings>({
    turnOffFloor: false,
    background: "default",
    designStyle: "none",
  });

  // Store original scene state for restoration
  const originalBgRef = useRef<THREE.Color | THREE.Texture | null>(null);
  const originalGroundVisRef = useRef(true);
  const savedOnce = useRef(false);

  // Save original state once
  useEffect(() => {
    const s = sceneRef.current;
    if (s && !savedOnce.current) {
      savedOnce.current = true;
      if (s.scene.background instanceof THREE.Color) {
        originalBgRef.current = s.scene.background.clone();
      }
      if (s.groundPlane) {
        originalGroundVisRef.current = s.groundPlane.visible;
      }
    }
  }, [sceneRef]);

  // Apply background color changes
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const preset = BG_PRESETS.find((p) => p.id === settings.background);
    if (preset) {
      s.scene.background = new THREE.Color(preset.color);
    }
  }, [settings.background, sceneRef]);

  // Apply floor visibility
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || !s.groundPlane) return;
    // Only toggle the ground plane, not the room floors
    s.groundPlane.visible = !settings.turnOffFloor;
  }, [settings.turnOffFloor, sceneRef]);

  // Lighting is inherited from the editor — no overrides in render mode

  // Restore on unmount
  useEffect(() => {
    return () => {
      const s = sceneRef.current;
      if (s) {
        if (originalBgRef.current) {
          s.scene.background = originalBgRef.current;
        }
        if (s.groundPlane) {
          s.groundPlane.visible = originalGroundVisRef.current;
        }
      }
    };
  }, [sceneRef]);

  const [res] = [getResolution(aspectRatio)];

  // Camera controls
  const handleCenterView = useCallback(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.controls.reset();
  }, [sceneRef]);

  const handleZoom = useCallback(
    (dir: number) => {
      const s = sceneRef.current;
      if (!s) return;
      const factor = dir > 0 ? 0.8 : 1.25;
      s.camera.position.lerp(s.controls.target, 1 - factor);
      s.controls.update();
    },
    [sceneRef]
  );

  const handleOrbit = useCallback(
    (dir: "up" | "down") => {
      const s = sceneRef.current;
      if (!s) return;
      const angle = dir === "up" ? -0.15 : 0.15;
      const offset = s.camera.position.clone().sub(s.controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + angle));
      offset.setFromSpherical(spherical);
      s.camera.position.copy(s.controls.target).add(offset);
      s.camera.lookAt(s.controls.target);
      s.controls.update();
    },
    [sceneRef]
  );

  // AI render state
  const [renderStatus, setRenderStatus] = useState<"idle" | "capturing" | "uploading" | "submitted" | "error">("idle");
  const [renderError, setRenderError] = useState<string | null>(null);

  // Render (capture screenshot at 4K, upload to server, submit to AI)
  const handleRender = useCallback(async () => {
    const s = sceneRef.current;
    if (!s) return;
    setIsRendering(true);
    setRenderStatus("capturing");
    setRenderError(null);

    try {
      // Save current renderer size
      const origSize = new THREE.Vector2();
      s.renderer.getSize(origSize);
      const origAspect = s.camera.aspect;
      const origPixelRatio = s.renderer.getPixelRatio();

      // Set to render resolution
      s.renderer.setPixelRatio(1);
      s.renderer.setSize(res[0], res[1]);
      s.camera.aspect = res[0] / res[1];
      s.camera.updateProjectionMatrix();

      // Render
      s.renderer.render(s.scene, s.camera);

      // Capture as base64 PNG
      const dataUrl = s.renderer.domElement.toDataURL("image/png");

      // Restore original size
      s.renderer.setPixelRatio(origPixelRatio);
      s.renderer.setSize(origSize.x, origSize.y);
      s.camera.aspect = origAspect;
      s.camera.updateProjectionMatrix();
      s.renderer.render(s.scene, s.camera);

      // Strip data URL prefix to get pure base64
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

      setRenderStatus("uploading");

      // Send to server for AI rendering
      const headers = await getAuthHeaders();
      const response = await fetch(`${API}/fp3d/editor-render`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageBase64: base64,
          projectId: editorProjectId || null,
          projectName: editorProjectName || "Untitled",
          aspectRatio,
          designStyle: settings.designStyle !== "none" ? settings.designStyle : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("[Render] Server error:", result);
        setRenderError(result.error || "Failed to submit render");
        setRenderStatus("error");
        return;
      }

      console.log("[Render] Submitted successfully:", result.renderId);
      setRenderStatus("submitted");

      // Auto-dismiss success state after 5 seconds
      setTimeout(() => {
        setRenderStatus("idle");
      }, 5000);
    } catch (e: any) {
      console.error("[Render] Failed:", e);
      setRenderError(e.message || "Unexpected error");
      setRenderStatus("error");
    } finally {
      setIsRendering(false);
    }
  }, [sceneRef, res, aspectRatio, editorProjectId, editorProjectName, settings.designStyle]);

  // Save current camera view
  const handleSaveView = useCallback(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.renderer.render(s.scene, s.camera);
    const dataUrl = s.renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `view-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [sceneRef]);

  // ═══ Room Perspective View ═══
  const WALL_H = 2.6;
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [activeRoomView, setActiveRoomView] = useState<string | null>(null);

  const flyToRoom = useCallback((room: RenderRoomDef) => {
    const s = sceneRef.current;
    if (!s) return;
    const [xMin, xMax, zMin, zMax] = room.bounds;
    const cx = (xMin + xMax) / 2;
    const cz = (zMin + zMax) / 2;
    const rw = xMax - xMin;
    const rd = zMax - zMin;
    const camPos: [number, number, number] = [cx + rw * 0.35, WALL_H * 0.55, cz + rd * 0.35];
    const camTarget: [number, number, number] = [cx, WALL_H * 0.3, cz];
    s.flyToPos(camPos, camTarget, 900);
    setActiveRoomView(room.id);
    setShowRoomPicker(false);
  }, [sceneRef]);

  const flyToOverview = useCallback(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.controls.reset();
    setActiveRoomView(null);
    setShowRoomPicker(false);
  }, [sceneRef]);

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 z-50 pointer-events-auto">
        <div className="bg-white/76 backdrop-blur-[16.75px] rounded-[100px] shadow-[0_11px_34.4px_-5px_rgba(0,0,0,0.1)] border border-white/50 px-3 md:px-4 py-2 flex items-center justify-between">
          {/* Left: Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#09090B] hover:opacity-70 transition-opacity active:scale-95"
          >
            <ChevronLeft className="size-[16px]" strokeWidth={2} />
            <span className="font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px]">Back</span>
          </button>

          {/* Center: Aspect ratio toggles + resolution */}
          <div className="hidden md:flex items-center gap-3">
            {/* Aspect ratio pills */}
            <div className="flex items-center bg-[#F6F6F6] rounded-[100px] p-0.5">
              {(["16:9", "4:3", "1:1"] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.3px] transition-all duration-200 ${
                    aspectRatio === ratio
                      ? "bg-white text-[#09090B] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                      : "text-[#71717A] hover:text-[#09090B]"
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Resolution display */}
            {/* removed — resolution info moved to settings */}
          </div>

          {/* Right: Settings, Camera, Render */}
          <div className="flex items-center gap-1.5">
            {/* Room Views toggle */}
            {rooms && rooms.length > 0 && (
              <button
                onClick={() => { setShowRoomPicker(!showRoomPicker); setShowSettings(false); }}
                className={`hidden md:flex size-[32px] rounded-full items-center justify-center transition-colors ${
                  showRoomPicker
                    ? "bg-[#09090B] text-white"
                    : "hover:bg-[#F6F6F6] text-[#09090B]"
                }`}
                title="Room Views"
              >
                <Eye className="size-[15px]" strokeWidth={1.5} />
              </button>
            )}

            {/* Settings toggle */}
            <button
              onClick={() => { setShowSettings(!showSettings); setShowRoomPicker(false); }}
              className={`size-[32px] rounded-full flex items-center justify-center transition-colors ${
                showSettings
                  ? "bg-[#09090B] text-white"
                  : "hover:bg-[#F6F6F6] text-[#09090B]"
              }`}
              title="Render Settings"
            >
              <SlidersHorizontal className="size-[15px]" strokeWidth={1.5} />
            </button>

            {/* Camera/screenshot — hidden on mobile */}
            <button
              onClick={handleSaveView}
              className="hidden md:flex size-[32px] rounded-full items-center justify-center hover:bg-[#F6F6F6] text-[#09090B] transition-colors"
              title="Save View"
            >
              <Camera className="size-[15px]" strokeWidth={1.5} />
            </button>

            {/* Render CTA Button */}
            <button
              onClick={handleRender}
              disabled={isRendering || renderStatus === "submitted"}
              className={`flex items-center gap-2 h-[34px] px-4 rounded-[100px] font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] transition-all active:scale-95 disabled:opacity-60 ${
                renderStatus === "submitted"
                  ? "bg-emerald-600 text-white"
                  : renderStatus === "error"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#09090B] text-white hover:opacity-90"
              }`}
            >
              {renderStatus === "capturing" ? (
                <>
                  <Loader2 className="size-[14px] animate-spin" strokeWidth={2} />
                  <span className="hidden sm:inline">Capturing...</span>
                </>
              ) : renderStatus === "uploading" ? (
                <>
                  <Loader2 className="size-[14px] animate-spin" strokeWidth={2} />
                  <span className="hidden sm:inline">Uploading...</span>
                </>
              ) : renderStatus === "submitted" ? (
                <>
                  <Check className="size-[14px]" strokeWidth={2} />
                  <span className="hidden sm:inline">Submitted</span>
                </>
              ) : renderStatus === "error" ? (
                <>
                  <Sparkles className="size-[14px]" strokeWidth={1.5} />
                  <span>Retry</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-[14px]" strokeWidth={1.5} />
                  <span>AI Render</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT SIDE CAMERA CONTROLS ═══ */}
      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
        <div className="flex flex-col gap-1.5">
          {/* Center view */}
          <button
            onClick={handleCenterView}
            className="size-[36px] rounded-[12px] bg-white/90 backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-center text-[#09090B] hover:bg-white transition-colors active:scale-95"
            title="Center View"
          >
            <Crosshair className="size-[16px]" strokeWidth={1.5} />
          </button>

          {/* Zoom in */}
          <button
            onClick={() => handleZoom(1)}
            className="size-[36px] rounded-[12px] bg-white/90 backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-center text-[#09090B] hover:bg-white transition-colors active:scale-95"
            title="Zoom In"
          >
            <Plus className="size-[16px]" strokeWidth={1.5} />
          </button>

          {/* Zoom out */}
          <button
            onClick={() => handleZoom(-1)}
            className="size-[36px] rounded-[12px] bg-white/90 backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-center text-[#09090B] hover:bg-white transition-colors active:scale-95"
            title="Zoom Out"
          >
            <Minus className="size-[16px]" strokeWidth={1.5} />
          </button>

          <div className="h-1" />

          {/* Orbit up */}
          <button
            onClick={() => handleOrbit("up")}
            className="size-[36px] rounded-[12px] bg-white/90 backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-center text-[#09090B] hover:bg-white transition-colors active:scale-95"
            title="Orbit Up"
          >
            <ChevronUp className="size-[16px]" strokeWidth={1.5} />
          </button>

          {/* Orbit down */}
          <button
            onClick={() => handleOrbit("down")}
            className="size-[36px] rounded-[12px] bg-white/90 backdrop-blur-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 flex items-center justify-center text-[#09090B] hover:bg-white transition-colors active:scale-95"
            title="Orbit Down"
          >
            <ChevronDown className="size-[16px]" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ═══ BOTTOM RIGHT: SAVE VIEW ═══ */}
      <div className="absolute bottom-4 right-3 md:right-4 z-50 pointer-events-auto">
        <button
          onClick={handleSaveView}
          className="flex items-center gap-2 h-[36px] px-4 bg-white/90 backdrop-blur-[8px] rounded-[100px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50 text-[#09090B] hover:bg-white transition-colors active:scale-95"
        >
          <span className="font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.2px]">Save View</span>
          <Crosshair className="size-[14px]" strokeWidth={1.5} />
        </button>
      </div>

      {/* ═══ SETTINGS PANEL (Dropdown) ═══ */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop to close */}
            <div
              className="absolute inset-0 z-[45] pointer-events-auto"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-[60px] md:top-[68px] left-3 right-3 md:left-auto md:right-[120px] z-50 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full md:w-[320px] md:ml-auto bg-white/95 backdrop-blur-[16.75px] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.12)] border border-[#F3F4F6] overflow-hidden">
                {/* Header */}
                <div className="border-b border-[#F3F4F6] px-5 py-3.5">
                  <span className="font-['Inter',sans-serif] text-[14px] font-medium text-[#09090B] tracking-[-0.3px]">
                    Scene Settings
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[60vh] overflow-auto">
                  <div className="flex flex-col gap-5">
                    {/* Render Size — mobile only */}
                    <div className="md:hidden">
                      <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#09090B] tracking-[-0.3px] block mb-3">
                        Render Size
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-[#F6F6F6] rounded-[100px] p-0.5">
                          {(["16:9", "4:3", "1:1"] as AspectRatio[]).map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => setAspectRatio(ratio)}
                              className={`px-4 py-2 rounded-[100px] font-['Inter',sans-serif] text-[13px] font-medium tracking-[-0.3px] transition-all duration-200 ${
                                aspectRatio === ratio
                                  ? "bg-white text-[#09090B] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                                  : "text-[#71717A]"
                              }`}
                            >
                              {ratio}
                            </button>
                          ))}
                        </div>
                        <span className="font-['Inter',sans-serif] text-[11px] text-[#ABABAB] tabular-nums">
                          {res[0]}x{res[1]}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-[#F3F4F6] md:hidden" />

                    {/* Turn off floor */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-['Inter',sans-serif] text-[14px] font-semibold tracking-[-0.3px] ${
                          settings.background === "default" ? "text-[#ABABAB]" : "text-[#09090B]"
                        }`}>
                          Turn off floor
                        </span>
                        <ToggleSwitch
                          enabled={settings.turnOffFloor}
                          onChange={(v) => setSettings((p) => ({ ...p, turnOffFloor: v }))}
                        />
                      </div>
                      <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] leading-relaxed">
                        If you enable this option, the system floor will be hidden.
                        {settings.background === "default" && (
                          <span className="block mt-0.5 text-[#C0C0C0]">Not available with default background</span>
                        )}
                      </p>
                    </div>

                    <div className="h-px bg-[#F3F4F6]" />

                    {/* Background */}
                    <div>
                      <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#09090B] tracking-[-0.3px] block mb-3">
                        Background
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {BG_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setSettings((p) => ({ ...p, background: preset.id }))}
                            className={`relative aspect-square rounded-[10px] overflow-hidden border-2 transition-all duration-200 ${
                              settings.background === preset.id
                                ? "border-[#09090B] shadow-[0_0_0_1px_#09090B]"
                                : "border-[#E5E7EB] hover:border-[#C0C0C0]"
                            }`}
                          >
                            {preset.thumb ? (
                              <img
                                src={preset.thumb}
                                alt={preset.label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white flex items-center justify-center">
                                <div className="w-[60%] h-[60%] border border-[#E5E7EB] rounded-[4px]" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-[#F3F4F6]" />

                    {/* Design Style */}
                    <div>
                      <span className="font-['Inter',sans-serif] text-[14px] font-semibold text-[#09090B] tracking-[-0.3px] block mb-1">
                        Design Style
                      </span>
                      <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] leading-relaxed mb-3">
                        Applied to AI renders as a style prompt
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {DESIGN_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSettings((p) => ({ ...p, designStyle: style.id }))}
                            className={`relative rounded-[10px] overflow-hidden border-2 transition-all duration-200 ${
                              settings.designStyle === style.id
                                ? "border-[#09090B] shadow-[0_0_0_1px_#09090B]"
                                : "border-[#E5E7EB] hover:border-[#C0C0C0]"
                            }`}
                          >
                            <div className="aspect-square overflow-hidden">
                              {style.thumb ? (
                                <img
                                  src={style.thumb}
                                  alt={style.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#F9FAFB] flex items-center justify-center">
                                  <Paintbrush className="size-[18px] text-[#C0C0C0]" strokeWidth={1.5} />
                                </div>
                              )}
                            </div>
                            <div className="px-1.5 py-1.5 bg-white">
                              <span className={`font-['Inter',sans-serif] text-[10px] tracking-[-0.2px] block text-center truncate ${
                                settings.designStyle === style.id ? "font-semibold text-[#09090B]" : "text-[#71717A]"
                              }`}>
                                {style.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-[#F3F4F6]" />

                    {/* Info note */}
                    <p className="font-['Inter',sans-serif] text-[12px] text-[#ABABAB] leading-relaxed">
                      Lighting and time of day are inherited from the editor. Adjust them in the Customize panel before entering render mode.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ ROOM PICKER (Dropdown) ═══ */}
      <AnimatePresence>
        {showRoomPicker && (
          <>
            {/* Backdrop to close */}
            <div
              className="absolute inset-0 z-[45] pointer-events-auto"
              onClick={() => setShowRoomPicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-[68px] right-[100px] md:right-[120px] z-50 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-[260px] bg-white/95 backdrop-blur-[16.75px] rounded-[17px] shadow-[0_25px_35.9px_rgba(0,0,0,0.12)] border border-[#F3F4F6] overflow-hidden">
                {/* Header */}
                <div className="border-b border-[#F3F4F6] px-5 py-3.5">
                  <span className="font-['Inter',sans-serif] text-[14px] font-medium text-[#09090B] tracking-[-0.3px]">
                    Room Views
                  </span>
                  <p className="font-['Inter',sans-serif] text-[11px] text-[#71717A] mt-0.5">
                    Fly to a room perspective
                  </p>
                </div>

                {/* Room list */}
                <div className="max-h-[50vh] overflow-auto py-1">
                  {/* Overview */}
                  <button
                    onClick={flyToOverview}
                    className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition-colors ${
                      activeRoomView === null ? "bg-[#F6F6F6]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className={`size-[28px] rounded-[8px] flex items-center justify-center shrink-0 ${
                      activeRoomView === null ? "bg-[#09090B]" : "bg-[#F6F6F6]"
                    }`}>
                      <Home className={`size-[14px] ${activeRoomView === null ? "text-white" : "text-[#71717A]"}`} strokeWidth={1.5} />
                    </div>
                    <span className={`font-['Inter',sans-serif] text-[13px] tracking-[-0.2px] ${
                      activeRoomView === null ? "font-semibold text-[#09090B]" : "text-[#09090B]"
                    }`}>
                      Overview
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="mx-5 my-1 h-px bg-[#F3F4F6]" />

                  {/* Rooms */}
                  {rooms?.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => flyToRoom(room)}
                      className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left transition-colors ${
                        activeRoomView === room.id ? "bg-[#F6F6F6]" : "hover:bg-[#F9FAFB]"
                      }`}
                    >
                      <div className={`size-[28px] rounded-[8px] flex items-center justify-center shrink-0 ${
                        activeRoomView === room.id ? "bg-[#09090B]" : "bg-[#F6F6F6]"
                      }`}>
                        <Eye className={`size-[14px] ${activeRoomView === room.id ? "text-white" : "text-[#71717A]"}`} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-['Inter',sans-serif] text-[13px] tracking-[-0.2px] block truncate ${
                          activeRoomView === room.id ? "font-semibold text-[#09090B]" : "text-[#09090B]"
                        }`}>
                          {room.shortLabel}
                        </span>
                        <span className="font-['Inter',sans-serif] text-[10px] text-[#ABABAB]">
                          {((room.bounds[1] - room.bounds[0]) * (room.bounds[3] - room.bounds[2])).toFixed(1)} m²
                        </span>
                      </div>
                      <ChevronRight className="size-[12px] text-[#C0C0C0] shrink-0" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MOBILE FLOATING ROOM VIEWS ═══ */}
      {rooms && rooms.length > 0 && (
        <div className="md:hidden absolute bottom-20 left-0 right-0 z-50 pointer-events-auto flex justify-center px-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide bg-white/80 backdrop-blur-[12px] rounded-[100px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-white/50 px-2 py-1.5 max-w-[calc(100%-24px)]">
            {/* Overview */}
            <button
              onClick={flyToOverview}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.2px] transition-all ${
                activeRoomView === null
                  ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                  : "text-[#71717A] active:bg-[#F6F6F6]"
              }`}
            >
              <Home className="size-[12px]" strokeWidth={1.5} />
              <span>All</span>
            </button>

            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => flyToRoom(room)}
                className={`shrink-0 px-3 py-1.5 rounded-[100px] font-['Inter',sans-serif] text-[12px] font-medium tracking-[-0.2px] transition-all whitespace-nowrap ${
                  activeRoomView === room.id
                    ? "bg-[#09090B] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                    : "text-[#71717A] active:bg-[#F6F6F6]"
                }`}
              >
                {room.shortLabel}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ASPECT RATIO GUIDE OVERLAY ═══ */}
      {aspectRatio !== "16:9" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div
            className="border-2 border-dashed border-[#09090B]/20 rounded-[8px]"
            style={{
              width: aspectRatio === "4:3" ? "75vmin" : "60vmin",
              aspectRatio: aspectRatio === "4:3" ? "4/3" : "1/1",
              maxWidth: "90%",
              maxHeight: "80%",
            }}
          />
        </div>
      )}

      {/* ═══ RENDER STATUS TOAST ═══ */}
      <AnimatePresence>
        {(renderStatus === "submitted" || renderStatus === "error") && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <div className={`flex items-center gap-3 px-5 py-3 rounded-[100px] shadow-[0_25px_35.9px_rgba(0,0,0,0.12)] backdrop-blur-[16.75px] border ${
              renderStatus === "submitted"
                ? "bg-emerald-50/95 border-emerald-200"
                : "bg-red-50/95 border-red-200"
            }`}>
              {renderStatus === "submitted" ? (
                <>
                  <div className="size-[24px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="size-[14px] text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-emerald-900 tracking-[-0.2px]">
                      AI Render submitted
                    </p>
                    <p className="font-['Inter',sans-serif] text-[11px] text-emerald-700">
                      Processing server-side. Check the Renders tab in your dashboard.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-[24px] rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-[14px] font-bold">!</span>
                  </div>
                  <div>
                    <p className="font-['Inter',sans-serif] text-[13px] font-semibold text-red-900 tracking-[-0.2px]">
                      Render failed
                    </p>
                    <p className="font-['Inter',sans-serif] text-[11px] text-red-700">
                      {renderError || "Please try again."}
                    </p>
                  </div>
                  <button
                    onClick={() => setRenderStatus("idle")}
                    className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <span className="font-['Inter',sans-serif] text-[12px] font-medium">Dismiss</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}