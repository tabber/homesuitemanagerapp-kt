"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"

export default function LandlordLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .single()

      const fullName = profile?.full_name?.trim() ?? ""
      const [firstName = "", ...rest] = fullName.split(" ")

      if (isMounted) {
        setUser({
          firstName,
          lastName: rest.join(" "),
          email: authUser.email ?? "",
        })
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

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
          user={user}
          trialDaysRemaining={5}
          onUpgrade={() => console.log("Upgrade clicked")}
          onSignOut={handleSignOut}
        />
      </MobileSidebarWrapper>
      <main className="md:ml-64 p-8 pt-14 md:pt-8 w-full">{children}</main>
    </div>
  )
}
