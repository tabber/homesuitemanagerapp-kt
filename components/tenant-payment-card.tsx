"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Copy, Loader2, Mail, CreditCard, X, Zap } from "lucide-react"

export type TenantPaymentMethod = "etransfer" | "card"
export type TenantPaymentStatus = "due" | "sent" | "overdue" | "confirmed"

export interface TenantPaymentCardProps {
  monthlyRent: number
  dueDate: string
  paymentStatus: TenantPaymentStatus
  availableMethods: TenantPaymentMethod[]
  etransferEmail?: string
  isOnAutopay: boolean
  onMarkAsSent?: () => Promise<void>
  onPayNow?: () => Promise<void>
  onEnableAutopay?: () => void
  onDisableAutopay?: () => Promise<void>
}

const METHOD_LABELS: Record<TenantPaymentMethod, string> = {
  etransfer: "e-Transfer",
  card: "Card / bank transfer",
}

const STATUS_CONFIG: Record<
  TenantPaymentStatus,
  { label: string; className: string }
> = {
  confirmed: { label: "Paid", className: "bg-success/15 text-success" },
  sent: { label: "Sent", className: "bg-success/15 text-success" },
  due: { label: "Due soon", className: "bg-warning/15 text-warning" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
}

function formatCad(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function TenantPaymentCard({
  monthlyRent,
  dueDate,
  paymentStatus,
  availableMethods,
  etransferEmail,
  isOnAutopay,
  onMarkAsSent,
  onPayNow,
  onEnableAutopay,
  onDisableAutopay,
}: TenantPaymentCardProps) {
  const stripeEnabled = availableMethods.includes("card")

  const [selectedMethod, setSelectedMethod] = useState<TenantPaymentMethod | null>(
    availableMethods[0] ?? null
  )
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [markingSent, setMarkingSent] = useState(false)
  const [localSent, setLocalSent] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [disablingAutopay, setDisablingAutopay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = STATUS_CONFIG[paymentStatus]
  const isSettled = paymentStatus === "confirmed" || paymentStatus === "sent"
  const showSentState = localSent || paymentStatus === "sent"
  const showPaidState = paid || paymentStatus === "confirmed"

  const handleCopyInstructions = async () => {
    if (!etransferEmail) return
    const text = [
      `Rent payment: ${formatCad(monthlyRent)}`,
      `Due: ${dueDate}`,
      `Send e-Transfer to: ${etransferEmail}`,
    ].join("\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy to clipboard.")
    }
  }

  const handleMarkAsSent = async () => {
    if (!onMarkAsSent || markingSent) return
    setError(null)
    setMarkingSent(true)
    try {
      await onMarkAsSent()
      setLocalSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark rent as sent.")
    } finally {
      setMarkingSent(false)
    }
  }

  const handlePayNow = async () => {
    if (!onPayNow || paying) return
    setError(null)
    setPaying(true)
    try {
      await onPayNow()
      setPaid(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be processed.")
    } finally {
      setPaying(false)
    }
  }

  const handleDisableAutopay = async () => {
    if (!onDisableAutopay || disablingAutopay) return
    setError(null)
    setDisablingAutopay(true)
    try {
      await onDisableAutopay()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not turn off autopay.")
    } finally {
      setDisablingAutopay(false)
    }
  }

  return (
    <Card className="border-sage/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-medium text-text-muted">Rent due</CardTitle>
            <p className="text-3xl font-semibold text-navy">{formatCad(monthlyRent)}</p>
            <p className="text-sm text-text-muted">Due {dueDate}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {isOnAutopay ? (
          <div className="flex flex-col gap-2 rounded-lg bg-sage/10 p-4">
            <div className="flex items-center gap-2 text-navy">
              <Zap className="h-4 w-4 text-teal" aria-hidden="true" />
              <p className="text-sm font-medium">
                Autopay is on — rent is charged automatically on {dueDate}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisableAutopay}
              disabled={disablingAutopay || !onDisableAutopay}
              className="self-start text-xs text-text-muted underline-offset-4 hover:underline disabled:opacity-50"
            >
              {disablingAutopay ? "Turning off..." : "Turn off autopay"}
            </button>
          </div>
        ) : (
          <>
            {stripeEnabled && !nudgeDismissed && !isSettled && (
              <div className="flex items-start justify-between gap-3 rounded-lg bg-sage/10 p-3">
                <div className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-navy">
                      Set up autopay so you never have to think about rent again
                    </p>
                    <Button
                      size="sm"
                      onClick={onEnableAutopay}
                      className="h-7 self-start bg-teal px-3 text-xs text-white hover:bg-teal-dark"
                    >
                      Turn on autopay
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNudgeDismissed(true)}
                  className="shrink-0 rounded p-0.5 text-text-muted hover:text-navy"
                  aria-label="Dismiss autopay suggestion"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {availableMethods.length === 0 ? (
              <p className="text-sm text-text-muted">
                Your landlord hasn&apos;t enabled any payment methods yet.
              </p>
            ) : (
              <>
                {availableMethods.length > 1 && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 text-sm font-medium text-navy">Pay with</legend>
                    <div className="flex gap-2">
                      {availableMethods.map((method) => {
                        const isActive = selectedMethod === method
                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setSelectedMethod(method)}
                            aria-pressed={isActive}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? "border-teal bg-teal/10 text-navy"
                                : "border-sage/50 text-text-muted hover:border-sage"
                            }`}
                          >
                            {method === "etransfer" ? (
                              <Mail className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <CreditCard className="h-4 w-4" aria-hidden="true" />
                            )}
                            {METHOD_LABELS[method]}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                )}

                {selectedMethod === "etransfer" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tenant-etransfer-email" className="text-navy">
                        Send e-Transfer to
                      </Label>
                      <Input
                        id="tenant-etransfer-email"
                        readOnly
                        value={etransferEmail ?? "Not provided"}
                        className="border-sage/50 bg-sage/10 text-navy"
                      />
                    </div>

                    {showSentState ? (
                      <div className="flex items-center gap-2 rounded-lg bg-sage/10 p-3 text-sm text-navy">
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        Marked as sent — waiting for confirmation
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          onClick={handleCopyInstructions}
                          disabled={!etransferEmail}
                          className="flex-1 border-sage/50 text-navy"
                        >
                          {copied ? (
                            <>
                              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                              Copy instructions
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleMarkAsSent}
                          disabled={markingSent || !onMarkAsSent}
                          className="flex-1 bg-teal text-white hover:bg-teal-dark"
                        >
                          {markingSent ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                              Marking...
                            </>
                          ) : (
                            "Mark rent as sent"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="flex flex-col gap-3">
                    {showPaidState ? (
                      <div className="flex items-center gap-2 rounded-lg bg-sage/10 p-3 text-sm text-navy">
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                        Payment complete
                      </div>
                    ) : (
                      <Button
                        onClick={handlePayNow}
                        disabled={paying || !onPayNow}
                        className="w-full bg-teal text-white hover:bg-teal-dark"
                      >
                        {paying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            Processing...
                          </>
                        ) : (
                          `Pay ${formatCad(monthlyRent)} now`
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
