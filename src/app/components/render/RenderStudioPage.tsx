import { HomepageNav } from "../shared/HomepageNav";
import { RenderStudio } from "./RenderStudio";

/**
 * Standalone page wrapper for the RenderStudio.
 * Accessed via /render-tool/studio after the user fills in the lead form.
 */
export function RenderStudioPage() {
  return (
    <div className="bg-[#f0ede6] min-h-screen flex flex-col font-['DM_Sans',sans-serif]" style={{ color: "#0f0f0d" }}>
      <HomepageNav />
      <RenderStudio />
    </div>
  );
}
