import { cn } from "@/lib/utils"

type PriorityType = "urgent" | "high" | "medium" | "low"

interface PriorityBadgeProps {
  priority: PriorityType
  className?: string
}

const priorityStyles: Record<PriorityType, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-orange-100 text-orange-600",
  medium: "bg-warning/10 text-warning",
  low: "bg-success/10 text-success",
}

const priorityLabels: Record<PriorityType, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        priorityStyles[priority],
        className
      )}
    >
      {priorityLabels[priority]}
    </span>
  )
}
