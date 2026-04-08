import { type HTMLAttributes } from "react"
import { cn } from "@/app/components/ui/utils"

export function Container({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("max-w-[1280px] mx-auto px-6 md:px-10", className)} {...props}>
      {children}
    </div>
  )
}
