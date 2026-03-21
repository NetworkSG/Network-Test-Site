import imgBlackBg2 from "figma:asset/49953f64fb35dad28a82cb49b63d9604f1776f49.png";
import imgRectangle5 from "figma:asset/7848d7acee2ab7c89c4387aab94c72c30c7791fd.png";
import imgFrame1707481758 from "figma:asset/27b310e4305b08f160b8b8abf6c9c0d25592a45f.png";
import imgFrame1707481757 from "figma:asset/9731d409632a5c9e39cf458248d3db521c462105.png";
import imgFrame1707481759 from "figma:asset/9c369a6b0181cbcb566cc2e383900dad06c37703.png";
import svgPaths from "../../imports/svg-joburr35cn";

const blogPosts = [
  {
    image: imgRectangle5,
    title: "Is Your $30K Renovation Budget Realistic? Here's What to Expect",
    tag: "Cost Guide",
    brief: "Breaking down real renovation costs in Singapore so you can plan with confidence — from HDB to condo.",
    tall: false,
  },
  {
    image: imgFrame1707481758,
    title: "5 Red Flags When Meeting Interior Designers (That Instagram Won't Show You)",
    tag: "Tips & Advice",
    brief: "Learn the warning signs that separate trustworthy designers from the ones who overpromise and underdeliver.",
    tall: true,
  },
  {
    image: imgFrame1707481757,
    title: "How to Read a Renovation Quote: The Complete Singapore Homeowner's Guide",
    tag: "Planning",
    brief: "Understand every line item in your quote so you never get blindsided by hidden costs again.",
    tall: true,
  },
  {
    image: imgFrame1707481759,
    title: "The 7 Most Common Layout Mistakes in Singapore Homes",
    tag: "Design",
    brief: "Avoid the spatial blunders that make small homes feel even smaller — plus easy fixes you can apply today.",
    tall: false,
  },
];

export function BlogSection() {
  return (
    <section className="px-1 py-12 md:py-20">
      <div className="bg-black border border-[#d3d3d3] rounded-[20px] md:rounded-[30px] shadow-[0px_17px_22.8px_0px_rgba(0,0,0,0.35)] overflow-hidden relative">
        {/* Background */}
        <div className="absolute inset-0 opacity-10 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 size-full object-cover pointer-events-none"
            src="https://video.wixstatic.com/video/1b4359_5e45cfcda2b94518949ae20fb602886c/1080p/mp4/file.mp4"
          />
        </div>

        <div className="relative p-8 md:p-10 lg:p-16 max-w-[1293px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 md:mb-12">
            <div>
              <div className="bg-transparent border border-[#3f3f3f] rounded-[100px] shadow-[0px_7px_12.3px_0px_rgba(0,0,0,0.16)] inline-flex items-center justify-center px-5 py-2 mb-4 md:mb-6">
                <span className="font-['Inter',sans-serif] font-bold text-[16px] text-white tracking-[-0.8px]">
                  Blog
                </span>
              </div>
              <h2 className="font-['Inter',sans-serif] font-semibold text-[36px] md:text-[48px] text-white tracking-[-2.4px] mb-3 max-w-[885px]">
                <span>Learn </span>
                <span className="text-[#b3b3b3]">Before You Commit</span>
              </h2>
              <p className="font-['Inter',sans-serif] text-[16px] md:text-[18px] text-white max-w-[607px]">
                Expert guides to help you plan smarter, avoid mistakes, and understand what good renovation really takes.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-[#8b8b8b] rounded-[100px] inline-block p-[7px] md:p-[8px] border border-[#e4e4e4]">
                <div className="bg-white rounded-[100px] flex items-center gap-2 px-6 py-3">
                  <span className="font-['Inter',sans-serif] font-medium text-[16px] text-[#09090b] tracking-[-0.8px]">
                    All Articles
                  </span>
                  <svg className="size-[18px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                    <path d={svgPaths.p3eae7e00} fill="black" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-4 md:gap-6">
              <BlogCard
                image={blogPosts[0].image}
                title={blogPosts[0].title}
                tag={blogPosts[0].tag}
                brief={blogPosts[0].brief}
                className="min-h-[340px] md:h-[309px]"
              />
              <BlogCard
                image={blogPosts[1].image}
                title={blogPosts[1].title}
                tag={blogPosts[1].tag}
                brief={blogPosts[1].brief}
                className="min-h-[360px] md:h-[402px]"
              />
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-4 md:gap-6">
              <BlogCard
                image={blogPosts[2].image}
                title={blogPosts[2].title}
                tag={blogPosts[2].tag}
                brief={blogPosts[2].brief}
                className="min-h-[360px] md:h-[404px]"
              />
              <BlogCard
                image={blogPosts[3].image}
                title={blogPosts[3].title}
                tag={blogPosts[3].tag}
                brief={blogPosts[3].brief}
                className="min-h-[340px] md:h-[309px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogCard({ image, title, tag, brief, className }: { image: string; title: string; tag: string; brief: string; className: string }) {
  return (
    <div className={`rounded-[15px] relative group cursor-pointer isolate ${className}`}>
      {/* Soft ambient glow */}
      <div className="absolute -inset-4 md:-inset-6 z-0 opacity-0 md:group-hover:opacity-35 transition-opacity duration-700 pointer-events-none hidden md:block">
        <img
          src={image}
          alt=""
          className="size-full object-cover blur-[40px] md:blur-[50px] scale-110 saturate-150 brightness-110"
        />
      </div>

      {/* Inner card */}
      <div className="relative z-10 size-full overflow-hidden rounded-[15px] bg-black">
        <img
          alt=""
          className="absolute inset-0 size-full object-cover opacity-68 rounded-[15px] transition-transform duration-700 group-hover:scale-105"
          src={image}
        />
        {/* Grayscale overlay — fades out on hover */}
        <div className="absolute inset-0 bg-black mix-blend-color rounded-[15px] transition-opacity duration-500 opacity-0 md:opacity-100 md:group-hover:opacity-0" />
        {/* Gradient overlay — strengthens on hover */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.85)] md:to-[rgba(0,0,0,0.67)] rounded-[15px] transition-all duration-500 md:group-hover:from-transparent md:group-hover:to-[rgba(0,0,0,0.85)]" />

        {/* Slide-up content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          {/* Glassmorphic tag pill */}
          <div className="mb-3 opacity-100 md:opacity-0 translate-y-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500 delay-75">
            <span className="inline-block bg-[rgba(255,255,255,0.18)] border border-white/25 rounded-[100px] px-3 py-1 font-['Inter',sans-serif] font-medium text-[12px] text-white/90 tracking-[-0.3px] shadow-[inset_0_0_12px_rgba(255,255,255,0.06)]">
              {tag}
            </span>
          </div>

          {/* Title — always visible */}
          <p className="font-['Inter',sans-serif] font-semibold text-[20px] md:text-[24px] text-white tracking-[-1.2px] max-w-[480px]">
            {title}
          </p>

          {/* Brief + Read More — revealed on hover (always visible on mobile) */}
          <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
            <div className="overflow-hidden">
              <div className="mt-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 delay-100">
                <p className="font-['Inter',sans-serif] text-[13px] md:text-[14px] text-white/80 max-w-[420px] mb-4 leading-relaxed">
                  {brief}
                </p>
                <div className="bg-[#8b8b8b] rounded-[100px] inline-block p-[6px] border border-[#e4e4e4]">
                  <div className="bg-white rounded-[100px] inline-flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors duration-300">
                    <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[#09090b] tracking-[-0.3px]">
                      Read More
                    </span>
                    <svg className="size-[14px] shrink-0" fill="none" viewBox="0 0 18 8.72">
                      <path d={svgPaths.p3eae7e00} fill="black" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}