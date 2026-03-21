import imgBlackBg from "figma:asset/fdc45713fc34a56de06e71f92c8ba6ef7b7416fe.png";
import imgRectangle5 from "figma:asset/7848d7acee2ab7c89c4387aab94c72c30c7791fd.png";
import img11 from "figma:asset/6b5e1e0c50f2dc148bdfb952b24dbb7b5416efa7.png";
import img41 from "figma:asset/0283f6d46d918a635c30b1c801b3000f5d816151.png";
import img21 from "figma:asset/a5bae96c233961ef7aa795235fdd108380b34fad.png";
import img31 from "figma:asset/11d04729f5a73bc39fa232bf123f370b1676bb25.png";
import imgVerify1 from "figma:asset/05f7ba663bdcb2789d42d323a29f301952a2d26d.png";
import imgVerify2 from "figma:asset/b9054248306afa0ee274438840584176a9acf4fc.png";
import imgVerify3 from "figma:asset/1edc9a98b8f486abbece6557185ec5108b3c8fc1.png";
import svgPaths from "../../imports/svg-joburr35cn";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export function DarkShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

  const handleToggle = () => {
    if (isMobile()) {
      setShowLightbox(true);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      video.muted = true;
      setIsPlaying(false);
    } else {
      video.muted = false;
      video.play();
      setIsPlaying(true);
    }
  };

  const closeLightbox = () => {
    const lv = lightboxVideoRef.current;
    if (lv) {
      lv.pause();
      lv.currentTime = 0;
    }
    setShowLightbox(false);
  };

  return (
    <>
    <section className="px-2 md:px-4 pb-12 md:pb-20">
      <div className="mx-auto">
        <div className="bg-black rounded-[20px] md:rounded-[30px] overflow-hidden relative">
          {/* Background */}
          <div className="absolute inset-0 opacity-40 overflow-hidden">
            <img alt="" className="absolute inset-0 size-full object-cover" src={imgBlackBg} />
          </div>

          {/* Content */}
          <div className="relative px-6 md:px-16 pt-10 md:pt-16 pb-10 md:pb-16">
            {/* Background video - loops silently, no user control */}
            <video
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              src="https://video.wixstatic.com/video/1b4359_86efc27ee6dd41b880dc1a758ce661ff/1080p/mp4/file.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-black/50 z-0" />

            {/* Partner logos */}
            <div className="relative z-10 grid grid-cols-4 items-center justify-items-center gap-4 md:flex md:flex-wrap md:justify-center md:gap-16 mb-12 md:mb-20">
              <img alt="Partner 1" className="h-[32px] md:h-[96px] w-auto object-contain" src={img11} />
              <img alt="Partner 2" className="h-[32px] md:h-[98px] w-auto object-contain" src={img41} />
              <img alt="Partner 3" className="h-[26px] md:h-[78px] w-auto object-contain" src={img21} />
              <img alt="Partner 4" className="h-[26px] md:h-[75px] w-auto object-contain" src={img31} />
            </div>

            {/* Video placeholder */}
            <div className="relative z-10 mx-auto max-w-[1170px]">
              <div className="absolute inset-0 blur-[107px] rounded-[25px] -z-10">
                <img alt="" className="size-full object-cover rounded-[25px]" src={imgRectangle5} />
              </div>
              <div className="bg-black rounded-[18px] md:rounded-[25px] aspect-[3/4] md:aspect-[16/9] w-full relative overflow-hidden">
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={handleToggle}>
                  <video
                    ref={videoRef}
                    src="https://video.wixstatic.com/video/1b4359_9a5b21cd4fbe4bb6bc73c37a5a556451/1080p/mp4/file.mp4"
                    className={`w-full h-full transition-all duration-700 ease-out ${isPlaying ? 'scale-100 object-contain' : 'scale-125 object-cover'}`}
                    width={2560}
                    height={1440}
                    loop
                    muted
                    playsInline
                    poster="https://noddhgtqaktrjtmwmxct.supabase.co/storage/v1/object/public/Videos/Screenshot%202026-01-03%20at%2012.40.34%20PM.png"
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="size-[60px] md:size-[109px] bg-white/90 rounded-full flex items-center justify-center shadow-[0px_8px_33.4px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                        <svg className="size-[24px] md:size-[40px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 5.5V18.5L19 12L8.5 5.5Z" fill="#09090B" stroke="#09090B" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="relative z-10 flex flex-row items-start justify-center gap-6 md:gap-24 mt-8 md:mt-12">
              <StatItem icon={imgVerify1} iconSize="size-[36px]" label="120+ verified firms" />
              <StatItem icon={imgVerify2} iconSize="size-[28px]" label="4.8★ rating" />
              <StatItem icon={imgVerify3} iconSize="size-[28px]" label="Zero homeowner fees" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Mobile Video Lightbox */}
    <AnimatePresence>
      {showLightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-black rounded-[20px] overflow-hidden shadow-[0px_25px_60px_rgba(0,0,0,0.5)]"
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-[0px_4px_12px_rgba(0,0,0,0.15)]"
            >
              <X className="w-5 h-5 text-[#09090b]" />
            </button>

            <video
              ref={lightboxVideoRef}
              src="https://video.wixstatic.com/video/1b4359_9a5b21cd4fbe4bb6bc73c37a5a556451/1080p/mp4/file.mp4"
              className="w-full aspect-[3/4] object-cover"
              autoPlay
              loop
              playsInline
              poster="https://noddhgtqaktrjtmwmxct.supabase.co/storage/v1/object/public/Videos/Screenshot%202026-01-03%20at%2012.40.34%20PM.png"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

function StatItem({ icon, iconSize, label }: { icon: string; label: string; iconSize: string }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-5 flex-1 md:flex-none">
      <div className="bg-[#f6f6f6] rounded-[7px] w-[45px] h-[44px] md:w-[51px] md:h-[50px] relative border-2 border-white shadow-[0px_17px_33.4px_0px_rgba(0,0,0,0.34)] flex items-center justify-center shrink-0">
        <img alt="" className={`${iconSize} object-cover`} src={icon} />
      </div>
      <span className="font-['Inter',sans-serif] font-medium text-[14px] md:text-[28px] text-white tracking-[-0.5px] md:tracking-[-1.4px] text-center md:text-left leading-tight">
        {label}
      </span>
    </div>
  );
}
