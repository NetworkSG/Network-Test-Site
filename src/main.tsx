
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { initClarity } from "./app/clarity";
  import "./styles/index.css";

  // Microsoft Clarity (no-op when VITE_CLARITY_ID isn't set — dev stays clean)
  initClarity();

  createRoot(document.getElementById("root")!).render(<App />);
