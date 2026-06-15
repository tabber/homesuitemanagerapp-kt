"use client"

import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UserProvider, useUser } from "@/lib/context/UserContext"

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { firstName, lastName, email } = useUser()

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
          user={{ firstName, lastName, email }}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 p-8 pt-14 md:pt-8 w-full">
        {children}
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
