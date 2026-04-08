import { motion } from "motion/react"
import { Check } from "lucide-react"
import { colorPaletteOptions } from "@/app/utils/quiz-data"
import { cn } from "@/app/components/ui/utils"

interface Props {
  selected: string | null
  onSelect: (id: string) => void
}

export function StepColorPalette({ selected, onSelect }: Props) {
  return (
    <div>
      <h2 className="font-['EB_Garamond',Georgia,serif] font-normal text-[28px] md:text-[36px] text-[#0f0f0d] leading-[1.2] mb-2">
        Which color palette draws you in?
      </h2>
      <p className="font-['DM_Sans',sans-serif] text-[13px] text-[#6b6860] leading-[1.6] mb-8">
        Choose the palette that feels most like home.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[10px]">
        {colorPaletteOptions.map(option => (
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
            <div className="flex gap-1.5 mb-3">
              {option.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border border-[#d8d3c8]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="font-['DM_Sans',sans-serif] font-medium text-[13px] text-[#0f0f0d]">
              {option.label}
            </span>
            {selected === option.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[#0f0f0d] rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-[#fafaf8]" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
