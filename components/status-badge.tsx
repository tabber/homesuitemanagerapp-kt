import { cn } from "@/lib/utils"

type StatusType = "pending" | "active" | "expired" | "terminated" | "vacant" | "occupied"

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  pending: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  expired: "bg-muted text-text-muted",
  terminated: "bg-destructive/10 text-destructive",
  vacant: "bg-muted text-text-muted",
  occupied: "bg-success/10 text-success",
}

const statusLabels: Record<StatusType, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
  vacant: "Vacant",
  occupied: "Occupied",
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
