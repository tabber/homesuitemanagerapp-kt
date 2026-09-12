"use client"

import { ReactNode, useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppFooter } from "@/components/app-footer"
import { MobileSidebarWrapper } from "@/components/mobile-sidebar-wrapper"
import { createClient } from "@/lib/supabase/client"
import { UserProvider, useUser } from "@/lib/context/UserContext"

function LandlordLayoutInner({ children }: { children: ReactNode }) {
  const { id, firstName, lastName, email } = useUser()
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | undefined>(
    undefined
  )

  useEffect(() => {
    let isMounted = true

    async function loadSubscription() {
      if (!id) return
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_end_date")
        .eq("id", id)
        .maybeSingle()

      if (!isMounted || !data) return

      const status = data.subscription_status ?? "trial"
      if (status === "trial" || status === "trialing") {
        const end = data.trial_end_date ? new Date(data.trial_end_date) : null
        if (end) {
          const days = Math.max(
            0,
            Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          )
          setTrialDaysRemaining(days)
        }
      } else {
        // active / canceled / anything else: hide the trial widget
        setTrialDaysRemaining(undefined)
      }
    }

    loadSubscription()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Hard-navigate to the landing page so all client state/cache is cleared
    // and the user gets a clear signed-out indication.
    window.location.href = "/"
  }

  const handleUpgrade = () => {
    // Stripe Checkout: for comped/manual trials this starts a paid
    // subscription; for Stripe trials it converts to paid immediately
    // (the webhook ends the trial and cancels the old subscription).
    window.location.href = "/api/stripe/checkout"
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileSidebarWrapper>
        <AppSidebar
          portal="landlord"
          user={{ firstName, lastName, email }}
          trialDaysRemaining={trialDaysRemaining}
          onUpgrade={handleUpgrade}
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

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <LandlordLayoutInner>{children}</LandlordLayoutInner>
    </UserProvider>
  )
}
