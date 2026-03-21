import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";
import imgRectangle649 from "figma:asset/603dd1c7e73003efe44064e373cbd75a12e05f73.png";
import svgPaths from "../../imports/svg-joburr35cn";

export function FooterSection({ showCTA = true }: { showCTA?: boolean } = {}) {
  return (
    <section className="px-2 md:px-4 py-12 md:py-20 relative">
      <div className="mx-auto">
        <div className="bg-white rounded-[20px] md:rounded-[30px] shadow-[0px_17px_16.1px_7px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="bg-[#f6f6f6] rounded-[15px] mx-3 md:mx-4 mt-3 md:mt-4 mb-3 md:mb-4 p-8 md:p-16">
            <div className="max-w-[1293px] mx-auto">
            {/* CTA Section */}
            {showCTA && (
            <div className="text-center mb-10 md:mb-20">
              <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[60px] text-[#09090b] tracking-[-2px] md:tracking-[-3px] leading-[1.1] mb-1 md:mb-3">
                Your Renovator Match
              </h2>
              <p className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[60px] text-[#71717a] tracking-[-2px] md:tracking-[-3px] leading-[1.1] mb-5 md:mb-8">
                Starts Here
              </p>
              <p className="font-['Inter',sans-serif] text-[15px] md:text-[18px] text-[#71717a] tracking-[-0.9px] max-w-[485px] mx-auto mb-8">
                Ready to renovate with confidence? Get matched with verified designers who fit your style and budget — completely free.
              </p>

              <div className="bg-[#f6f6f6] border border-white rounded-[100px] inline-block p-[7px]">
                <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-2 px-6 md:px-8 py-3 md:py-4">
                  <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                    Get Matched Now
                  </span>
                  <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                    <path d={svgPaths.p3eae7e00} fill="white" />
                  </svg>
                </div>
              </div>
            </div>
            )}

            {/* Footer Content — on mobile: nav first, then logo+newsletter */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Left Side (desktop) — hidden on mobile, shown on lg */}
              <div className="hidden lg:block flex-1">
                {/* Logo */}
                <div
                  className="w-[110px] h-[23px] bg-[#2b2b2b] mb-4"
                  style={{
                    maskImage: `url('${imgRectangle1}')`,
                    maskSize: "111.804px 22.908px",
                    maskRepeat: "no-repeat",
                    maskPosition: "0px 0px",
                    WebkitMaskImage: `url('${imgRectangle1}')`,
                    WebkitMaskSize: "111.804px 22.908px",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "0px 0px",
                  }}
                />
                <p className="font-['Inter',sans-serif] text-[16px] text-[#71717a] tracking-[-0.8px] max-w-[529px]">
                  {`Singapore's trusted platform for homeowner-designer matching.`}
                </p>

                {/* Newsletter (desktop) */}
                <div className="bg-white rounded-[15px] shadow-[0px_9px_37.2px_10px_rgba(0,0,0,0.03)] p-6 max-w-[477px] w-full mt-6">
                  <p className="font-['Inter',sans-serif] font-medium text-[18px] text-[#09090b] tracking-[-0.9px] mb-4 max-w-[341px]">
                    Practical advice for Singapore homeowners, delivered monthly. No spam.
                  </p>
                  <div className="flex gap-3 items-center">
                    <div className="bg-[#f6f6f6] rounded-[64px] h-[40px] flex-1 flex items-center px-4">
                      <span className="font-['Inter',sans-serif] text-[15px] text-[#cacaca] tracking-[-0.75px]">
                        name@email.com
                      </span>
                    </div>
                    <div className="bg-[#f6f6f6] border border-white rounded-[100px] p-[6px] shrink-0">
                      <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center gap-1 px-4 py-2">
                        <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                          Subscribe
                        </span>
                        <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                          <path d={svgPaths.p3eae7e00} fill="white" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation — on mobile shows first */}
              <div className="flex gap-12 md:gap-16">
                <div>
                  <p className="font-['Inter',sans-serif] text-[16px] lg:text-[18px] text-[#71717a] tracking-[-0.9px] mb-3">
                    Navigation
                  </p>
                  <div className="font-['Inter',sans-serif] text-[16px] lg:text-[18px] text-[#09090b] tracking-[-0.9px] space-y-2 leading-[2.3]">
                    <p className="cursor-pointer">Get Matched</p>
                    <p className="cursor-pointer">AI Interior Design</p>
                    <p className="cursor-pointer">Quote Builder</p>
                  </div>
                </div>
                <div>
                  <p className="font-['Inter',sans-serif] text-[16px] lg:text-[18px] text-[#71717a] tracking-[-0.9px] mb-3">
                    Socials
                  </p>
                  <div className="font-['Inter',sans-serif] text-[16px] lg:text-[18px] text-[#09090b] tracking-[-0.9px] space-y-2 leading-[2.3] underline underline-offset-4">
                    <p className="cursor-pointer">Instagram</p>
                    <p className="cursor-pointer">Facebook</p>
                    <p className="cursor-pointer">WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Logo + tagline + newsletter (below nav) */}
            <div className="lg:hidden mt-8">
              {/* Divider */}
              <div className="h-px bg-[#DBDBDB] mb-8" />

              {/* Logo centered */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-[110px] h-[23px] bg-[#2b2b2b] mb-3"
                  style={{
                    maskImage: `url('${imgRectangle1}')`,
                    maskSize: "111.804px 22.908px",
                    maskRepeat: "no-repeat",
                    maskPosition: "0px 0px",
                    WebkitMaskImage: `url('${imgRectangle1}')`,
                    WebkitMaskSize: "111.804px 22.908px",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "0px 0px",
                  }}
                />
                <p className="font-['Inter',sans-serif] text-[14px] text-[#71717a] tracking-[-0.5px] max-w-[280px]">
                  {`Singapore's trusted platform for homeowner-designer matching.`}
                </p>
              </div>

              {/* Newsletter card */}
              <div className="bg-white rounded-[15px] shadow-[0px_9px_37.2px_10px_rgba(0,0,0,0.03)] p-6 w-full">
                <p className="font-['Inter',sans-serif] font-medium text-[16px] text-[#09090b] tracking-[-0.9px] mb-4 text-center">
                  Practical advice for Singapore homeowners, delivered monthly. No spam.
                </p>
                <div className="flex gap-3 items-center mb-4">
                  <div className="bg-[#f6f6f6] rounded-[64px] h-[44px] flex-1 flex items-center px-4">
                    <span className="font-['Inter',sans-serif] text-[15px] text-[#cacaca] tracking-[-0.75px]">
                      name@email.com
                    </span>
                  </div>
                  {/* Envelope icon */}
                  <div className="shrink-0">
                    
                  </div>
                </div>
                <div className="bg-[#f6f6f6] border border-white rounded-[100px] p-[6px]">
                  <div className="bg-[#09090b] rounded-[100px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 px-6 py-3 w-full">
                    <span className="font-['Inter',sans-serif] font-medium text-[16px] text-white tracking-[-0.8px]">
                      Subscribe
                    </span>
                    <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                      <path d={svgPaths.p3eae7e00} fill="white" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider (desktop) */}
            <div className="hidden lg:block h-px bg-[#DBDBDB] my-8 md:my-12 max-w-[1066px] mx-auto" />

            {/* Copyright */}
            <p className="font-['Inter',sans-serif] text-[14px] md:text-[18px] text-[#71717a] tracking-[-0.9px] text-center lg:text-left mt-8 lg:mt-0">
              Copyright © 2026. All rights reserved
            </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[92px] -z-10">
        <img alt="" className="size-full object-cover" src={imgRectangle649} />
      </div>
    </section>
  );
}