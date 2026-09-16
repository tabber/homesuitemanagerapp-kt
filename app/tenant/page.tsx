"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  FileText,
  Wrench,
  Mail,
  CreditCard,
  Calendar,
  AlertTriangle,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TenantPaymentCard } from "@/components/tenant-payment-card"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/context/UserContext"

interface LeaseData {
  id: string
  monthly_rent: number | null
  payment_due_day: number | null
  end_date: string | null
  status: string | null
  property_id: string | null
  unit_id: string | null
  landlord_id: string | null
  etransfer_email: string | null
  etransfer_enabled: boolean | null
  stripe_enabled: boolean | null
}

interface PropertyData {
  name: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
}

interface LandlordData {
  landlord_name: string | null
  landlord_email: string | null
  landlord_phone: string | null
}

interface ActivityItem {
  id: string
  type: "maintenance" | "payment"
  title: string
  description: string
  date: string
  sortDate: number
  status: string
}

export default function TenantDashboard() {
  const { firstName, lastName } = useUser()

  const [loading, setLoading] = useState(true)
  const [lease, setLease] = useState<LeaseData | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [landlord, setLandlord] = useState<LandlordData | null>(null)
  const [openRequests, setOpenRequests] = useState(0)
  const [paymentsMade, setPaymentsMade] = useState(0)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [latestPayment, setLatestPayment] = useState<{
    status: string
    payment_date: string | null
  } | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data: leaseRows } = await supabase
        .from("leases")
        .select("id, monthly_rent, payment_due_day, end_date, status, property_id, unit_id, landlord_id, etransfer_email, etransfer_enabled, stripe_enabled, landlord_name, landlord_email, landlord_phone")
        .eq("tenant_id", user.id)
        .limit(1)
      let leaseRow = (leaseRows?.[0] as LeaseData | undefined) ?? null

      // Fall back to matching on the email the landlord addressed the lease to.
      // Broadened to ANY status (not just pending) so a lease can't go invisible
      // if its status changed but the tenant_id link was never written.
      if (!leaseRow && user.email) {
        const { data: emailRows } = await supabase
          .from("leases")
          .select("id, monthly_rent, payment_due_day, end_date, status, property_id, unit_id, landlord_id, etransfer_email, etransfer_enabled, stripe_enabled, landlord_name, landlord_email, landlord_phone")
          .ilike("tenant_email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
        leaseRow = (emailRows?.[0] as LeaseData | undefined) ?? null

        // Auto-heal: if we matched a lease by email but it has no tenant_id,
        // link it to this account now so future logins find it directly.
        if (leaseRow?.id) {
          await supabase
            .from("leases")
            .update({ tenant_id: user.id })
            .eq("id", leaseRow.id)
            .is("tenant_id", null)
        }
      }

      const { count: openCount } = await supabase
        .from("maintenance_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", user.id)
        .eq("status", "open")

      const { count: paymentCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", user.id)

     const landlordRow: LandlordData | null = leaseRow
        ? {
            landlord_name: (leaseRow as any).landlord_name ?? null,
            landlord_email: (leaseRow as any).landlord_email ?? null,
            landlord_phone: (leaseRow as any).landlord_phone ?? null,
          }
        : null
      let propertyRow: PropertyData | null = null
      if (leaseRow?.property_id) {
        const { data } = await supabase
          .from("properties")
          .select("name, address, city, province, postal_code")
          .eq("id", leaseRow.property_id)
          .maybeSingle()
        propertyRow = (data as PropertyData | null) ?? null
      }

      const { data: recentPayments } = await supabase
        .from("payments")
        .select("id, amount, payment_date, description, status, created_at")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      const { data: recentMaintenance } = await supabase
        .from("maintenance_requests")
        .select("id, title, status, created_at, updated_at")
        .eq("tenant_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5)

      const activityItems: ActivityItem[] = [
        ...(recentPayments ?? []).map((p) => ({
          id: `payment-${p.id}`,
          type: "payment" as const,
          title: "Payment received",
          description: `${p.description ?? "Rent"} - ${formatCurrency(p.amount ?? 0)}`,
          date: formatDate(p.payment_date ?? p.created_at),
          sortDate: new Date(p.payment_date ?? p.created_at ?? 0).getTime(),
          status: p.status ?? "completed",
        })),
        ...(recentMaintenance ?? []).map((m) => ({
          id: `maintenance-${m.id}`,
          type: "maintenance" as const,
          title: "Maintenance request",
          description: m.title ?? "Maintenance request",
          date: formatDate(m.updated_at ?? m.created_at),
          sortDate: new Date(m.updated_at ?? m.created_at ?? 0).getTime(),
          status: m.status ?? "open",
        })),
      ]
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 5)

      if (!isMounted) return

      setLease(leaseRow)
      setProperty(propertyRow)
      setLandlord(landlordRow)
      setOpenRequests(openCount ?? 0)
      setPaymentsMade(paymentCount ?? 0)
      setActivity(activityItems)
      setLatestPayment(
        recentPayments?.[0]
          ? { status: recentPayments[0].status ?? "pending", payment_date: recentPayments[0].payment_date }
          : null,
      )
      setLoading(false)
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  const monthlyRent = lease?.monthly_rent ?? 0
  const rentDueDay = lease?.payment_due_day ?? null
  const hasPendingLease = lease?.status === "pending"

  const leaseExpiresInDays = lease?.end_date
    ? Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / 86400000)
    : null

  const nextRentDueDate = (() => {
    if (!rentDueDay) return null
    const now = new Date()
    let due = new Date(now.getFullYear(), now.getMonth(), rentDueDay)
    if (due.getTime() < now.getTime()) {
      due = new Date(now.getFullYear(), now.getMonth() + 1, rentDueDay)
    }
    return due
  })()

  const paymentStatus = (() => {
    const now = new Date()
    if (latestPayment?.payment_date) {
      const paidAt = new Date(latestPayment.payment_date)
      const samePeriod =
        paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth()
      if (samePeriod) {
        return latestPayment.status === "completed" ? ("confirmed" as const) : ("sent" as const)
      }
    }
    if (rentDueDay) {
      const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), rentDueDay)
      if (now.getTime() > dueThisMonth.getTime()) return "overdue" as const
    }
    return "due" as const
  })()

  const availablePaymentMethods = [
    ...(lease?.etransfer_enabled ? (["etransfer"] as const) : []),
    ...(lease?.stripe_enabled ? (["card"] as const) : []),
  ]

  const handleMarkRentAsSent = async () => {
    if (!lease || !lease.id) throw new Error("No active lease found")
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("You must be signed in")

    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        lease_id: lease.id,
        property_id: lease.property_id ?? null,
        unit_id: lease.unit_id ?? null,
        tenant_id: user.id,
        landlord_id: lease.landlord_id ?? null,
        amount: monthlyRent,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "e_transfer",
        description: "Tenant-reported e-Transfer",
      })
      .select()
      .single()

    if (error) throw new Error(error.message || "Could not record your payment")

    if (lease.landlord_id) {
      const tenantName = [firstName, lastName].filter(Boolean).join(" ") || "Your tenant"
      await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: lease.landlord_id,
        lease_id: lease.id,
        subject: "Rent payment sent",
        content: `${tenantName} has sent a rent payment of ${formatCurrency(
          monthlyRent,
        )} by e-Transfer. Please confirm receipt in your Payments page once it arrives.`,
      })
    }

    setLatestPayment({ status: inserted?.status ?? "pending", payment_date: inserted?.payment_date ?? null })
    setPaymentsMade((prev) => prev + 1)
    toast.success("Payment reported — your landlord has been notified")
  }

  const landlordName = landlord?.landlord_name ?? ""
  const propertyCityLine = property
    ? [property.city, property.province, property.postal_code].filter(Boolean).join(", ")
    : ""

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Here&apos;s what&apos;s happening with your rental
        </p>
      </div>

      {/* Pending Lease Alert */}
      {hasPendingLease && (
        <div className="bg-teal/10 border border-teal/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-teal-dark" />
            <span className="text-sm text-navy">
              You have a lease waiting for your review and signature
            </span>
          </div>
        <Link href="/tenant/lease/accept">
            <Button className="bg-teal hover:bg-teal-dark text-white">
              View & Sign Lease
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Rent"
          value={loading ? "—" : formatCurrency(monthlyRent)}
          sublabel={
            rentDueDay
              ? `Due on the ${rentDueDay}${rentDueDay === 1 ? "st" : "th"}`
              : "No data yet"
          }
        />
        <StatCard
          label="Lease Expires"
          value={loading ? "—" : lease?.end_date ? formatDate(lease.end_date) : "No data yet"}
          sublabel={
            leaseExpiresInDays !== null && leaseExpiresInDays < 90 ? (
              <span className="text-destructive">
                {leaseExpiresInDays} days remaining
              </span>
            ) : undefined
          }
        />
        <StatCard
          label="Open Requests"
          value={loading ? "—" : openRequests}
          sublabel="Maintenance requests"
        />
        <StatCard
          label="Payments Made"
          value={loading ? "—" : paymentsMade}
          sublabel="Total payments"
        />
      </div>

      {/* Rent Payment */}
      {!loading && lease && !hasPendingLease && (
        <TenantPaymentCard
          monthlyRent={monthlyRent}
          dueDate={nextRentDueDate ? formatDate(nextRentDueDate.toISOString()) : "—"}
          paymentStatus={paymentStatus}
          availableMethods={availablePaymentMethods}
          etransferEmail={lease.etransfer_email ?? undefined}
          isOnAutopay={false}
          onMarkAsSent={handleMarkRentAsSent}
        />
      )}

      {/* Property & Landlord Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Property Card */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy flex items-center justify-between">
              Your Property
              {property?.name && <StatusBadge status="active" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {property ? (
              <>
                <h3 className="font-medium text-navy">{property.name}</h3>
                <div className="flex items-start gap-2 mt-2 text-sm text-text-muted">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p>{property.address}</p>
                    <p>{propertyCityLine}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Landlord Card */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Your Landlord
            </CardTitle>
          </CardHeader>
          <CardContent>
            {landlord ? (
              <>
                <h3 className="font-medium text-navy">{landlordName}</h3>
                <div className="mt-2 space-y-1 text-sm text-text-muted">
                  <p>{landlord.landlord_email}</p>
                  {landlord.landlord_phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{landlord.landlord_phone}</span>
                    </div>
                  )}
                </div>
                <Link href="/tenant/inbox">
                  <Button
                    variant="outline"
                    className="mt-4 border-teal text-teal hover:bg-teal/10"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm text-text-muted">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/tenant/inbox?tab=maintenance&action=new"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">
                  Submit Maintenance Request
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>

            <Link
              href="/tenant/my-home"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-cream hover:bg-sage/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-teal-dark" />
                </div>
                <span className="text-sm font-normal text-navy">
                  View My Lease
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </Link>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-sage/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-navy">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!loading && lease ? (
              <>
                {nextRentDueDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-cream">
                    <div className="w-9 h-9 rounded-full bg-teal/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-teal-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Next rent due</p>
                      <p className="text-sm text-text-muted">
                        {formatCurrency(monthlyRent)} - {formatDate(nextRentDueDate.toISOString())}
                      </p>
                    </div>
                  </div>
                )}

                {leaseExpiresInDays !== null && leaseExpiresInDays < 90 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5">
                    <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">
                        Lease expiring soon
                      </p>
                      <p className="text-sm text-text-muted">
                        {leaseExpiresInDays} days remaining - Contact your
                        landlord to renew
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              !loading && <p className="text-sm text-text-muted">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-sage/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-navy">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-sage/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sage/30 flex items-center justify-center">
                      {item.type === "maintenance" && (
                        <Wrench className="h-4 w-4 text-navy" />
                      )}
                      {item.type === "payment" && (
                        <CreditCard className="h-4 w-4 text-navy" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-normal text-navy">
                        {item.title}
                      </p>
                      <p className="text-sm text-text-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status as any} />
                    <span className="text-sm text-text-muted">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No data yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No data yet"
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}
