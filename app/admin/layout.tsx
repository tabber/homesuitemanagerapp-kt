"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppFooter } from "@/components/app-footer"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"
import { UserProvider, useUser } from "@/lib/context/UserContext"

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { firstName, lastName, email } = useUser()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Hard-navigate to the landing page so all client state/cache is cleared
    // and the user gets a clear signed-out indication.
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileSidebarWrapper>
        <AppSidebar
          portal="admin"
          user={{ firstName, lastName, email }}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 min-w-0">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-14 pb-8 sm:px-6 md:px-8 md:pt-8">
          {children}
        </div>
        <AppFooter />
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </UserProvider>
  )
}
