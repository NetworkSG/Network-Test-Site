/* ═══════════════════════════════════════════════════════
   Editor Module — Barrel Export
   ═══════════════════════════════════════════════════════ */

// Types
export type {
  HouseRoomDef, DoorDef, WindowDef, PlacedItem, CatalogItem,
  SceneMaterials, SceneLighting, ThreeSceneRef,
  SharedWallData, SharedWallNeighbor, RoomBounds, RoomZone,
  EditableRoom, EditableDoor, EditableWindow, StandaloneWall,
  Side, LeftPanel, CustomizeTab,
} from "./types";
export { ensureOpeningIds, generateOpeningId } from "./types";

// Constants
export {
  WALL_H, WALL_THICK,
  FURNITURE_CATEGORIES, CATALOG, MATERIAL_DEFS, MATERIALS_UI,
  ROOM_ZONES, DINING_TABLE_IDS, DINING_CHAIR_IDS,
  DEFAULT_HOUSE_ROOM_DEFS, DEFAULT_CAM_POS, DEFAULT_CAM_TARGET,
} from "./constants";

// Store
export { EditorProvider, useEditorStore, useEditorAction } from "./store/EditorContext";
export type { EditorState, EditorAction } from "./store/EditorContext";

// Scene utilities
export { disposeObject3D, disposeMaterial, disposeCSS2DLabel, clearTextureCache, disposeScene } from "./scene/dispose-utils";
export {
  pointInPoly, boxInPoly, insetPolygon, getRoomBounds,
  isPointInRoom, isBoxInRoom, findRoomForPosition, findRoomForBox,
  convertTBetweenWalls, computeOpeningWorldPos, computeSharedWallData,
} from "./scene/room-builder";

// Persistence
export { getEditorAuthHeaders, serializeProjectData, deserializeProjectData, API } from "./persistence/save-load";
export type { ProjectData } from "./persistence/save-load";
