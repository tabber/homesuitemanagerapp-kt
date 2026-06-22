"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"
import { UserProvider, useUser } from "@/lib/context/UserContext"

function LandlordLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { firstName, lastName, email } = useUser()

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
          user={{ firstName, lastName, email }}
          trialDaysRemaining={5}
          onUpgrade={() => console.log("Upgrade clicked")}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 w-full min-w-0">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-14 pb-8 sm:px-6 md:px-8 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LandlordLayoutInner>{children}</LandlordLayoutInner>
    </UserProvider>
  )
}
