import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-sage/30 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-navy" />
      </div>
      <h3 className="text-lg font-medium text-navy mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-teal hover:bg-teal-dark text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
