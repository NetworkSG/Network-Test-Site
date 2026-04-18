import { C, serif, sans, FadeIn } from "../primitives";
import { TRUST_STATS } from "../../content";
import { useHomeownerCount, useHomeownerCountLoaded } from "../useHomeownerCount";

export function TrustStatsBar() {
  const liveCount = useHomeownerCount();
  const loaded = useHomeownerCountLoaded();

  // Build stats with live override for index 2
  const stats = TRUST_STATS.map((stat, i) =>
    i === 2 ? { value: liveCount, label: stat.label } : stat
  );

  return (
    <section className="mt-10 md:mt-0" style={{ background: C.creamDark }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: `1px solid ${C.creamBorder}` }}>
          {stats.map((stat, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="py-6 md:py-10 px-5 md:px-8 group/stat cursor-default"
                style={{ borderRight: `1px solid ${C.creamBorder}`, transition: "background 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <div className="flex items-start gap-2">
                  <div className="text-[32px] md:text-[64px] font-normal leading-[1] group-hover/stat:scale-110 origin-left" style={{ fontFamily: serif, color: C.black, transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>{stat.value}</div>
                  {i === 2 && loaded && (
                    <span className="relative flex size-[6px] mt-3 md:mt-5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                      <span className="relative inline-flex rounded-full size-[6px] bg-[#22c55e]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] md:text-[13px] font-normal mt-1.5 md:mt-2 group-hover/stat:translate-x-1" style={{ color: C.grayLight, fontFamily: sans, transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
