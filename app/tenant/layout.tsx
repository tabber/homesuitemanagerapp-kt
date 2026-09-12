"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppFooter } from "@/components/app-footer"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"
import { UserProvider, useUser } from "@/lib/context/UserContext"

function TenantLayoutInner({ children }: { children: ReactNode }) {
  const { firstName, lastName, email } = useUser()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Keep an unread-message count for the Inbox badge. Refetch on navigation
  // (so it clears after the tenant reads messages) and on a gentle interval.
  useEffect(() => {
    let active = true
    const fetchUnread = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false)
      if (active) setUnreadCount(count ?? 0)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [pathname])

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
          portal="tenant"
          user={{ firstName, lastName, email }}
          onSignOut={handleSignOut}
          badges={{ "/tenant/inbox": unreadCount }}
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

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <TenantLayoutInner>{children}</TenantLayoutInner>
    </UserProvider>
  )
}
