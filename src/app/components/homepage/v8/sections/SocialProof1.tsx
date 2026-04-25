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
    <section className="mt-10 md:mt-0" style={{ background: C.black }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
          {stats.map((stat, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="py-6 md:py-10 px-5 md:px-8 group/stat cursor-default"
                style={{ borderRight: "1px solid rgba(255,255,255,0.08)", transition: "background 0.3s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <div className="flex items-end mb-2 md:mb-3" style={{ height: 22 }}>
                  {i === 2 && loaded && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-[3px]"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.35)",
                        borderRadius: 999,
                        fontFamily: sans,
                      }}
                    >
                      <span className="relative flex size-[6px] shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                        <span className="relative inline-flex rounded-full size-[6px] bg-[#22c55e]" />
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#4ade80",
                        }}
                      >
                        Live
                      </span>
                    </span>
                  )}
                </div>
                <div className="text-[32px] md:text-[64px] font-normal leading-[1]" style={{ fontFamily: serif, color: "#ffffff" }}>{stat.value}</div>
                <p className="text-[11px] md:text-[13px] font-normal mt-1.5 md:mt-2" style={{ color: "rgba(255,255,255,0.55)", fontFamily: sans }}>{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
