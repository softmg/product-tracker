# Avoid Duplicating Status-To-UI Maps Across Components

If a status/color/label mapping is reused in multiple components, extract it instead of redefining the same object again.

## BAD

```tsx
const statusDisplayInfo = {
  backlog: { label: "Идея", colorClass: "bg-[#F3F4F6] text-[#6B7280]" },
  scoring: { label: "Скоринг", colorClass: "bg-[#E0E7FF] text-[#4338CA]" },
}

const otherStatusDisplayInfo = {
  backlog: { label: "Идея", colorClass: "bg-[#F3F4F6] text-[#6B7280]" },
  scoring: { label: "Скоринг", colorClass: "bg-[#E0E7FF] text-[#4338CA]" },
}
```

## GOOD

```tsx
const statusDisplayInfo: Record<HypothesisStatus, StatusInfo> = {
  backlog: { label: "Идея", colorClass: "bg-[#F3F4F6] text-[#6B7280]" },
  scoring: { label: "Скоринг", colorClass: "bg-[#E0E7FF] text-[#4338CA]" },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const info = statusDisplayInfo[status]
  return <span className={info.colorClass}>{info.label}</span>
}
```

**Why:** The same status map already appears in multiple hypothesis components. Duplication makes label/color drift likely when statuses change.
