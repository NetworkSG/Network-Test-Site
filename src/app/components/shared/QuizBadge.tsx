import { type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/components/ui/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[100px] px-3 py-1 text-[11px] font-semibold font-['DM_Sans',sans-serif] uppercase tracking-[0.12em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#0f0f0d] text-[#fafaf8]",
        secondary: "bg-[#e8e4db] text-[#0f0f0d]",
        outline: "border border-[#d8d3c8] text-[#0f0f0d]",
        accent: "bg-[#e8e4db] border border-[#d8d3c8] text-[#6b6860]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface QuizBadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function QuizBadge({ className, variant, ...props }: QuizBadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
