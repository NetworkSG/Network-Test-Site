import { type HTMLAttributes } from "react"
import { cn } from "@/app/components/ui/utils"

export function SectionLabel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center font-['DM_Sans',sans-serif] font-semibold text-[11px] text-[#9a9790] uppercase tracking-[0.12em]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
