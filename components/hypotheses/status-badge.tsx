import { cn } from "@/lib/utils"
import type { HypothesisStatus } from "@/lib/types"
import { statusDisplayInfo } from "@/lib/mock-data"

interface StatusBadgeProps {
  status: HypothesisStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const info = statusDisplayInfo[status]
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.colorClass,
        className
      )}
    >
      {info.label}
    </span>
  )
}
