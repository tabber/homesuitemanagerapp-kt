import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-medium text-navy">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-teal hover:bg-teal-dark text-white">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
