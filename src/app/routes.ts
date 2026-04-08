import { createBrowserRouter, Outlet, useLocation } from "react-router";
import { lazy, Suspense, createElement, useEffect, useRef, useState } from "react";
import { useVisitorHeartbeat } from "./hooks/useVisitorHeartbeat";
import { HomePage } from "./components/HomePage";
import { HomepageV8 } from "./components/homepage/v8/HomepageV8";
import { GetMatchedForm } from "./components/GetMatchedForm";
import { RenderToolForm } from "./components/RenderToolForm";
import { DesignerProfile } from "./components/DesignerProfile";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminGuard } from "./components/AdminGuard";
import { CostGuide } from "./components/CostGuide";
import { DesignersDirectory } from "./components/DesignersDirectory";
import { FloorPlan3DLanding } from "./components/FloorPlan3DLanding";
import { FloorPlan3DDashboard } from "./components/FloorPlan3DDashboard";
import { ProjectPage } from "./components/ProjectPage";
import { DesignerDashboard } from "./components/DesignerDashboard";
import { HomeownerDashboard } from "./components/HomeownerDashboard";
import { ExplorePage } from "./components/ExplorePage";
import { HandshakeLanding } from "./components/HandshakeLanding";
import { StyleQuizLanding } from "./components/style-quiz/StyleQuizLanding";
import { StyleQuizPage } from "./components/style-quiz/StyleQuizPage";
import { MoodBoardLanding } from "./components/mood-board/MoodBoardLanding";
import { MoodBoardGate } from "./components/mood-board/MoodBoardGate";
import { MoodBoardPage } from "./components/mood-board/MoodBoardPage";

const LazyFloorPlan3DEditor = lazy(() =>
  import("./components/FloorPlan3DEditor").then((m) => ({ default: m.FloorPlan3DEditor }))
);

const editorFallback = createElement("div", { className: "h-screen w-screen flex items-center justify-center bg-[#C5CDD5] font-['Inter',sans-serif]" },
  createElement("div", { className: "text-center" },
    createElement("div", { className: "w-10 h-10 border-4 border-[#09090B] border-t-transparent rounded-full animate-spin mx-auto mb-4" }),
    createElement("p", { className: "text-[#09090B] text-sm font-medium" }, "Loading 3D Editor...")
  )
);

function EditorWrapper() {
  return createElement(
    Suspense,
    { fallback: editorFallback },
    createElement(LazyFloorPlan3DEditor)
  );
}

function TemplateEditorWrapper() {
  return createElement(
    AdminGuard,
    null,
    createElement(
      Suspense,
      { fallback: editorFallback },
      createElement(LazyFloorPlan3DEditor, { mode: "template" })
    )
  );
}

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
    {
      key: location.pathname,
      style: {
        animation: "pageFadeIn 0.3s ease-out forwards",
      },
    },
    createElement(Outlet)
  );
}

export const router = createBrowserRouter([
  { Component: RootLayout, children: [
  { path: "/", Component: HomepageV8 },
  { path: "/old-homepage", Component: HomePage },
  { path: "/get-matched", Component: GetMatchedForm },
  { path: "/render-tool", Component: RenderToolForm },
  { path: "/cost-guide", Component: CostGuide },
  { path: "/designers", Component: DesignersDirectory },
  { path: "/designer/:slug", Component: DesignerProfile },
  { path: "/designer/:slug/project/:projectId", Component: ProjectPage },
  { path: "/admin", Component: AdminDashboard },
  { path: "/admin/template-editor", Component: TemplateEditorWrapper },
  { path: "/admin/template-editor/:templateId", Component: TemplateEditorWrapper },
  { path: "/floorplan3d", Component: FloorPlan3DLanding },
  { path: "/floorplan3d/dashboard", Component: FloorPlan3DDashboard },
  { path: "/floorplan3d/editor", Component: EditorWrapper },
  { path: "/floorplan3d/editor/:projectId", Component: EditorWrapper },
  { path: "/designer-dashboard", Component: DesignerDashboard },
  { path: "/profile", Component: HomeownerDashboard },
  { path: "/explore", Component: ExplorePage },
  { path: "/networkxhandshake", Component: HandshakeLanding },
  { path: "/style-quiz", Component: StyleQuizLanding },
  { path: "/style-quiz/start", Component: StyleQuizPage },
  { path: "/mood-board", Component: MoodBoardLanding },
  { path: "/mood-board/create", Component: MoodBoardGate },
  { path: "/mood-board/create/:boardId", Component: MoodBoardPage },
  ]},
]);