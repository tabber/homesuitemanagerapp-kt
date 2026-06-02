import { cn } from "@/lib/utils"

interface ComingSoonBadgeProps {
  className?: string
}

export function ComingSoonBadge({ className }: ComingSoonBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage/50 text-navy",
        className
      )}
    >
      Coming Soon
    </span>
  )
}
