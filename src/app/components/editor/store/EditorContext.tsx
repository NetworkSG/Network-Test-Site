/* ═══════════════════════════════════════════════════════
   Editor Store — Single source of truth for floor plan state
   Uses React Context + useReducer (no external dependencies)
   ═══════════════════════════════════════════════════════ */
import { createContext, useContext, useReducer, useCallback, useRef, type ReactNode } from "react";
import type {
  HouseRoomDef, DoorDef, WindowDef, PlacedItem, SceneMaterials, SceneLighting,
  SharedWallData, SharedWallNeighbor,
} from "../types";
import { ensureOpeningIds, generateOpeningId } from "../types";
import { DEFAULT_HOUSE_ROOM_DEFS, DEFAULT_CAM_POS, DEFAULT_CAM_TARGET } from "../constants";

// ── State Shape ──

export interface EditorState {
  roomDefs: HouseRoomDef[];
  activeRoomId: string;
  selectedItemId: string | null;
  allRoomFurniture: Record<string, PlacedItem[]>;
  perRoomMaterials: Record<string, SceneMaterials>;
  perRoomLighting: Record<string, SceneLighting>;
  houseCamPos: [number, number, number];
  houseCamTarget: [number, number, number];
  is2DMode: boolean;
  isDirty: boolean;
  clipboard: PlacedItem | null;
  recentFurniture: string[];
}

// ── Actions ──

export type EditorAction =
  | { type: "SET_ROOM_DEFS"; defs: HouseRoomDef[] }
  | { type: "UPDATE_ROOM"; roomId: string; patch: Partial<HouseRoomDef> }
  | { type: "ADD_ROOM"; def: HouseRoomDef }
  | { type: "REMOVE_ROOM"; roomId: string }
  | { type: "MOVE_OPENING"; roomId: string; openingId: string; kind: "door" | "window"; newT: number }
  | { type: "CHANGE_OPENING_SIDE"; roomId: string; openingId: string; kind: "door" | "window"; newSide: string }
  | { type: "FLIP_OPENING"; roomId: string; openingId: string }
  | { type: "DELETE_OPENING"; roomId: string; openingId: string; kind: "door" | "window" }
  | { type: "ADD_OPENING"; roomId: string; kind: "door"; door: DoorDef }
  | { type: "ADD_OPENING"; roomId: string; kind: "window"; window: WindowDef }
  | { type: "SET_ACTIVE_ROOM"; roomId: string }
  | { type: "SET_SELECTED_ITEM"; itemId: string | null }
  | { type: "SET_FURNITURE"; roomId: string; items: PlacedItem[] }
  | { type: "SET_ALL_FURNITURE"; furniture: Record<string, PlacedItem[]> }
  | { type: "MOVE_FURNITURE_ITEM"; roomId: string; itemId: string; x: number; z: number }
  | { type: "ROTATE_FURNITURE_ITEM"; roomId: string; itemId: string; rotation: number }
  | { type: "DELETE_FURNITURE_ITEM"; roomId: string; itemId: string }
  | { type: "ADD_FURNITURE_ITEM"; roomId: string; item: PlacedItem }
  | { type: "SET_ROOM_MATERIALS"; roomId: string; materials: SceneMaterials }
  | { type: "SET_ROOM_LIGHTING"; roomId: string; lighting: SceneLighting }
  | { type: "SET_ALL_MATERIALS"; materials: Record<string, SceneMaterials> }
  | { type: "SET_ALL_LIGHTING"; lighting: Record<string, SceneLighting> }
  | { type: "SET_CAMERA"; pos: [number, number, number]; target: [number, number, number] }
  | { type: "SET_2D_MODE"; is2D: boolean }
  | { type: "SET_DIRTY"; dirty: boolean }
  | { type: "COPY_ITEM" }
  | { type: "PASTE_ITEM"; roomId: string }
  | { type: "TRACK_RECENT_FURNITURE"; furnitureId: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SNAPSHOT" }; // push current state onto undo stack

// ── Undo/Redo ──

interface UndoSnapshot {
  roomDefs: HouseRoomDef[];
  allRoomFurniture: Record<string, PlacedItem[]>;
}

const MAX_UNDO = 50;

interface UndoState {
  undoStack: UndoSnapshot[];
  redoStack: UndoSnapshot[];
}

function takeSnapshot(state: EditorState): UndoSnapshot {
  return {
    roomDefs: JSON.parse(JSON.stringify(state.roomDefs)),
    allRoomFurniture: JSON.parse(JSON.stringify(state.allRoomFurniture)),
  };
}

// ── Reducer ──

interface FullState extends EditorState {
  _undo: UndoState;
}

function pushUndo(state: FullState): FullState {
  const snapshot = takeSnapshot(state);
  return {
    ...state,
    _undo: {
      undoStack: [...state._undo.undoStack.slice(-(MAX_UNDO - 1)), snapshot],
      redoStack: [],
    },
  };
}

function editorReducer(state: FullState, action: EditorAction): FullState {
  switch (action.type) {
    case "SNAPSHOT":
      return pushUndo(state);

    case "UNDO": {
      const { undoStack, redoStack } = state._undo;
      if (undoStack.length === 0) return state;
      const snapshot = undoStack[undoStack.length - 1];
      const currentSnapshot = takeSnapshot(state);
      return {
        ...state,
        roomDefs: snapshot.roomDefs,
        allRoomFurniture: snapshot.allRoomFurniture,
        isDirty: true,
        _undo: {
          undoStack: undoStack.slice(0, -1),
          redoStack: [...redoStack, currentSnapshot],
        },
      };
    }

    case "REDO": {
      const { undoStack, redoStack } = state._undo;
      if (redoStack.length === 0) return state;
      const snapshot = redoStack[redoStack.length - 1];
      const currentSnapshot = takeSnapshot(state);
      return {
        ...state,
        roomDefs: snapshot.roomDefs,
        allRoomFurniture: snapshot.allRoomFurniture,
        isDirty: true,
        _undo: {
          undoStack: [...undoStack, currentSnapshot],
          redoStack: redoStack.slice(0, -1),
        },
      };
    }

    case "SET_ROOM_DEFS": {
      const defs = action.defs.map(ensureOpeningIds);
      return { ...state, roomDefs: defs, isDirty: true };
    }

    case "UPDATE_ROOM": {
      const roomDefs = state.roomDefs.map((r) =>
        r.id === action.roomId ? ensureOpeningIds({ ...r, ...action.patch }) : r
      );
      return { ...state, roomDefs, isDirty: true };
    }

    case "ADD_ROOM":
      return { ...state, roomDefs: [...state.roomDefs, ensureOpeningIds(action.def)], isDirty: true };

    case "REMOVE_ROOM":
      return {
        ...state,
        roomDefs: state.roomDefs.filter((r) => r.id !== action.roomId),
        activeRoomId: state.activeRoomId === action.roomId
          ? (state.roomDefs[0]?.id || "")
          : state.activeRoomId,
        isDirty: true,
      };

    case "MOVE_OPENING": {
      const roomDefs = state.roomDefs.map((r) => {
        if (r.id !== action.roomId) return r;
        if (action.kind === "door") {
          return { ...r, doors: r.doors.map((d) => d.id === action.openingId ? { ...d, t: action.newT } : d) };
        }
        return { ...r, windows: r.windows.map((w) => w.id === action.openingId ? { ...w, t: action.newT } : w) };
      });
      return { ...state, roomDefs, isDirty: true };
    }

    case "CHANGE_OPENING_SIDE": {
      const roomDefs = state.roomDefs.map((r) => {
        if (r.id !== action.roomId) return r;
        if (action.kind === "door") {
          return { ...r, doors: r.doors.map((d) =>
            d.id === action.openingId ? { ...d, side: action.newSide as DoorDef["side"] } : d
          )};
        }
        return { ...r, windows: r.windows.map((w) =>
          w.id === action.openingId ? { ...w, side: action.newSide as WindowDef["side"] } : w
        )};
      });
      return { ...state, roomDefs, isDirty: true };
    }

    case "FLIP_OPENING": {
      const roomDefs = state.roomDefs.map((r) => {
        if (r.id !== action.roomId) return r;
        return { ...r, doors: r.doors.map((d) =>
          d.id === action.openingId ? { ...d, flipped: !d.flipped } : d
        )};
      });
      return { ...state, roomDefs, isDirty: true };
    }

    case "DELETE_OPENING": {
      const roomDefs = state.roomDefs.map((r) => {
        if (r.id !== action.roomId) return r;
        if (action.kind === "door") {
          return { ...r, doors: r.doors.filter((d) => d.id !== action.openingId) };
        }
        return { ...r, windows: r.windows.filter((w) => w.id !== action.openingId) };
      });
      return { ...state, roomDefs, isDirty: true };
    }

    case "ADD_OPENING": {
      const roomDefs = state.roomDefs.map((r) => {
        if (r.id !== action.roomId) return r;
        if (action.kind === "door" && "door" in action) {
          const door = action.door.id ? action.door : { ...action.door, id: generateOpeningId("door") };
          return { ...r, doors: [...r.doors, door] };
        }
        if (action.kind === "window" && "window" in action) {
          const win = action.window.id ? action.window : { ...action.window, id: generateOpeningId("win") };
          return { ...r, windows: [...r.windows, win] };
        }
        return r;
      });
      return { ...state, roomDefs, isDirty: true };
    }

    case "SET_ACTIVE_ROOM":
      return { ...state, activeRoomId: action.roomId };

    case "SET_SELECTED_ITEM":
      return { ...state, selectedItemId: action.itemId };

    case "SET_FURNITURE":
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: action.items },
        isDirty: true,
      };

    case "SET_ALL_FURNITURE":
      return { ...state, allRoomFurniture: action.furniture };

    case "MOVE_FURNITURE_ITEM": {
      const items = (state.allRoomFurniture[action.roomId] || []).map((item) =>
        item.id === action.itemId
          ? { ...item, position: [action.x, item.position[1], action.z] as [number, number, number] }
          : item
      );
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: items },
        isDirty: true,
      };
    }

    case "ROTATE_FURNITURE_ITEM": {
      const items = (state.allRoomFurniture[action.roomId] || []).map((item) =>
        item.id === action.itemId ? { ...item, rotation: action.rotation } : item
      );
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: items },
        isDirty: true,
      };
    }

    case "DELETE_FURNITURE_ITEM": {
      const items = (state.allRoomFurniture[action.roomId] || []).filter(
        (item) => item.id !== action.itemId
      );
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: items },
        selectedItemId: state.selectedItemId === action.itemId ? null : state.selectedItemId,
        isDirty: true,
      };
    }

    case "ADD_FURNITURE_ITEM": {
      const existing = state.allRoomFurniture[action.roomId] || [];
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: [...existing, action.item] },
        isDirty: true,
      };
    }

    case "SET_ROOM_MATERIALS":
      return {
        ...state,
        perRoomMaterials: { ...state.perRoomMaterials, [action.roomId]: action.materials },
        isDirty: true,
      };

    case "SET_ROOM_LIGHTING":
      return {
        ...state,
        perRoomLighting: { ...state.perRoomLighting, [action.roomId]: action.lighting },
        isDirty: true,
      };

    case "SET_ALL_MATERIALS":
      return { ...state, perRoomMaterials: action.materials };

    case "SET_ALL_LIGHTING":
      return { ...state, perRoomLighting: action.lighting };

    case "SET_CAMERA":
      return { ...state, houseCamPos: action.pos, houseCamTarget: action.target };

    case "SET_2D_MODE":
      return { ...state, is2DMode: action.is2D };

    case "SET_DIRTY":
      return { ...state, isDirty: action.dirty };

    case "COPY_ITEM": {
      if (!state.selectedItemId) return state;
      const allItems = Object.values(state.allRoomFurniture).flat();
      const item = allItems.find((i) => i.id === state.selectedItemId);
      return item ? { ...state, clipboard: { ...item } } : state;
    }

    case "PASTE_ITEM": {
      if (!state.clipboard) return state;
      const newItem: PlacedItem = {
        ...state.clipboard,
        id: `${state.clipboard.furnitureId}-${Date.now().toString(36)}`,
        position: [
          state.clipboard.position[0] + 0.3,
          state.clipboard.position[1],
          state.clipboard.position[2] + 0.3,
        ],
      };
      const existing = state.allRoomFurniture[action.roomId] || [];
      return {
        ...state,
        allRoomFurniture: { ...state.allRoomFurniture, [action.roomId]: [...existing, newItem] },
        selectedItemId: newItem.id,
        isDirty: true,
      };
    }

    case "TRACK_RECENT_FURNITURE": {
      const filtered = state.recentFurniture.filter((id) => id !== action.furnitureId);
      return { ...state, recentFurniture: [action.furnitureId, ...filtered].slice(0, 8) };
    }

    default:
      return state;
  }
}

// ── Initial State Factory ──

export function createInitialState(overrides?: Partial<EditorState>): FullState {
  const roomDefs = (overrides?.roomDefs || JSON.parse(JSON.stringify(DEFAULT_HOUSE_ROOM_DEFS))).map(ensureOpeningIds);
  const baseState: EditorState = {
    roomDefs,
    activeRoomId: roomDefs[0]?.id || "",
    selectedItemId: null,
    allRoomFurniture: {},
    perRoomMaterials: {},
    perRoomLighting: {},
    houseCamPos: [...DEFAULT_CAM_POS] as [number, number, number],
    houseCamTarget: [...DEFAULT_CAM_TARGET] as [number, number, number],
    is2DMode: false,
    isDirty: false,
    clipboard: null,
    recentFurniture: [],
    ...overrides,
  };
  return {
    ...baseState,
    _undo: { undoStack: [], redoStack: [] },
  };
}

// ── Context ──

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<EditorState>;
}) {
  const [fullState, dispatch] = useReducer(editorReducer, initialState, (init) =>
    createInitialState(init)
  );

  const { _undo, ...state } = fullState;

  const value: EditorContextValue = {
    state,
    dispatch,
    canUndo: _undo.undoStack.length > 0,
    canRedo: _undo.redoStack.length > 0,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorStore(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditorStore must be used within <EditorProvider>");
  return ctx;
}

// Convenience hook: dispatch with automatic undo snapshot
export function useEditorAction() {
  const { dispatch } = useEditorStore();
  return useCallback(
    (action: EditorAction) => {
      // Auto-snapshot before mutating actions
      const mutating = ![
        "SET_ACTIVE_ROOM", "SET_SELECTED_ITEM", "SET_2D_MODE",
        "SET_DIRTY", "SET_CAMERA", "UNDO", "REDO", "SNAPSHOT",
        "COPY_ITEM", "TRACK_RECENT_FURNITURE",
      ].includes(action.type);
      if (mutating) dispatch({ type: "SNAPSHOT" });
      dispatch(action);
    },
    [dispatch],
  );
}
