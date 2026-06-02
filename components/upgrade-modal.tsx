"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName: string
  onUpgrade?: () => void
}

const features = [
  "Unlimited properties (up to 15)",
  "Lease management & e-signatures",
  "Maintenance request tracking",
  "Tenant communication portal",
  "Rent collection & reminders",
  "Financial reporting & analytics",
]

export function UpgradeModal({
  open,
  onOpenChange,
  featureName,
  onUpgrade,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy font-medium">
            Unlock {featureName}
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Upgrade to access this feature and more.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-cream/50 rounded-lg p-4 mb-4">
            <p className="text-lg font-medium text-navy">$49.99/mo</p>
            <p className="text-sm text-text-muted">+ $15/additional property</p>
          </div>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-text-primary">
                <Check className="h-4 w-4 text-teal flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-navy/20 text-navy hover:bg-navy/5"
          >
            Maybe Later
          </Button>
          <Button
            onClick={onUpgrade}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
