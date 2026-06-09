"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"

// Mock user data - in production this would come from auth
const mockUser = {
  firstName: "Sarah",
  lastName: "Mitchell",
  email: "sarah@example.com",
}

export default function LandlordLayout({ children }: { children: ReactNode }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileSidebarWrapper>
        <AppSidebar
          portal="landlord"
          user={mockUser}
          trialDaysRemaining={5}
          onUpgrade={() => console.log("Upgrade clicked")}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 p-8 pt-14 md:pt-8 w-full">{children}</main>
    </div>
  )
}
