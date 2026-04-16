import { cn } from "@/lib/utils"
import type { HypothesisStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: HypothesisStatus
  className?: string
}

type StatusInfo = {
  label: string
  colorClass: string
}

const statusDisplayInfo: Record<HypothesisStatus, StatusInfo> = {
  backlog: {
    label: "Идея",
    colorClass: "bg-[#F3F4F6] text-[#6B7280]",
  },
  scoring: {
    label: "Скоринг",
    colorClass: "bg-[#E0E7FF] text-[#4338CA]",
  },
  deep_dive: {
    label: "Deep Dive",
    colorClass: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
  experiment: {
    label: "Эксперимент",
    colorClass: "bg-[#FEF3C7] text-[#B45309]",
  },
  go_no_go: {
    label: "Питч",
    colorClass: "bg-[#EDE9FE] text-[#6D28D9]",
  },
  done: {
    label: "Done",
    colorClass: "bg-[#DCFCE7] text-[#15803D]",
  },
  archived: {
    label: "Архив",
    colorClass: "bg-[#F3F4F6] text-[#6B7280]",
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const info = statusDisplayInfo[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.colorClass,
        className,
      )}
    >
      {info.label}
    </span>
  )
}
