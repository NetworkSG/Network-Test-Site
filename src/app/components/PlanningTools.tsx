import imgInterior21 from "figma:asset/a0e26801a6c502b0bd9cf2b86eff1d7552d2695a.png";
import imgRectangle648 from "figma:asset/f07ac02def74d08b83946b312fd388bd8374c28c.png";
import svgPaths from "../../imports/svg-joburr35cn";
import { Link } from "react-router";

function ArrowIcon() {
  return (
    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
      <path d={svgPaths.p3eae7e00} fill="black" />
    </svg>
  );
}

export function PlanningTools() {
  return (
    <section className="px-4 md:px-8 py-12 md:py-20">
      <div className="max-w-[1293px] mx-auto text-center mb-10 md:mb-16">
        <div className="inline-flex items-center bg-[#f0f0f0] border border-[#3f3f3f] rounded-[100px] shadow-[0px_7px_12.3px_0px_rgba(0,0,0,0.16)] px-5 py-2 mb-6">
          <span className="font-['Inter',sans-serif] font-bold text-[16px] text-[#09090b] tracking-[-0.8px]">
            Free tools
          </span>
        </div>

        <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[48px] text-[#09090b] tracking-[-2.4px] mb-3">
          <span>Start Planning </span>
          <span className="text-[#71717a]">Before You Commit</span>
        </h2>
        <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] max-w-[607px] mx-auto">
          Not ready to meet designers yet? Use our free tools to understand your budget and visualize your space first — at your own pace.
        </p>
      </div>

      <div className="max-w-[1293px] mx-auto flex flex-col md:flex-row gap-6 md:gap-8">
        {/* AI 3D Render Tool */}
        <div className="flex-1 relative group cursor-pointer isolate md:min-h-[666px]">
          {/* Soft ambient glow */}
          <div className="absolute -inset-10 md:-inset-[60px] z-0 opacity-0 md:group-hover:opacity-40 transition-opacity duration-700 pointer-events-none hidden md:block">
            <img
              src={imgRectangle648}
              alt=""
              className="size-full object-cover blur-[60px] md:blur-[80px] scale-110 saturate-150 brightness-110"
            />
          </div>

          <div className="relative z-10 size-full bg-[#09090b] rounded-[20px] md:rounded-[30px] shadow-[0px_20px_37.4px_7px_rgba(0,0,0,0.07)] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="" className="size-full object-cover opacity-65 transition-transform duration-700 md:group-hover:scale-105" src={imgRectangle648} />
              <div className="absolute inset-0 bg-black mix-blend-color opacity-0 md:opacity-100 transition-opacity duration-500 md:group-hover:opacity-0" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6 pb-0 md:p-12 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-['Inter',sans-serif] font-semibold text-[24px] md:text-[28px] text-white tracking-[-1.4px] max-w-[344px] mb-4">
                  AI 3D Render Tool
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-white/90 leading-relaxed mb-5 max-w-[380px]">
                  Upload a photo of your space and see it transformed with AI in minutes. Test different styles before committing to any designer.
                </p>
                <div className="flex flex-col gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Realistic 3D visualizations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Multiple style options</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Results in 5 minutes</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pb-4 md:pb-0 md:mt-0 md:absolute md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row items-center md:justify-between gap-3">
                <Link to="/render-tool" className="bg-[#8b8b8b] rounded-[100px] p-[7px] md:p-[8px] border border-[#e4e4e4] w-full md:w-auto md:inline-block">
                  <div className="bg-white rounded-[100px] flex items-center justify-center md:justify-between px-6 py-3 md:py-4 w-full md:w-[226px] gap-3">
                    <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#09090b] tracking-[-0.8px]">
                      Create My Render
                    </span>
                    <ArrowIcon />
                  </div>
                </Link>
                <p className="font-['Inter',sans-serif] text-[13px] md:text-[15px] text-[#bfbfbf]">
                  5 minutes • Free signup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Renovation Cost Guide */}
        <div className="flex-1 relative group cursor-pointer isolate md:min-h-[666px]">
          {/* Soft ambient glow */}
          <div className="absolute -inset-10 md:-inset-[60px] z-0 opacity-0 md:group-hover:opacity-40 transition-opacity duration-700 pointer-events-none hidden md:block">
            <img
              src={imgInterior21}
              alt=""
              className="size-full object-cover blur-[60px] md:blur-[80px] scale-110 saturate-150 brightness-110"
            />
          </div>

          <div className="relative z-10 size-full bg-[#09090b] rounded-[20px] md:rounded-[30px] shadow-[0px_20px_37.4px_7px_rgba(0,0,0,0.07)] overflow-hidden">
            <div className="absolute inset-0">
              <img alt="" className="size-full object-cover scale-125 object-[center_75%] opacity-65 transition-transform duration-700 md:group-hover:scale-[1.35]" src={imgInterior21} />
              <div className="absolute inset-0 bg-black mix-blend-color opacity-0 md:opacity-100 transition-opacity duration-500 md:group-hover:opacity-0" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-6 pb-0 md:p-12 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-['Inter',sans-serif] font-semibold text-[24px] md:text-[28px] text-white tracking-[-1.4px] max-w-[344px] mb-4">
                  Renovation Cost Guide
                </h3>
                <p className="font-['Inter',sans-serif] text-[14px] md:text-[15px] text-white/90 leading-relaxed mb-5 max-w-[380px]">
                  Get an instant breakdown of what your budget can realistically achieve based on your home type, scope, and finishes.
                </p>
                <div className="flex flex-col gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Itemized cost estimates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Budget by room breakdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#d4a843]">✓</span>
                    <span className="font-['Inter',sans-serif] font-semibold text-[14px] md:text-[15px] text-white">Compare quality tiers</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pb-4 md:pb-0 md:mt-0 md:absolute md:bottom-12 md:left-12 md:right-12 flex flex-col md:flex-row items-center md:justify-between gap-3">
                <Link to="/cost-guide" className="bg-[#8b8b8b] rounded-[100px] p-[7px] md:p-[8px] border border-[#e4e4e4] w-full md:w-auto md:inline-block">
                  <div className="bg-white rounded-[100px] flex items-center justify-center md:justify-between px-6 py-3 md:py-4 w-full md:w-[226px] gap-3">
                    <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#09090b] tracking-[-0.8px]">
                      Calculate My Budget
                    </span>
                    <ArrowIcon />
                  </div>
                </Link>
                <p className="font-['Inter',sans-serif] text-[13px] md:text-[15px] text-[#bfbfbf]">
                  2 minutes • Free signup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}