"use client"

import { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"

// Mock user data - in production this would come from auth
const mockUser = {
  firstName: "Sarah",
  lastName: "Mitchell",
  email: "sarah@example.com",
}

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        portal="landlord"
        user={mockUser}
        trialDaysRemaining={5}
        onUpgrade={() => console.log("Upgrade clicked")}
        onSignOut={() => console.log("Sign out clicked")}
      />
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
