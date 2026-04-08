import { motion } from "motion/react"
import { Check } from "lucide-react"
import { roomLayoutOptions } from "@/app/utils/quiz-data"
import { cn } from "@/app/components/ui/utils"

interface Props {
  selected: string | null
  onSelect: (id: string) => void
}

export function StepRoomLayout({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-2">
        How do you like your spaces arranged?
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        Choose your preferred room layout philosophy.
      </p>
      <div className="flex flex-col gap-[10px] max-w-[520px]">
        {roomLayoutOptions.map(option => (
          <motion.button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "relative rounded-[12px] p-5 text-left cursor-pointer transition-all duration-150",
              selected === option.id
                ? "ring-2 ring-[#0f0f0d] ring-offset-2 ring-offset-[#f0ede6] bg-[#fafaf8]"
                : "bg-[#fafaf8] border border-[#d8d3c8] hover:border-[#0f0f0d]/30"
            )}
          >
            <span className="font-['DM_Sans',sans-serif] font-semibold text-[14px] text-[#0f0f0d] block mb-1">
              {option.label}
            </span>
            <span className="font-['DM_Sans',sans-serif] text-[12px] text-[#6b6860] leading-[1.5]">
              {option.description}
            </span>
            {selected === option.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#0f0f0d] rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-[#fafaf8]" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
