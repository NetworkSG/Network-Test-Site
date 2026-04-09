/* ═══════════════════════════════════════════════════════
   Save / Load Manager
   Handles project serialization, persistence, and auth headers
   ═══════════════════════════════════════════════════════ */
import type { HouseRoomDef, PlacedItem, SceneMaterials, SceneLighting } from "../types";
import { ensureOpeningIds } from "../types";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase as supabaseClient } from "../../supabaseClient";

const API = `https://${projectId}.supabase.co/functions/v1/make-server-4808de5e`;

export async function getEditorAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
    "Content-Type": "application/json",
  };
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      const { data: refreshData } = await supabaseClient.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        headers["X-User-Token"] = refreshData.session.access_token;
      }
    } else if (data?.session?.access_token) {
      headers["X-User-Token"] = data.session.access_token;
    }
  } catch (e) {
    console.error("[Editor Auth] Failed to get auth token:", e);
  }
  return headers;
}

// ── Project Data Shape (matches existing Supabase format for backward compat) ──

export interface ProjectData {
  furniture: Record<string, PlacedItem[]>;
  roomDefinitions: HouseRoomDef[];
  perRoomMaterials?: Record<string, SceneMaterials>;
  perRoomLighting?: Record<string, SceneLighting>;
  globalTimeOfDay?: number;
  houseName?: string;
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
}

/**
 * Deserialize project data, ensuring all openings have IDs (backward compat).
 */
export function deserializeProjectData(data: ProjectData): {
  roomDefs: HouseRoomDef[];
  furniture: Record<string, PlacedItem[]>;
  materials: Record<string, SceneMaterials>;
  lighting: Record<string, SceneLighting>;
  cameraPos?: [number, number, number];
  cameraTarget?: [number, number, number];
  houseName?: string;
} {
  const roomDefs = (data.roomDefinitions || []).map(ensureOpeningIds);
  return {
    roomDefs,
    furniture: data.furniture || {},
    materials: data.perRoomMaterials || {},
    lighting: data.perRoomLighting || {},
    cameraPos: data.cameraPos,
    cameraTarget: data.cameraTarget,
    houseName: data.houseName,
  };
}

/**
 * Serialize editor state to project data for saving.
 */
export function serializeProjectData(
  roomDefs: HouseRoomDef[],
  furniture: Record<string, PlacedItem[]>,
  materials: Record<string, SceneMaterials>,
  lighting: Record<string, SceneLighting>,
  houseName: string,
  cameraPos: [number, number, number],
  cameraTarget: [number, number, number],
): ProjectData {
  return {
    roomDefinitions: roomDefs,
    furniture,
    perRoomMaterials: materials,
    perRoomLighting: lighting,
    houseName,
    cameraPos,
    cameraTarget,
  };
}

export { API };
