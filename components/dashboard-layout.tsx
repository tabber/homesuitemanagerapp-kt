"use client"

import { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"

type PortalType = "landlord" | "tenant" | "admin"

interface DashboardLayoutProps {
  children: ReactNode
  portal: PortalType
  user: {
    firstName: string
    lastName: string
    email: string
  }
  trialDaysRemaining?: number
  onUpgrade?: () => void
  onSignOut?: () => void
}

export function DashboardLayout({
  children,
  portal,
  user,
  trialDaysRemaining,
  onUpgrade,
  onSignOut,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        portal={portal}
        user={user}
        trialDaysRemaining={trialDaysRemaining}
        onUpgrade={onUpgrade}
        onSignOut={onSignOut}
      />
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
