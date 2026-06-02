"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TrialBannerProps {
  daysRemaining: number
  onUpgrade?: () => void
  className?: string
}

export function TrialBanner({ daysRemaining, onUpgrade, className }: TrialBannerProps) {
  if (daysRemaining > 4) return null

  return (
    <div
      className={cn(
        "bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 flex items-center justify-between",
        className
      )}
    >
      <p className="text-sm font-medium text-warning">
        Your trial ends in {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
      </p>
      <Button
        onClick={onUpgrade}
        size="sm"
        className="bg-teal hover:bg-teal-dark text-white"
      >
        Upgrade Now
      </Button>
    </div>
  )
}
