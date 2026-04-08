import { type ButtonHTMLAttributes } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/app/components/ui/utils"

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg"
  hideArrow?: boolean
}

const sizeMap = {
  sm: "px-5 py-2.5 text-[12px]",
  md: "px-7 py-3 text-[13px]",
  lg: "px-8 py-3.5 text-[14px]",
}

export function PillButton({ size = "md", hideArrow, className, children, ...props }: PillButtonProps) {
  return (
    <button
      className={cn(
        "bg-[#0f0f0d] text-[#fafaf8] rounded-[100px] flex items-center gap-2 font-['DM_Sans',sans-serif] font-medium tracking-normal transition-all duration-150 hover:opacity-80 active:scale-[0.98] cursor-pointer",
        sizeMap[size],
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {!hideArrow && <ArrowRight className="w-3.5 h-3.5" />}
    </button>
  )
}
