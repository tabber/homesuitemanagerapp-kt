"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Building2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-medium text-navy">HomeSuite</span>
    </Link>
  )
}

const features = [
  "Unlimited leases and tenant invitations",
  "Rent and payment tracking",
  "Maintenance requests with contractor management",
  "Tenant messaging and inbox",
  "Utility bill tracking",
  "Document storage",
  "Includes 1 property — $15/mo per additional (up to 15)",
]

const savings = [
  { rent: "$2,000", traditional: "$160/mo", homeSuite: "$79.99/mo", save: "$960/yr" },
  { rent: "$3,000", traditional: "$240/mo", homeSuite: "$79.99/mo", save: "$1,920/yr" },
  { rent: "$5,000", traditional: "$400/mo", homeSuite: "$79.99/mo", save: "$3,840/yr" },
]

function ExpiredBanner() {
  const params = useSearchParams()
  if (params.get("expired") !== "1") return null
  return (
    <div className="max-w-3xl mx-auto mb-8 p-4 rounded-lg bg-warning/10 border border-warning/30 text-center">
      <p className="text-sm text-navy">
        Your trial has ended. Subscribe below to keep managing your properties —
        your data is right where you left it.
      </p>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-normal text-navy hover:text-navy/80 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl lg:text-4xl font-medium text-navy mb-3">
              Simple pricing for self-managing landlords
            </h1>
            <p className="text-text-muted max-w-xl mx-auto">
              One plan with everything included. Start with a 7-day free trial.
            </p>
          </div>

          <Suspense fallback={null}>
            <ExpiredBanner />
          </Suspense>

          <div className="max-w-md mx-auto mt-10">
            <Card className="border-teal/40 border-2 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white text-xs font-medium px-3 py-1 rounded-full">
                Early Adopter Pricing
              </div>
              <CardContent className="p-8">
                <h2 className="text-lg font-medium text-navy mb-1">Essential</h2>
                <div className="mb-1">
                  <span className="text-4xl font-medium text-navy">$79.99</span>
                  <span className="text-text-muted"> CAD/mo</span>
                </div>
                <p className="text-sm text-text-muted mb-6">
                  Early adopters keep this rate for life.
                </p>
                <ul className="space-y-3 mb-8">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-navy">
                      <Check className="h-4 w-4 text-teal mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="w-full bg-teal hover:bg-teal-dark text-white">
                  <a href="/api/stripe/checkout">Start 7-Day Free Trial</a>
                </Button>
                <p className="text-center text-xs text-text-muted mt-3">
                  Card required. You won&apos;t be charged until your trial ends —
                  cancel anytime before then.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-3xl mx-auto mt-20">
            <h2 className="text-xl font-medium text-navy text-center mb-6">
              Compare with a traditional property manager (8%)
            </h2>
            <Card className="border-sage/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm font-medium text-text-muted border-b border-sage/40 pb-3 mb-3">
                  <span>Monthly rent</span>
                  <span>Property manager</span>
                  <span>HomeSuite</span>
                  <span>You save</span>
                </div>
                {savings.map((row) => (
                  <div
                    key={row.rent}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-navy py-2"
                  >
                    <span>{row.rent}</span>
                    <span>{row.traditional}</span>
                    <span>{row.homeSuite}</span>
                    <span className="text-teal font-medium">{row.save}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-text-muted mt-16">
            Questions?{" "}
            <a className="text-teal hover:underline" href="mailto:team@homesuitemanager.com">
              team@homesuitemanager.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
