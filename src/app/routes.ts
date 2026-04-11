import { createBrowserRouter, Outlet, useLocation } from "react-router";
import { lazy, Suspense, createElement, useEffect, useRef, useState } from "react";
import { useVisitorHeartbeat } from "./hooks/useVisitorHeartbeat";
import { HomepageV8 } from "./components/homepage/v8/HomepageV8";
import { AdminGuard } from "./components/AdminGuard";

// ── Lazy-loaded routes (code-split per page) ──────────────────────
const LazyHomePage = lazy(() => import("./components/HomePage").then((m) => ({ default: m.HomePage })));
const LazyGetMatchedForm = lazy(() => import("./components/GetMatchedForm").then((m) => ({ default: m.GetMatchedForm })));
const LazyRenderLanding = lazy(() => import("./components/RenderLanding").then((m) => ({ default: m.RenderLanding })));
const LazyDesignerProfile = lazy(() => import("./components/DesignerProfile").then((m) => ({ default: m.DesignerProfile })));
const LazyAdminDashboard = lazy(() => import("./components/AdminDashboard").then((m) => ({ default: m.AdminDashboard })));
const LazyCostGuide = lazy(() => import("./components/CostGuide").then((m) => ({ default: m.CostGuide })));
const LazyDesignersDirectory = lazy(() => import("./components/DesignersDirectory").then((m) => ({ default: m.DesignersDirectory })));
const LazyFloorPlan3DLanding = lazy(() => import("./components/FloorPlan3DLanding").then((m) => ({ default: m.FloorPlan3DLanding })));
const LazyFloorPlan3DDashboard = lazy(() => import("./components/FloorPlan3DDashboard").then((m) => ({ default: m.FloorPlan3DDashboard })));
const LazyFloorPlan3DEditor = lazy(() => import("./components/FloorPlan3DEditor").then((m) => ({ default: m.FloorPlan3DEditor })));
const LazyProjectPage = lazy(() => import("./components/ProjectPage").then((m) => ({ default: m.ProjectPage })));
const LazyDesignerDashboard = lazy(() => import("./components/DesignerDashboard").then((m) => ({ default: m.DesignerDashboard })));
const LazyHomeownerDashboard = lazy(() => import("./components/HomeownerDashboard").then((m) => ({ default: m.HomeownerDashboard })));
const LazyExplorePage = lazy(() => import("./components/ExplorePage").then((m) => ({ default: m.ExplorePage })));
const LazyHandshakeLanding = lazy(() => import("./components/HandshakeLanding").then((m) => ({ default: m.HandshakeLanding })));
const LazyDesignerProfileEditor = lazy(() => import("./components/DesignerProfileEditor").then((m) => ({ default: m.DesignerProfileEditor })));
const LazyStyleQuizLanding = lazy(() => import("./components/style-quiz/StyleQuizLanding").then((m) => ({ default: m.StyleQuizLanding })));
const LazyStyleQuizPage = lazy(() => import("./components/style-quiz/StyleQuizPage").then((m) => ({ default: m.StyleQuizPage })));
const LazyMoodBoardLanding = lazy(() => import("./components/mood-board/MoodBoardLanding").then((m) => ({ default: m.MoodBoardLanding })));
const LazyMoodBoardGate = lazy(() => import("./components/mood-board/MoodBoardGate").then((m) => ({ default: m.MoodBoardGate })));
const LazyMoodBoardPage = lazy(() => import("./components/mood-board/MoodBoardPage").then((m) => ({ default: m.MoodBoardPage })));

// ── Shared loading fallback ───────────────────────────────────────
const pageFallback = createElement("div", {
  className: "min-h-screen flex items-center justify-center",
  style: { background: "#f0ede6" },
}, createElement("div", { className: "w-8 h-8 border-3 border-[#0f0f0d] border-t-transparent rounded-full animate-spin" }));

const editorFallback = createElement("div", { className: "h-screen w-screen flex items-center justify-center bg-[#C5CDD5] font-['Inter',sans-serif]" },
  createElement("div", { className: "text-center" },
    createElement("div", { className: "w-10 h-10 border-4 border-[#09090B] border-t-transparent rounded-full animate-spin mx-auto mb-4" }),
    createElement("p", { className: "text-[#09090B] text-sm font-medium" }, "Loading 3D Editor...")
  )
);

// ── Suspense wrappers ─────────────────────────────────────────────
function LazyRoute({ component }: { component: React.LazyExoticComponent<React.ComponentType<any>> }) {
  return createElement(Suspense, { fallback: pageFallback }, createElement(component));
}

function EditorWrapper() {
  return createElement(Suspense, { fallback: editorFallback }, createElement(LazyFloorPlan3DEditor));
}

function TemplateEditorWrapper() {
  return createElement(
    AdminGuard,
    null,
    createElement(Suspense, { fallback: editorFallback }, createElement(LazyFloorPlan3DEditor, { mode: "template" }))
  );
}

// ── Root layout ───────────────────────────────────────────────────
function RootLayout() {
  useVisitorHeartbeat();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsTransitioning(true);
      const t = setTimeout(() => setIsTransitioning(false), 10);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  return createElement(
    "div",
    { key: location.pathname, style: { animation: "pageFadeIn 0.3s ease-out forwards" } },
    createElement(Outlet)
  );
}

// ── Router ────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  { Component: RootLayout, children: [
  { path: "/", Component: HomepageV8 },
  { path: "/old-homepage", element: createElement(LazyRoute, { component: LazyHomePage }) },
  { path: "/get-matched", element: createElement(LazyRoute, { component: LazyGetMatchedForm }) },
  { path: "/render-tool", element: createElement(LazyRoute, { component: LazyRenderLanding }) },
  { path: "/cost-guide", element: createElement(LazyRoute, { component: LazyCostGuide }) },
  { path: "/designers", element: createElement(LazyRoute, { component: LazyDesignersDirectory }) },
  { path: "/designer/:slug", element: createElement(LazyRoute, { component: LazyDesignerProfile }) },
  { path: "/designer/:slug/project/:projectId", element: createElement(LazyRoute, { component: LazyProjectPage }) },
  { path: "/admin", element: createElement(LazyRoute, { component: LazyAdminDashboard }) },
  { path: "/admin/template-editor", Component: TemplateEditorWrapper },
  { path: "/admin/template-editor/:templateId", Component: TemplateEditorWrapper },
  { path: "/floorplan3d", element: createElement(LazyRoute, { component: LazyFloorPlan3DLanding }) },
  { path: "/floorplan3d/dashboard", element: createElement(LazyRoute, { component: LazyFloorPlan3DDashboard }) },
  { path: "/floorplan3d/editor", Component: EditorWrapper },
  { path: "/floorplan3d/editor/:projectId", Component: EditorWrapper },
  { path: "/designer-dashboard", element: createElement(LazyRoute, { component: LazyDesignerDashboard }) },
  { path: "/profile", element: createElement(LazyRoute, { component: LazyHomeownerDashboard }) },
  { path: "/explore", element: createElement(LazyRoute, { component: LazyExplorePage }) },
  { path: "/networkxhandshake", element: createElement(LazyRoute, { component: LazyHandshakeLanding }) },
  { path: "/edit-profile", element: createElement(LazyRoute, { component: LazyDesignerProfileEditor }) },
  // { path: "/style-quiz", element: createElement(LazyRoute, { component: LazyStyleQuizLanding }) },
  // { path: "/style-quiz/start", element: createElement(LazyRoute, { component: LazyStyleQuizPage }) },
  // { path: "/mood-board", element: createElement(LazyRoute, { component: LazyMoodBoardLanding }) },
  // { path: "/mood-board/create", element: createElement(LazyRoute, { component: LazyMoodBoardGate }) },
  // { path: "/mood-board/create/:boardId", element: createElement(LazyRoute, { component: LazyMoodBoardPage }) },
  ]},
]);
