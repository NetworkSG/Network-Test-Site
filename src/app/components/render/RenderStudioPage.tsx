import { useNavigate } from "react-router";
import { SiteNav } from "../SiteNav";
import { RenderStudio } from "./RenderStudio";
import imgNetworkLogo from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

/**
 * Standalone page wrapper for the RenderStudio.
 * Accessed via /render-tool/studio after the user fills in the lead form.
 */
export function RenderStudioPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f0ede6] min-h-screen font-['DM_Sans',sans-serif]" style={{ color: "#0f0f0d" }}>
      <SiteNav logoImg={imgNetworkLogo} onLogoClick={() => navigate("/")} />
      <RenderStudio />
    </div>
  );
}
