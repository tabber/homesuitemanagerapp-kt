"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Mock admin user data
  const user = {
    firstName: "Admin",
    lastName: "User",
    email: "admin@homesuite.ca",
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
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
