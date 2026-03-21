import imgRectangle1 from "figma:asset/4efe71925f3a6fffbde21078b4b09260acf5eec2.png";

export function DesignerProfileFooter() {
  return (
    <footer className="bg-[#f6f6f6] rounded-[15px] mx-3 md:mx-4 mb-3 md:mb-4 mt-3 md:mt-4 px-8 md:px-16 py-10 md:py-14">
      <div className="max-w-[1293px] mx-auto">
        {/* Top: Logo/tagline + Nav columns */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 lg:justify-between">
          {/* Left — Logo & tagline */}
          <div className="flex-1 max-w-[530px]">
            <div
              className="w-[110px] h-[23px] bg-[#2b2b2b] mb-5"
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
            <p className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#71717a] tracking-[-0.5px] leading-[1.5]">
              Singapore's trusted platform for homeowner-designer matching.
            </p>
          </div>

          {/* Right — Navigation & Socials */}
          <div className="flex gap-16 md:gap-20 shrink-0">
            {/* Navigation */}
            <div>
              <p className="font-['Inter',sans-serif] text-[16px] md:text-[17px] text-[#71717a] tracking-[-0.5px] mb-4">
                Navigation
              </p>
              <div className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#09090b] tracking-[-0.5px] space-y-3">
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  Get Matched
                </p>
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  AI Interior Design
                </p>
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  Quote Builder
                </p>
              </div>
            </div>

            {/* Socials */}
            <div>
              <p className="font-['Inter',sans-serif] text-[16px] md:text-[17px] text-[#71717a] tracking-[-0.5px] mb-4">
                Socials
              </p>
              <div className="font-['Inter',sans-serif] text-[15px] md:text-[16px] text-[#09090b] tracking-[-0.5px] space-y-3 underline underline-offset-4 decoration-[#09090b]/30">
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                </p>
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                </p>
                <p className="cursor-pointer hover:text-[#3b3b3b] transition-colors">
                  <a href="https://wa.me/" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#DBDBDB] my-8 md:my-10" />

        {/* Copyright */}
        <p className="font-['Inter',sans-serif] text-[14px] md:text-[16px] text-[#71717a] tracking-[-0.5px]">
          Copyright &copy; 2026. All rights reserved
        </p>
      </div>
    </footer>
  );
}
