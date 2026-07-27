import { cn } from "@/lib/utils"

type StatusType = "pending" | "active" | "expired" | "terminated" | "vacant" | "occupied" | "maintenance" | "completed" | "in-progress" | "open" | "failed" | "overdue" | "upcoming" | "cancelled"
interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  pending: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  expired: "bg-muted text-text-muted",
  terminated: "bg-destructive/10 text-destructive",
  overdue: "bg-destructive/10 text-destructive",
  upcoming: "bg-muted text-text-muted",
  cancelled: "bg-muted text-text-muted",
  vacant: "bg-muted text-text-muted",
  occupied: "bg-success/10 text-success",
  maintenance: "bg-orange-100 text-orange-600",
  completed: "bg-success/10 text-success",
  "in-progress": "bg-teal/10 text-teal-dark",
  open: "bg-warning/10 text-warning",
  failed: "bg-destructive/10 text-destructive",
}

const statusLabels: Record<StatusType, string> = {
  pending: "Pending",
  active: "Active",
  expired: "Expired",
  terminated: "Terminated",
  vacant: "Vacant",
  occupied: "Occupied",
  maintenance: "Under Maintenance",
  completed: "Completed",
  "in-progress": "In Progress",
  open: "Open",
  failed: "Failed",
  overdue: "Overdue",
  upcoming: "Upcoming",
  cancelled: "Cancelled",
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
