"use client"

import { AppSidebar } from "@/components/app-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Mock admin user data
  const user = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@homesuite.ca",
  }

  const handleSignOut = () => {
    // Handle sign out
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar
        portal="admin"
        user={user}
        onSignOut={handleSignOut}
      />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
