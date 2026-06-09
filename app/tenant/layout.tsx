"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  // Mock user data - in real app this would come from auth context
  const user = {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@email.com",
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
          portal="tenant"
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
