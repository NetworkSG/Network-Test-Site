import { motion } from "motion/react"
import { Check } from "lucide-react"
import { cn } from "@/app/components/ui/utils"

interface ImageCardProps {
  imageUrl: string
  label: string
  selected: boolean
  onClick: () => void
}

export function ImageCard({ imageUrl, label, selected, onClick }: ImageCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-[12px] overflow-hidden cursor-pointer group aspect-square w-full",
        selected
          ? "ring-2 ring-[#0f0f0d] ring-offset-2 ring-offset-[#f0ede6]"
          : "border border-[#d8d3c8]"
      )}
    >
      <img
        src={imageUrl}
        alt={label}
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <span className="font-['DM_Sans',sans-serif] font-medium text-[12px] text-white uppercase tracking-[0.05em]">
          {label}
        </span>
      </div>
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-[#0f0f0d] rounded-full flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-[#fafaf8]" />
        </div>
      )}
    </motion.button>
  )
}
