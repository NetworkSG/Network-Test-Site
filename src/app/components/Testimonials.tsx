import imgFrame4 from "figma:asset/607f6408c4c8fd9005fe7498e2284a7b2995acda.png";
import imgFrame6 from "figma:asset/561c829472a0cac14a59bfb33e444dc4e0ed8350.png";
import imgFrame5 from "figma:asset/bc9ffe9973654a94a381c863292fc3780b81397b.png";
import svgPaths from "../../imports/svg-joburr35cn";

const testimonials = [
  { 
    name: "Christine M", 
    image: imgFrame4, 
    opacity: "opacity-74",
    review: "The designers understood exactly what I wanted. Highly recommended for a stress-free renovation journey."
  },
  { 
    name: "Mina M", 
    image: imgFrame6, 
    opacity: "",
    review: "Network matched me with the perfect interior designer. They made the whole process incredibly smooth!"
  },
  { 
    name: "Simon S", 
    image: imgFrame5, 
    opacity: "opacity-74",
    review: "A fantastic experience from start to finish. The team was professional and delivered on time."
  },
];

function Stars() {
  return (
    <svg className="w-[110px] h-[20px] text-[#eab308]" fill="none" viewBox="0 0 147 27">
      <path d={svgPaths.pe2f7080} fill="currentColor" />
      <path d={svgPaths.p38a0b7f0} fill="currentColor" />
      <path d={svgPaths.p3b208ef0} fill="currentColor" />
      <path d={svgPaths.pc3f4f60} fill="currentColor" />
      <path d={svgPaths.pfeeea80} fill="currentColor" />
    </svg>
  );
}

export function Testimonials() {
  return (
    <section className="px-4 md:px-8 py-12 md:py-20">
      <div className="max-w-[1293px] mx-auto text-center">
        <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[48px] text-[#09090b] tracking-[-2.4px] mb-3">
          <span>Real Homeowners, </span>
          <span className="text-[#71717a]">Real Results</span>
        </h2>
        <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-[#71717a] max-w-[465px] mx-auto mb-10 md:mb-16">
          Over 3,200 Singapore homeowners used Network to find their designer match.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="w-full max-w-[360px] h-[350px] md:h-[400px] relative group cursor-pointer isolate"
            >
              {/* Soft ambient glow */}
              <div 
                className="absolute -inset-10 md:-inset-[60px] z-0 opacity-0 md:group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
              >
                <img
                  src={t.image}
                  alt=""
                  className="size-full object-cover blur-[60px] md:blur-[80px] scale-110 saturate-150 brightness-110"
                />
              </div>

              {/* Inner Card */}
              <div className="relative z-10 size-full overflow-hidden rounded-[30px] shadow-[0px_12px_21.3px_0px_rgba(0,0,0,0.32)] bg-black">
                <img
                  alt=""
                  className={`absolute inset-0 size-full object-cover ${t.opacity} transition-transform duration-700 md:group-hover:scale-105`}
                  src={t.image}
                />
                <div className="absolute inset-0 bg-black mix-blend-color transition-opacity duration-500 opacity-0 md:opacity-100 md:group-hover:opacity-0" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500" />

                <div className="absolute left-0 bottom-0 w-full p-6 flex flex-col items-start text-left translate-y-0 md:translate-y-[calc(100%-116px)] md:group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
                  <div className="h-[68px]">
                    <p className="font-['Inter',sans-serif] font-semibold text-[24px] text-white tracking-[-1.2px] mb-2">
                      {t.name}
                    </p>
                    <Stars />
                  </div>
                  <p className="font-['Inter',sans-serif] text-[15px] text-white/95 mt-4 leading-relaxed opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    "{t.review}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}