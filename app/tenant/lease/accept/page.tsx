"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Loader2,
  Home,
} from "lucide-react"

export default function AcceptLeasePage() {
  const router = useRouter()
  const [lease, setLease] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToRules, setAgreedToRules] = useState(false)

  useEffect(() => {
    async function fetchLease() {
      try {
        const res = await fetch("/api/tenant/lease-summary")
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to load lease")
        }
        const data = await res.json()
        setLease(data.lease ?? null)
      } catch {
        toast.error("Failed to load your lease")
      } finally {
        setLoading(false)
      }
    }
    fetchLease()
  }, [router])

  const handleAccept = async () => {
    if (!lease || accepting) return
    setAccepting(true)
    try {
      const res = await fetch("/api/tenant/activate-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: lease.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to accept lease")
      toast.success("Lease accepted. Welcome to your new home!")
      router.push("/tenant")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept lease")
    } finally {
      setAccepting(false)
    }
  }

  const formatCurrency = (amount: number | null) =>
    amount == null
      ? "—"
      : new Intl.NumberFormat("en-CA", {
          style: "currency",
          currency: "CAD",
        }).format(amount)

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-CA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    )
  }

  if (!lease) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-sage/50">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-sage/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-navy" />
            </div>
            <h1 className="text-xl font-medium text-navy mb-2">No lease found</h1>
            <p className="text-sm text-text-muted">
              We couldn&apos;t find a lease for your account. Please contact your
              landlord to make sure they used this email address on your lease.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (lease.status === "active") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-sage/50">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-medium text-navy mb-2">
              Your lease is already active
            </h1>
            <Button
              onClick={() => router.push("/tenant")}
              className="bg-teal hover:bg-teal-dark text-white mt-4"
            >
              Go to my portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const utilities: Record<string, boolean> = lease.utilities_included ?? {}
  const includedUtilities = Object.entries(utilities)
    .filter(([, v]) => v)
    .map(([k]) => k)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium text-navy">Review your lease</h1>
          <p className="text-sm text-text-muted mt-1">
            Please review the details below and accept to activate your tenancy.
          </p>
        </div>

        {/* Property */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal" />
              Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-medium text-navy">
              {lease.property?.name ?? "Property"}
            </p>
            <div className="flex items-start gap-2 text-sm text-text-muted">
              <MapPin className="h-4 w-4 mt-0.5 text-teal flex-shrink-0" />
              <div>
                <p>{lease.property?.address}</p>
                <p>
                  {lease.property?.city}
                  {lease.property?.province ? `, ${lease.property.province}` : ""}{" "}
                  {lease.property?.postal_code}
                </p>
              </div>
            </div>
            {lease.unit && (
              <div className="flex items-center gap-2 text-sm text-text-muted pt-1">
                <Home className="h-4 w-4 text-teal" />
                <span>
                  Unit {lease.unit.unit_number}
                  {lease.unit.bedrooms != null &&
                    ` · ${lease.unit.bedrooms} bed · ${lease.unit.bathrooms} bath`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lease terms */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal" />
              Lease Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted">Start date</p>
              <p className="text-navy font-medium">{formatDate(lease.start_date)}</p>
            </div>
            <div>
              <p className="text-text-muted">End date</p>
              <p className="text-navy font-medium">{formatDate(lease.end_date)}</p>
            </div>
            <div>
              <p className="text-text-muted">Monthly rent</p>
              <p className="text-navy font-medium">
                {formatCurrency(lease.monthly_rent)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">Security deposit</p>
              <p className="text-navy font-medium">
                {formatCurrency(lease.security_deposit)}
              </p>
            </div>
            {lease.payment_due_day && (
              <div>
                <p className="text-text-muted">Rent due</p>
                <p className="text-navy font-medium">
                  Day {lease.payment_due_day} of each month
                </p>
              </div>
            )}
            {includedUtilities.length > 0 && (
              <div className="col-span-2">
                <p className="text-text-muted">Utilities included</p>
                <p className="text-navy font-medium capitalize">
                  {includedUtilities.join(", ")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Policies */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal" />
              Policies &amp; Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted">Pets</p>
                <p className="text-navy font-medium">
                  {lease.pets_allowed ? "Allowed" : "Not allowed"}
                  {lease.pets_allowed && lease.pet_details
                    ? ` — ${lease.pet_details}`
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Smoking</p>
                <p className="text-navy font-medium">
                  {lease.smoking_allowed ? "Allowed" : "Not allowed"}
                </p>
              </div>
              {lease.num_vehicles != null && (
                <div>
                  <p className="text-text-muted">Vehicles</p>
                  <p className="text-navy font-medium">
                    {lease.num_vehicles}
                    {lease.vehicle_details ? ` — ${lease.vehicle_details}` : ""}
                  </p>
                </div>
              )}
              {lease.parking_details && (
                <div>
                  <p className="text-text-muted">Parking</p>
                  <p className="text-navy font-medium">{lease.parking_details}</p>
                </div>
              )}
            </div>
            {lease.additional_occupants && (
              <div>
                <p className="text-text-muted">Additional occupants</p>
                <p className="text-navy font-medium">{lease.additional_occupants}</p>
              </div>
            )}
            {lease.terms && (
              <div>
                <p className="text-text-muted">Additional terms</p>
                <p className="text-navy whitespace-pre-wrap">{lease.terms}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Landlord */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
              <User className="h-5 w-5 text-teal" />
              Your Landlord
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-navy font-medium">{lease.landlord?.name}</p>
            {lease.landlord?.company_name && (
              <p className="text-text-muted">{lease.landlord.company_name}</p>
            )}
            {lease.landlord?.email && (
              <div className="flex items-center gap-2 text-text-muted">
                <Mail className="h-4 w-4 text-teal" />
                {lease.landlord.email}
              </div>
            )}
            {lease.landlord?.phone && (
              <div className="flex items-center gap-2 text-text-muted">
                <Phone className="h-4 w-4 text-teal" />
                {lease.landlord.phone}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agreement */}
        <Card className="border-sage/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-navy cursor-pointer">
                I have read and agree to the lease terms above, including the rent
                amount, lease dates, and deposit.
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="rules"
                checked={agreedToRules}
                onCheckedChange={(v) => setAgreedToRules(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="rules" className="text-sm text-navy cursor-pointer">
                I agree to the property policies and occupancy details, and confirm
                the information provided is accurate.
              </label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!agreedToTerms || !agreedToRules || accepting}
              className="w-full bg-teal hover:bg-teal-dark text-white"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Accept Lease
                </>
              )}
            </Button>
            <p className="text-xs text-text-muted text-center">
              Accepting activates your tenancy and gives you access to your tenant
              portal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
