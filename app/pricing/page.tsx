import Link from "next/link"
import { Building2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const pricingExamples = [
  {
    properties: 1,
    price: 49.99,
  },
  {
    properties: 3,
    price: 79.99,
  },
  {
    properties: 10,
    price: 184.99,
  },
]

const features = [
  "Unlimited properties (up to 15)",
  "Lease management & templates",
  "Maintenance request tracking",
  "Tenant communication portal",
  "Rent collection & reminders",
  "E-transfer payment tracking",
  "Financial reporting & analytics",
  "Document storage",
]

const comparisonData = [
  { feature: "Monthly cost (3 properties, $2,000 avg rent)", traditional: "$480/mo", homeSuite: "$79.99/mo" },
  { feature: "Setup fees", traditional: "Often $500+", homeSuite: "$0" },
  { feature: "Lease renewal fees", traditional: "50-100% of one month", homeSuite: "Included" },
  { feature: "Maintenance markup", traditional: "10-20%", homeSuite: "None" },
  { feature: "Direct tenant communication", traditional: "Through PM", homeSuite: "Direct + logged" },
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

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-medium text-navy mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              $49.99 + $15 per additional property. No hidden fees. No percentage of rent.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {pricingExamples.map((example) => (
              <Card key={example.properties} className="border-[0.5px] border-sage">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg font-medium text-navy">
                    {example.properties} {example.properties === 1 ? "Property" : "Properties"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-medium text-navy mb-1">
                    {formatCurrency(example.price)}
                  </div>
                  <p className="text-sm text-text-muted">per month</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formula */}
          <div className="bg-cream/50 rounded-lg p-6 text-center mb-12">
            <p className="text-text-primary font-medium mb-2">
              Formula: $49.99 + $15 per additional property
            </p>
            <p className="text-sm text-text-muted">
              Maximum: 15 properties = $259.99/mo
            </p>
            <p className="text-sm text-text-muted mt-2">
              Managing more than 15 properties?{" "}
              <Link href="/contact" className="text-teal hover:underline">
                Contact us
              </Link>
            </p>
          </div>

          {/* Features List */}
          <Card className="border-[0.5px] border-sage mb-12">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-navy">Everything included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-text-primary">
                    <Check className="h-4 w-4 text-teal flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <div className="mb-12">
            <h2 className="text-xl font-medium text-navy mb-6 text-center">
              HomeSuite vs Traditional Property Managers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-sage">
                    <th className="text-left py-3 px-4 text-sm font-medium text-navy">Feature</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-navy">Traditional PM</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-teal">HomeSuite</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="border-b border-sage/50">
                      <td className="py-3 px-4 text-sm text-text-primary">{row.feature}</td>
                      <td className="py-3 px-4 text-sm text-text-muted">{row.traditional}</td>
                      <td className="py-3 px-4 text-sm text-text-primary font-medium">{row.homeSuite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-text-muted mb-4">No credit card required</p>
            <Button asChild size="lg" className="bg-teal hover:bg-teal-dark text-white px-8">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
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
