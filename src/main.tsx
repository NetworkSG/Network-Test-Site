
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initPostHog } from "./app/posthog";
  import { captureAttribution } from "./app/utils/attribution";
  import "./styles/index.css";

  // PostHog — session replay, heatmaps, product analytics (env-gated, with a
  // baked-in default project key so it works out of the box).
  initPostHog();

  // First-touch ad attribution from the landing URL (?utm_*, ad_id, fbclid…).
  captureAttribution();

  createRoot(document.getElementById("root")!).render(<App />);
