"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export interface PaymentMethodSettingsValues {
  etransferEnabled: boolean
  etransferEmail: string
  stripeEnabled: boolean
}

export interface PaymentMethodSettingsProps {
  leaseId: string
  etransferEnabled: boolean
  etransferEmail: string
  stripeEnabled: boolean
  automaticCollectionAvailable: boolean
  onSave: (settings: PaymentMethodSettingsValues) => Promise<void>
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SoonBadge() {
  return (
    <span className="rounded-full bg-sage/30 px-2 py-0.5 text-xs font-medium tracking-wide text-text-muted">
      SOON
    </span>
  )
}

export function PaymentMethodSettings({
  leaseId,
  etransferEnabled: initialEtransferEnabled,
  etransferEmail: initialEtransferEmail,
  stripeEnabled: initialStripeEnabled,
  automaticCollectionAvailable,
  onSave,
}: PaymentMethodSettingsProps) {
  const [etransferEnabled, setEtransferEnabled] = useState(initialEtransferEnabled)
  const [etransferEmail, setEtransferEmail] = useState(initialEtransferEmail)
  const [stripeEnabled, setStripeEnabled] = useState(
    automaticCollectionAvailable ? initialStripeEnabled : false
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailInvalid = etransferEnabled && !EMAIL_PATTERN.test(etransferEmail.trim())
  const nothingEnabled = !etransferEnabled && !stripeEnabled

  const isDirty =
    etransferEnabled !== initialEtransferEnabled ||
    etransferEmail !== initialEtransferEmail ||
    stripeEnabled !== initialStripeEnabled

  const handleSave = async () => {
    if (saving) return
    setError(null)

    if (emailInvalid) {
      setError("Enter a valid e-Transfer email address.")
      return
    }
    if (nothingEnabled) {
      setError("Turn on at least one payment method so your tenant can pay.")
      return
    }

    setSaving(true)
    try {
      await onSave({
        etransferEnabled,
        etransferEmail: etransferEmail.trim(),
        stripeEnabled,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save payment settings.")
    } finally {
      setSaving(false)
    }
  }

  const etransferEmailId = `etransfer-email-${leaseId}`
  const etransferSwitchId = `etransfer-switch-${leaseId}`
  const stripeSwitchId = `stripe-switch-${leaseId}`
  const padSwitchId = `pad-switch-${leaseId}`

  return (
    <Card className="rounded-xl border-sage bg-sage/10 shadow-none">
      <CardContent className="flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
          <h3 className="text-navy font-medium text-lg text-balance">
            How your tenants can pay rent
          </h3>
          <p className="text-sm text-text-muted leading-relaxed text-pretty">
            Turn on every method you&apos;re willing to accept. Your tenant picks one each time they pay.
          </p>
        </header>

        <ul className="flex flex-col divide-y divide-sage/60" aria-label="Accepted payment methods">
          <li className="flex flex-col gap-3 py-4 first:pt-0">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor={etransferSwitchId} className="text-navy font-medium cursor-pointer">
                e-Transfer
              </Label>
              <Switch
                id={etransferSwitchId}
                checked={etransferEnabled}
                onCheckedChange={setEtransferEnabled}
                disabled={saving}
                aria-label="Accept e-Transfer"
              />
            </div>
            {etransferEnabled && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={etransferEmailId} className="text-sm text-text-muted">
                  Send e-Transfers to
                </Label>
                <Input
                  id={etransferEmailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={etransferEmail}
                  onChange={(e) => setEtransferEmail(e.target.value)}
                  disabled={saving}
                  aria-invalid={emailInvalid || undefined}
                  className="border-sage bg-background"
                />
              </div>
            )}
          </li>

          <li className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={stripeSwitchId}
                className={
                  automaticCollectionAvailable
                    ? "text-navy font-medium cursor-pointer"
                    : "text-navy font-medium"
                }
              >
                Card / bank transfer (Stripe)
              </Label>
              {!automaticCollectionAvailable && <SoonBadge />}
            </div>
            <Switch
              id={stripeSwitchId}
              checked={stripeEnabled}
              onCheckedChange={setStripeEnabled}
              disabled={!automaticCollectionAvailable || saving}
              aria-label="Accept card or bank transfer via Stripe"
            />
          </li>

          <li className="flex items-center justify-between gap-4 py-4 last:pb-0">
            <div className="flex items-center gap-2">
              <Label htmlFor={padSwitchId} className="text-navy font-medium">
                Pre-authorized debit
              </Label>
              <SoonBadge />
            </div>
            <Switch
              id={padSwitchId}
              checked={false}
              disabled
              aria-label="Accept pre-authorized debit (coming soon)"
            />
          </li>
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive min-h-5" role="alert" aria-live="polite">
            {error ?? ""}
          </p>
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="bg-teal hover:bg-teal-dark text-white sm:self-end"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PaymentMethodSettings
