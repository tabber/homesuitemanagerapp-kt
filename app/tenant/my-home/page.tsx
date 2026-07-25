"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  CreditCard,
  Zap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
  Download,
  Printer,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { useUser } from "@/lib/context/UserContext"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/empty-state"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function TenantMyHome() {
  const [showLeaseModal, setShowLeaseModal] = useState(false)
  const [showETransferModal, setShowETransferModal] = useState(false)
  const { id: userId, firstName, lastName, email } = useUser()

  const [loading, setLoading] = useState(true)
  const [leaseRow, setLeaseRow] = useState<any | null>(null)
  const [landlordRow, setLandlordRow] = useState<any | null>(null)
  const [propertyRow, setPropertyRow] = useState<any | null>(null)
  const [landlordEtransfer, setLandlordEtransfer] = useState<string>("")
  const [tenantRow, setTenantRow] = useState<any | null>(null)
  const [paymentRows, setPaymentRows] = useState<any[]>([])
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [openingDocId, setOpeningDocId] = useState<string | null>(null)


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  const formatLongDate = (value?: string | null) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadHome() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      // Current tenant profile
      const { data: tenant } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      // Tenant's lease
      const { data: lease } = await supabase
        .from("leases")
        .select("*")
        .eq("tenant_id", user.id)
        .limit(1)
        .maybeSingle()

      let landlord: any = null
      let property: any = null
      if (lease?.landlord_id) {
        const { data: cfg } = await supabase
          .from("payment_configuration")
          .select("etransfer_email")
          .eq("landlord_id", lease.landlord_id)
          .maybeSingle()
        if (isMounted && cfg?.etransfer_email) setLandlordEtransfer(cfg.etransfer_email)
      }

      if (lease?.landlord_id) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", lease.landlord_id)
          .maybeSingle()
        landlord = data ?? null
      }
      if (lease?.property_id) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .eq("id", lease.property_id)
          .maybeSingle()
        property = data ?? null
      }

      // Tenant's recent payments
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (!isMounted) return
      setTenantRow(tenant ?? null)
      setLeaseRow(lease ?? null)

      // Documents attached to this lease (RLS limits this to the tenant's own lease)
      if (lease?.id) {
        const { data: docRows } = await supabase
          .from("documents")
          .select("*")
          .eq("lease_id", lease.id)
          .order("created_at", { ascending: false })
        if (isMounted) setDocuments(docRows ?? [])
      }
      setLandlordRow(landlord)
      setPropertyRow(property)
      setPaymentRows(payments ?? [])
      setLoading(false)
    }

    loadHome()

    return () => {
      isMounted = false
    }
  }, [])

  // Coerce a jsonb utilities value into a string array
  const toUtilityList = (value: any): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((v) => String(v))
    if (typeof value === "object") {
      return Object.keys(value).filter((k) => value[k])
    }
    return []
  }

  const tenantName =
    [tenantRow?.first_name, tenantRow?.last_name].filter(Boolean).join(" ").trim() ||
    leaseRow?.tenant_name ||
    tenantRow?.email ||
    "Tenant"

  const landlord = {
    name:
      [landlordRow?.first_name, landlordRow?.last_name].filter(Boolean).join(" ").trim() ||
      leaseRow?.landlord_name ||
      "—",
    email: landlordRow?.email || leaseRow?.landlord_email || "—",
    phone: landlordRow?.phone || leaseRow?.landlord_phone || "—",
    eTransferEmail: leaseRow?.etransfer_email || propertyRow?.etransfer_email || landlordEtransfer || "—",
  }

  const lease = leaseRow
    ? {
        propertyName: propertyRow?.name || "—",
        address: propertyRow?.address || "—",
        city: propertyRow
          ? [propertyRow.city, propertyRow.province, propertyRow.postal_code].filter(Boolean).join(", ")
          : "",
        status: leaseRow.status || "active",
        startDate: formatLongDate(leaseRow.start_date),
        endDate: formatLongDate(leaseRow.end_date),
        monthlyRent: leaseRow.monthly_rent ?? 0,
        securityDeposit: leaseRow.security_deposit ?? 0,
        paymentDueDay: leaseRow.payment_due_day ?? 1,
        utilities: toUtilityList(leaseRow.utilities_included),
        parking: leaseRow.parking_details || "—",
        smokingPolicy: leaseRow.smoking_allowed ? "Smoking allowed" : "No smoking on premises",
        petPolicy: leaseRow.pets_allowed
          ? leaseRow.pet_details || "Pets allowed"
          : "No pets allowed",
        vehicleDetails: leaseRow.vehicle_details || "—",
        additionalTenants: leaseRow.additional_tenants
          ? [leaseRow.additional_tenants]
          : [],
        additionalTerms: leaseRow.terms || "—",
        tenantSigned: !!leaseRow.tenant_signed_at,
        tenantSignedDate: formatLongDate(leaseRow.tenant_signed_at),
        landlordSigned: !!leaseRow.landlord_signed_at,
        landlordSignedDate: formatLongDate(leaseRow.landlord_signed_at),
      }
    : null

  const handleOpenDocument = async (doc: any) => {
    if (!doc.file_url) {
      toast.error("This document has no stored file")
      return
    }
    setOpeningDocId(doc.id)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_url, 60)
    setOpeningDocId(null)
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not open this document")
      return
    }
    window.open(data.signedUrl, "_blank")
  }

  const handleConfirmSent = async () => {
    if (!leaseRow || !userId || submittingPayment) return
    setSubmittingPayment(true)
    const supabase = createClient()
    const amount = Number(leaseRow.monthly_rent ?? 0)

    // Status is forced to "pending" by the database for tenant-created rows.
    const { data: inserted, error } = await supabase
      .from("payments")
      .insert({
        lease_id: leaseRow.id,
        property_id: leaseRow.property_id ?? null,
        unit_id: leaseRow.unit_id ?? null,
        tenant_id: userId,
        landlord_id: leaseRow.landlord_id ?? null,
        amount,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: "e_transfer",
        description: "Tenant-reported e-Transfer",
      })
      .select()
      .single()

    if (error) {
      setSubmittingPayment(false)
      toast.error(error.message || "Could not record your payment")
      return
    }

    // Notify the landlord in their inbox (best effort).
    if (leaseRow.landlord_id) {
      const tenantName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        leaseRow.tenant_name ||
        "Your tenant"
      await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: leaseRow.landlord_id,
        lease_id: leaseRow.id,
        subject: "Rent payment sent",
        content: `${tenantName} has sent a rent payment of ${new Intl.NumberFormat(
          "en-CA",
          { style: "currency", currency: "CAD" }
        ).format(amount)} by e-Transfer. Please confirm receipt in your Payments page once it arrives.`,
      })
    }

    if (inserted) setPaymentRows((prev) => [inserted, ...prev])
    setSubmittingPayment(false)
    setShowETransferModal(false)
    toast.success("Payment reported — your landlord has been notified")
  }

  const payments = paymentRows.map((p: any) => ({
    id: p.id,
    date: formatLongDate(p.payment_date),
    amount: p.amount ?? 0,
    method: p.payment_method || "—",
    status: p.status || "completed",
  }))

  const utilities = {
    payThroughLandlord: Array.isArray(leaseRow?.utility_costs) ? leaseRow.utility_costs : [],
    payDirectly: toUtilityList(leaseRow?.utilities_included),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-navy">My Home</h1>
          <p className="text-sm text-text-muted mt-1">
            View your lease details, payments, and utilities
          </p>
        </div>
        <Card className="border-sage/50">
          <CardContent className="p-6 text-sm text-text-muted">Loading...</CardContent>
        </Card>
      </div>
    )
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-navy">My Home</h1>
          <p className="text-sm text-text-muted mt-1">
            View your lease details, payments, and utilities
          </p>
        </div>
        <Card className="border-sage/50">
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="No Lease Found"
              description="You don't have an active lease yet. Your lease details will appear here once your landlord sets one up."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">My Home</h1>
        <p className="text-sm text-text-muted mt-1">
          View your lease details, payments, and utilities
        </p>
      </div>

      {/* Property Overview Card */}
      <Card className="border-sage/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-dark" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-navy">
                    {lease.propertyName}
                  </h2>
                  <StatusBadge status={lease.status} />
                </div>
                <div className="flex items-start gap-2 mt-1 text-sm text-text-muted">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p>{lease.address}</p>
                    <p>{lease.city}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-text-muted">
                  <p>
                    <span className="font-medium text-navy">Landlord:</span>{" "}
                    {landlord.name}
                  </p>
                  <p>{landlord.email}</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{landlord.phone}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  Lease: {lease.startDate} - {lease.endDate}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowLeaseModal(true)}
              className="border-sage text-navy hover:bg-sage/20"
            >
              View Lease Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="lease" className="space-y-4">
        <TabsList className="bg-white border border-sage/50">
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="utilities">Utilities</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {leaseRow?.move_out_date && (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-navy">
                Move-out scheduled for {formatLongDate(leaseRow.move_out_date)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Rent remains due until then. Your landlord will arrange a
                condition inspection and settle your deposit after you move out.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lease Tab */}
        <TabsContent value="lease" className="space-y-4">
          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Monthly Rent"
              value={formatCurrency(lease.monthlyRent)}
            />
            <StatCard
              label="Security Deposit"
              value={formatCurrency(lease.securityDeposit)}
            />
            <StatCard
              label="Payment Due Day"
              value={`${lease.paymentDueDay}${lease.paymentDueDay === 1 ? "st" : "th"} of each month`}
            />
          </div>

          {/* Lease Details */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Lease Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Utilities (Tenant Responsible)
                </p>
                <div className="flex flex-wrap gap-2">
                  {lease.utilities.map((utility) => (
                    <Badge
                      key={utility}
                      variant="secondary"
                      className="bg-sage/30 text-navy"
                    >
                      {utility}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Parking
                  </p>
                  <p className="text-sm text-navy">{lease.parking}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Smoking Policy
                  </p>
                  <p className="text-sm text-navy">{lease.smokingPolicy}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Pet Policy
                  </p>
                  <p className="text-sm text-navy">{lease.petPolicy}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Vehicle Details
                  </p>
                  <p className="text-sm text-navy">{lease.vehicleDetails}</p>
                </div>
              </div>

              {lease.additionalTenants.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Additional Tenants
                  </p>
                  <p className="text-sm text-navy">
                    {lease.additionalTenants.join(", ")}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Additional Terms
                </p>
                <p className="text-sm text-navy">{lease.additionalTerms}</p>
              </div>
            </CardContent>
          </Card>

          {/* Lease Status */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Lease Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-cream">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lease.tenantSigned
                        ? "bg-success/10"
                        : "bg-warning/10"
                    }`}
                  >
                    {lease.tenantSigned ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <FileText className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      Your acknowledgment
                    </p>
                    <p className="text-sm text-text-muted">
                      {lease.tenantSigned
                        ? `Accepted on ${lease.tenantSignedDate}`
                        : "Review and accept your lease terms"}
                    </p>
                  </div>
                </div>
                {!lease.tenantSigned && (
                  <Button asChild className="bg-teal hover:bg-teal-dark text-white">
                    <Link href="/tenant/lease/accept">Review &amp; Accept</Link>
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-cream">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lease.landlordSigned
                        ? "bg-success/10"
                        : "bg-warning/10"
                    }`}
                  >
                    {lease.landlordSigned ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <FileText className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">
                      Landlord acknowledgment
                    </p>
                    <p className="text-sm text-text-muted">
                      {lease.landlordSigned
                        ? `Signed on ${lease.landlordSignedDate}`
                        : "Awaiting landlord confirmation"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* e-Transfer Instructions */}
          <Card className="border-sage/50 bg-teal/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-navy mb-3">
                    e-Transfer Payment Instructions
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-text-muted">Send to:</span>{" "}
                      <span className="font-medium text-navy">
                        {landlord.eTransferEmail}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-muted">Amount:</span>{" "}
                      <span className="font-medium text-navy">
                        {formatCurrency(lease.monthlyRent)}
                      </span>
                    </p>
                    <p>
                      <span className="text-text-muted">Message:</span>{" "}
                      <span className="font-medium text-navy">
                        &quot;Rent - {lease.address}&quot;
                      </span>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowETransferModal(true)}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  I&apos;ve Sent Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-text-muted py-6">
                        No data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-normal text-navy">
                        {payment.date}
                      </TableCell>
                      <TableCell className="text-navy">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {payment.method}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilities Tab */}
        <TabsContent value="utilities" className="space-y-4">
          {/* Pay Through Landlord */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Pay Through Landlord
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {utilities.payThroughLandlord.length === 0 && (
                  <p className="text-sm text-text-muted">No data yet</p>
                )}
                {utilities.payThroughLandlord.map((utility: any) => (
                  <div
                    key={utility.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-cream"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-teal-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {utility.name}
                        </p>
                        <p className="text-sm text-text-muted">
                          Due: {utility.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-navy">
                        {formatCurrency(utility.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pay Directly */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Pay Directly
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {utilities.payDirectly.length === 0 && (
                  <p className="text-sm text-text-muted">No data yet</p>
                )}
                {utilities.payDirectly.map((utility) => (
                  <div
                    key={utility}
                    className="flex items-center justify-between p-4 rounded-lg bg-cream"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-navy" />
                      </div>
                      <p className="text-sm font-medium text-navy">{utility}</p>
                    </div>
                    <p className="text-sm text-text-muted">
                      Contact your provider
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Your documents
              </CardTitle>
              <p className="text-sm text-text-muted mt-1">
                Lease agreements, notices and receipts your landlord has shared
              </p>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-text-muted py-6 text-center">
                  No documents yet. Anything your landlord attaches to your lease
                  will appear here.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-sage/40 hover:bg-sage/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded bg-teal/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-teal" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy truncate">
                            {doc.file_name ?? "Document"}
                          </p>
                          <p className="text-xs text-text-muted capitalize">
                            {(doc.document_type ?? "document").replace(/_/g, " ")}
                            {doc.created_at
                              ? ` · ${formatLongDate(doc.created_at)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={openingDocId === doc.id}
                        onClick={() => handleOpenDocument(doc)}
                        className="border-sage text-navy hover:bg-sage/20 flex-shrink-0"
                      >
                        {openingDocId === doc.id ? "Opening..." : "Open"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Lease Agreement Summary Modal */}
      <Dialog open={showLeaseModal} onOpenChange={setShowLeaseModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy text-xl">
              RESIDENTIAL LEASE AGREEMENT
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-text-muted">
              Standard residential lease agreement - Ontario Residential
              Tenancies Act
            </p>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Landlord
                </p>
                <p className="text-sm font-medium text-navy">
                  {landlord.name}
                </p>
                <p className="text-sm text-text-muted">{landlord.email}</p>
                <p className="text-sm text-text-muted">{landlord.phone}</p>
              </div>
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Tenant
                </p>
               <p className="text-sm font-medium text-navy">{firstName} {lastName}</p>
              <p className="text-sm text-text-muted">{email}</p>
              </div>
            </div>

            {/* Property */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Property
              </p>
              <p className="text-sm font-medium text-navy">
                {lease.address}
              </p>
              <p className="text-sm text-text-muted">{lease.city}</p>
            </div>

            {/* Lease Terms */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Lease Terms
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-navy">
                  {lease.startDate} - {lease.endDate}
                </span>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Monthly Rent
                </p>
                <p className="text-lg font-medium text-navy">
                  {formatCurrency(lease.monthlyRent)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-cream">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Security Deposit
                </p>
                <p className="text-lg font-medium text-navy">
                  {formatCurrency(lease.securityDeposit)}
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="p-4 rounded-lg bg-cream">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                Payment
              </p>
              <p className="text-sm text-navy">
                Due on the {lease.paymentDueDay}st of each month via
                e-Transfer to {landlord.eTransferEmail}
              </p>
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Utilities
                </p>
                <p className="text-navy">{lease.utilities.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Parking
                </p>
                <p className="text-navy">{lease.parking}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Smoking
                </p>
                <p className="text-navy">{lease.smokingPolicy}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                  Pets
                </p>
                <p className="text-navy">{lease.petPolicy}</p>
              </div>
            </div>

            {/* Additional Terms */}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Additional Terms
              </p>
              <p className="text-sm text-navy">{lease.additionalTerms}</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sage/30">
              <div className="text-center">
                <div className="h-16 border-b border-navy/30 mb-2 flex items-end justify-center pb-2">
                 {lease.landlordSigned && (
                  <span className="text-navy italic">{landlord.name}</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Landlord Signature</p>
                {lease.landlordSignedDate && (
                  <p className="text-xs text-text-muted">
                    {lease.landlordSignedDate}
                  </p>
                )}
              </div>
              <div className="text-center">
                <div className="h-16 border-b border-navy/30 mb-2 flex items-end justify-center pb-2">
                  {lease.tenantSigned && (
                  <span className="text-navy italic">{firstName} {lastName}</span>
                  )}
                </div>
                <p className="text-xs text-text-muted">Tenant Signature</p>
                {lease.tenantSignedDate && (
                  <p className="text-xs text-text-muted">
                    {lease.tenantSignedDate}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-sage/30">
              <p className="text-xs text-text-muted text-center mb-4">
                Generated on {new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* e-Transfer Confirmation Modal */}
      <Dialog open={showETransferModal} onOpenChange={setShowETransferModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Confirm Payment Sent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              By clicking confirm, you&apos;re notifying your landlord that
              you&apos;ve sent an e-Transfer payment for your rent. Your
              landlord will confirm receipt.
            </p>
            <div className="bg-cream rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Amount</span>
                <span className="font-medium text-navy">
                  {formatCurrency(lease.monthlyRent)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Sent to</span>
                <span className="font-medium text-navy">
                  {landlord.eTransferEmail}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowETransferModal(false)}
                className="flex-1 border-sage text-navy hover:bg-sage/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSent}
                disabled={submittingPayment}
                className="flex-1 bg-teal hover:bg-teal-dark text-white"
              >
                {submittingPayment ? "Recording..." : "Confirm Sent"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
