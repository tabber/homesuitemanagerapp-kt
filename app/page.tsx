"use client"

import { useState } from "react"
import Link from "next/link"
import { Building2, Home, MessageSquare, DollarSign, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

function SavingsCalculator() {
  const [rent, setRent] = useState<number>(2000)
  const [properties, setProperties] = useState<number>(1)

  const traditionalCost = rent * properties * 0.08
  const homeSuiteCost = 49.99 + Math.max(0, properties - 1) * 15
  const yearlySavings = (traditionalCost - homeSuiteCost) * 12

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Card className="border-[0.5px] border-sage">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-navy" />
          <h3 className="text-lg font-medium text-navy">Savings Calculator</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div>
            <Label htmlFor="rent" className="text-text-primary">Average Rent Amount</Label>
            <Input
              id="rent"
              type="number"
              value={rent}
              onChange={(e) => setRent(Number(e.target.value))}
              className="mt-1 border-sage focus:ring-teal"
            />
          </div>
          <div>
            <Label htmlFor="properties" className="text-text-primary">Number of Properties</Label>
            <Input
              id="properties"
              type="number"
              min={1}
              max={15}
              value={properties}
              onChange={(e) => setProperties(Number(e.target.value))}
              className="mt-1 border-sage focus:ring-teal"
            />
          </div>
        </div>
        <div className="bg-cream/50 rounded-lg p-4 text-center">
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-text-muted">Traditional PM costs</p>
              <p className="text-lg font-medium text-navy">{formatCurrency(traditionalCost)}/mo</p>
            </div>
            <div>
              <p className="text-text-muted">HomeSuite costs</p>
              <p className="text-lg font-medium text-teal">{formatCurrency(homeSuiteCost)}/mo</p>
            </div>
            <div>
              <p className="text-text-muted">You save</p>
              <p className="text-lg font-medium text-success">{formatCurrency(yearlySavings)}/year</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const features = [
  {
    icon: Home,
    title: "Manage from anywhere",
    description: "Maintenance tracking, contractor management, and real-time status updates all in one place.",
  },
  {
    icon: MessageSquare,
    title: "Professional communication",
    description: "Templates, logged conversations, and a dedicated tenant portal for seamless communication.",
  },
  {
    icon: DollarSign,
    title: "Simple finances",
    description: "Rent tracking, overdue alerts, payment history, and financial reporting at your fingertips.",
  },
]

export default function LandingPage() {
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

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-medium text-navy mb-4 text-balance">
            Stop paying 8% to a property manager
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
            HomeSuite gives you everything they do for as little as $49.99/mo
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button asChild size="lg" className="bg-teal hover:bg-teal-dark text-white px-8">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-navy/20 text-navy hover:bg-navy/5"
            >
              <Link href="/pricing">See How It Works</Link>
            </Button>
          </div>

          {/* Savings Calculator */}
          <div className="max-w-2xl mx-auto mb-16">
            <SavingsCalculator />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-cream/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-[0.5px] border-sage">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-navy" />
                  </div>
                  <h3 className="text-lg font-medium text-navy mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-medium text-navy mb-4">
            Ready to take control of your properties?
          </h2>
          <p className="text-text-muted mb-8">
            No credit card required. Start your 7-day free trial today.
          </p>
          <Button asChild size="lg" className="bg-teal hover:bg-teal-dark text-white px-8">
            <Link href="/signup">Get Started Free</Link>
          </Button>
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
