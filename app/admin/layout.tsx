"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"

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
      <MobileSidebarWrapper>
        <AppSidebar
          portal="admin"
          user={user}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 p-8 pt-14 md:pt-8 w-full">
        {children}
      </main>
    </div>
  )
}
