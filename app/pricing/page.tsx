"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Building, User, Users, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Feature = {
  label: string
  included: boolean
}

type Tier = {
  name: string
  icon: typeof User
  rentLimit: string
  monthlyPrice: number
  yearlyPrice: number
  typical: string
  popular?: boolean
  features: Feature[]
}

const tiers: Tier[] = [
  {
    name: "Starter",
    icon: User,
    rentLimit: "Up to $5,000/mo",
    monthlyPrice: 49.99,
    yearlyPrice: 499.9,
    typical: "1-2 units",
    features: [
      { label: "Landlord dashboard", included: true },
      { label: "1 property", included: true },
      { label: "Lease creation + tenant invite", included: true },
      { label: "Basic inbox", included: true },
      { label: "Lease summary PDF", included: true },
      { label: "7-day free trial", included: true },
      { label: "Payment history", included: false },
      { label: "Message templates", included: false },
      { label: "Contractor management", included: false },
      { label: "Multiple properties", included: false },
    ],
  },
  {
    name: "Growth",
    icon: Users,
    rentLimit: "Up to $20,000/mo",
    monthlyPrice: 199.99,
    yearlyPrice: 1999.9,
    typical: "5-10 units",
    popular: true,
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Up to 10 units", included: true },
      { label: "Payment history + recording", included: true },
      { label: "Message templates", included: true },
      { label: "Contractor management", included: true },
      { label: "Document uploads", included: true },
      { label: "Multiple properties", included: true },
      { label: "Maintenance management", included: true },
      { label: "Provincial rental forms", included: true },
      { label: "Priority support", included: false },
      { label: "Custom onboarding", included: false },
    ],
  },
  {
    name: "Portfolio",
    icon: Building2,
    rentLimit: "Up to $40,000/mo",
    monthlyPrice: 399.99,
    yearlyPrice: 3999.9,
    typical: "10-20 units",
    features: [
      { label: "Everything in Growth", included: true },
      { label: "Up to 20 units", included: true },
      { label: "Priority email support", included: true },
      { label: "Bulk messaging", included: true },
      { label: "Advanced payment reports", included: true },
      { label: "Data export CSV", included: true },
      { label: "Dedicated support", included: false },
      { label: "Custom onboarding", included: false },
    ],
  },
  {
    name: "Building",
    icon: Building,
    rentLimit: "Up to $100,000/mo",
    monthlyPrice: 799.99,
    yearlyPrice: 7999.9,
    typical: "20-50 units",
    features: [
      { label: "Everything in Portfolio", included: true },
      { label: "Up to 50 units", included: true },
      { label: "Dedicated support", included: true },
      { label: "Custom onboarding", included: true },
      { label: "Phone support", included: true },
      { label: "Early feature access", included: true },
      { label: "Multi-user access", included: true },
      { label: "Bulk tenant import", included: true },
    ],
  },
]

const savingsData = [
  { rent: "$5,000", traditional: "$400/mo", homeSuite: "$49.99/mo", save: "$4,200/yr" },
  { rent: "$20,000", traditional: "$1,600/mo", homeSuite: "$199.99/mo", save: "$16,800/yr" },
  { rent: "$40,000", traditional: "$3,200/mo", homeSuite: "$399.99/mo", save: "$33,600/yr" },
  { rent: "$100,000", traditional: "$8,000/mo", homeSuite: "$799.99/mo", save: "$86,400/yr" },
]

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

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <Button asChild className="bg-teal hover:bg-teal-dark text-white">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-medium text-navy mb-4 text-balance">
              Pick a plan that works for you
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto text-pretty">
              ~1% of your monthly rent. Traditional property managers charge 8%.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={cn(
                "text-sm font-medium px-4 py-2 rounded-md transition-colors",
                billing === "monthly" ? "bg-navy text-white" : "text-navy hover:bg-navy/5",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={cn(
                "text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center gap-2",
                billing === "yearly" ? "bg-navy text-white" : "text-navy hover:bg-navy/5",
              )}
            >
              Yearly
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  billing === "yearly" ? "bg-teal text-white" : "bg-teal/10 text-teal-dark",
                )}
              >
                2 months free
              </span>
            </button>
          </div>

          {/* Tier Cards */}
          <div className="grid gap-6 lg:grid-cols-4 mb-16">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={cn(
                  "relative flex flex-col border-[0.5px] overflow-hidden",
                  tier.popular ? "border-teal shadow-lg" : "border-sage",
                )}
              >
                {tier.popular && (
                  <div className="bg-teal text-white text-xs font-medium text-center py-1.5">
                    Most Popular
                  </div>
                )}
                <CardHeader className="bg-navy text-white text-center pt-6 pb-6">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <tier.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-medium text-white">{tier.name}</h2>
                  <p className="text-sm text-white/70 mt-1">{tier.rentLimit}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 p-6">
                  <div className="text-center mb-1">
                    <span className="text-3xl font-medium text-navy">
                      {formatCurrency(billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice)}
                    </span>
                    <span className="text-text-muted text-sm">
                      /{billing === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                  <p className="text-center text-sm text-text-muted mb-6">Typical: {tier.typical}</p>

                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-teal flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-text-muted/50 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "text-text-primary" : "text-text-muted/70"}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Button asChild className="w-full bg-teal hover:bg-teal-dark text-white">
                      <Link href="/signup">Start Free Trial</Link>
                    </Button>
                    <p className="text-center text-xs text-text-muted mt-2">No credit card required</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enterprise Section */}
          <div className="bg-cream/50 rounded-lg p-8 text-center mb-16">
            <h2 className="text-xl font-medium text-navy mb-4 text-balance">
              Managing 50+ units or $100K+ monthly rent?
            </h2>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-navy text-navy hover:bg-navy/5"
            >
              <a href="mailto:support@homesuitemanager.com">Contact Us for Enterprise Pricing</a>
            </Button>
          </div>

          {/* Savings Comparison Table */}
          <div>
            <h2 className="text-xl font-medium text-navy mb-6 text-center">See how much you save</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-sage">
                    <th className="text-left py-3 px-4 text-sm font-medium text-navy">Monthly Rent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-navy">
                      Traditional PM (8%)
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-navy">HomeSuite</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-teal">You Save/Year</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsData.map((row) => (
                    <tr key={row.rent} className="border-b border-sage/50">
                      <td className="py-3 px-4 text-sm text-text-primary font-medium">{row.rent}</td>
                      <td className="py-3 px-4 text-sm text-text-muted">{row.traditional}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{row.homeSuite}</td>
                      <td className="py-3 px-4 text-sm font-medium text-teal">{row.save}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage/50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-text-muted">
          <p>2026 HomeSuite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
