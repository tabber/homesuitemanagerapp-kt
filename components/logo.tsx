import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  portalName?: string
}

export function Logo({ className, showText = true, portalName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-medium text-white leading-tight">HomeSuite</span>
          {portalName && (
            <span className="text-xs text-white/60">{portalName}</span>
          )}
        </div>
      )}
    </div>
  )
}
