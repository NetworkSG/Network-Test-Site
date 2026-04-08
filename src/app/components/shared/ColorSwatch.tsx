import { cn } from "@/app/components/ui/utils"

interface ColorSwatchProps {
  color: string
  size?: number
  showLabel?: boolean
  className?: string
}

export function ColorSwatch({ color, size = 32, showLabel = false, className }: ColorSwatchProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className="rounded-full border border-[#d8d3c8] flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: color }}
      />
      {showLabel && (
        <span className="font-['DM_Sans',sans-serif] text-[10px] text-[#9a9790] uppercase tracking-[0.05em]">
          {color}
        </span>
      )}
    </div>
  )
}
