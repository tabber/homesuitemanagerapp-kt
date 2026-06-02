"use client"

import { Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LockedFeatureProps {
  title: string
  description: string
  price?: string
  className?: string
  onUnlock?: () => void
}

export function LockedFeature({
  title,
  description,
  price = "$49.99/mo",
  className,
  onUnlock,
}: LockedFeatureProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg p-6 border-[0.5px] border-sage flex flex-col items-center text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-sage/30 flex items-center justify-center mb-4">
        <Lock className="h-6 w-6 text-navy" />
      </div>
      <h3 className="text-lg font-medium text-navy mb-2">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{description}</p>
      <div className="flex items-center gap-1.5 text-sm text-navy mb-4">
        <Sparkles className="h-4 w-4 text-navy" />
        <span>Essential Feature</span>
      </div>
      <Button onClick={onUnlock} className="bg-teal hover:bg-teal-dark text-white">
        Unlock — {price}
      </Button>
    </div>
  )
}
