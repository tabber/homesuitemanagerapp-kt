"use client"

import { useState, type FormEvent } from "react"
import { Loader2, Mail, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export interface ScreeningPricing {
  creditReport: number
  criminalCheck: number
  evictionHistory: number
  incomeVerification: number
}

export interface ScreeningRequestData {
  name: string
  email: string
  phone: string
  selectedChecks: string[]
}

export interface ScreeningRequestFormProps {
  pricing: ScreeningPricing
  onSubmit: (data: ScreeningRequestData) => Promise<void>
}

type CheckKey = keyof ScreeningPricing

const SCREENING_OPTIONS: { key: CheckKey; label: string; description: string }[] = [
  {
    key: "creditReport",
    label: "Credit report",
    description: "Credit score, tradelines, and payment history",
  },
  {
    key: "criminalCheck",
    label: "Criminal background check",
    description: "National and county-level records search",
  },
  {
    key: "evictionHistory",
    label: "Eviction history",
    description: "Prior eviction filings and judgments",
  },
  {
    key: "incomeVerification",
    label: "Income verification",
    description: "Employment and income confirmation",
  },
]

const formatCAD = (amount: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ScreeningRequestForm({ pricing, onSubmit }: ScreeningRequestFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selected, setSelected] = useState<Set<CheckKey>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const total = SCREENING_OPTIONS.reduce(
    (sum, option) => (selected.has(option.key) ? sum + pricing[option.key] : sum),
    0
  )

  const requiredFilled =
    name.trim().length > 0 && EMAIL_PATTERN.test(email.trim()) && phone.trim().length > 0
  const canSubmit = requiredFilled && selected.size > 0 && !submitting

  const toggleCheck = (key: CheckKey, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(key)
      else next.delete(key)
      return next
    })
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        selectedChecks: SCREENING_OPTIONS.filter((o) => selected.has(o.key)).map((o) => o.key),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Card className="border-sage">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
            <ShieldCheck className="h-6 w-6 text-teal" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium text-navy">Screening request logged</h2>
          <p className="max-w-sm text-sm leading-relaxed text-text-muted text-pretty">
            We&apos;ve logged your screening request for {name} ({email}). We&apos;ll follow up
            to arrange the checks you selected.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-sage">
      <CardHeader>
        <CardTitle className="text-navy">Request applicant screening</CardTitle>
        <p className="text-sm leading-relaxed text-text-muted">
          Choose the checks you need and enter the applicant&apos;s details. We&apos;ll take it
          from there.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium text-navy">Applicant details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="screening-name" className="text-navy">
                  Full name
                </Label>
                <Input
                  id="screening-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  required
                  className="border-sage"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="screening-email" className="text-navy">
                  Email
                </Label>
                <Input
                  id="screening-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className="border-sage"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="screening-phone" className="text-navy">
                  Phone
                </Label>
                <Input
                  id="screening-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(416) 555-0100"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  className="border-sage"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-navy">Screening options</legend>
            <div className="flex flex-col divide-y divide-sage rounded-lg border border-sage">
              {SCREENING_OPTIONS.map((option) => {
                const id = `screening-${option.key}`
                const checked = selected.has(option.key)
                return (
                  <label
                    key={option.key}
                    htmlFor={id}
                    className="flex cursor-pointer items-start justify-between gap-4 p-4 transition-colors hover:bg-sage/10"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(value) => toggleCheck(option.key, value === true)}
                        className="mt-0.5 border-sage data-[state=checked]:bg-teal data-[state=checked]:border-teal"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-navy">{option.label}</span>
                        <span className="text-xs leading-relaxed text-text-muted">
                          {option.description}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-navy">
                      {formatCAD(pricing[option.key])}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="flex items-center justify-between rounded-lg bg-sage/20 px-4 py-3">
            <span className="text-sm font-medium text-navy">
              Total screening cost
              {selected.size > 0 && (
                <span className="ml-2 text-xs font-normal text-text-muted">
                  ({selected.size} {selected.size === 1 ? "check" : "checks"})
                </span>
              )}
            </span>
            <span
              className="text-2xl font-semibold tabular-nums text-navy"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatCAD(total)}
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-sage bg-background p-4">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-text-muted text-pretty">
              This logs a screening request. We&apos;ll follow up to arrange the checks — the
              applicant&apos;s consent is required before any screening is run.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-teal text-white hover:bg-teal-dark sm:w-auto sm:self-end"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Sending request...
              </>
            ) : (
              "Send screening request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ScreeningRequestForm
