"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  trend?: {
    direction: "up" | "down"
    value: string
  }
  className?: string
}

export function StatCard({ label, value, sublabel, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "w-full min-w-0 bg-card rounded-lg p-6 border-[0.5px] border-sage",
        className
      )}
    >
      <p className="text-sm text-text-muted font-normal">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-3xl font-medium text-navy">{value}</p>
        {trend && (
          <span
            className={cn(
              "flex items-center text-sm font-normal",
              trend.direction === "up" ? "text-success" : "text-destructive"
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 mr-0.5" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-0.5" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      {sublabel && (
        <p className="text-sm text-text-muted font-normal mt-1">{sublabel}</p>
      )}
    </div>
  )
}
