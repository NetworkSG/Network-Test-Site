import { motion } from "motion/react"
import { cn } from "@/app/components/ui/utils"

interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("w-full h-[2px] bg-[#d8d3c8] overflow-hidden", className)}>
      <motion.div
        className="h-full bg-[#0f0f0d]"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
