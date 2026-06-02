"use client"

import { AppSidebar } from "@/components/app-sidebar"

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Mock user data - in real app this would come from auth context
  const user = {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@email.com",
  }

  const handleSignOut = () => {
    // Handle sign out
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar
        portal="tenant"
        user={user}
        onSignOut={handleSignOut}
      />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
