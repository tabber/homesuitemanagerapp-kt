"use client"

import { useState, useEffect, Suspense } from "react"
import {
  Search,
  Filter,
  CreditCard,
  Eye,
  Copy,
  Mail,
  CheckCircle,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Mock data
function PaymentsPageInner() {
  const [searchQuery, setSearchQuery] = useState("")
  const [revenueData, setRevenueData] = useState<{ month: string; collected: number; expected: number }[]>([])
  const [propertyFilter, setPropertyFilter] = useState("all")
  const searchParams = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "all")
  const [remindingId, setRemindingId] = useState<string | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [copiedInstructions, setCopiedInstructions] = useState(false)
  const [instructionLeaseId, setInstructionLeaseId] = useState("")
  const [payMethodTab, setPayMethodTab] = useState<"etransfer" | "pad" | "auto">("etransfer")
  const [sendingReminder, setSendingReminder] = useState(false)
  const [payments, setPayments] = useState<any[]>([])
  const [dbProperties, setDbProperties] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [leaseOptions, setLeaseOptions] = useState<any[]>([])
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [form, setForm] = useState({
    leaseId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "e_transfer",
  })

  useEffect(() => {
    let isMounted = true

    async function loadPayments() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      const { data: paymentRows } = await supabase
        .from("payments")
        .select("*")
        .eq("landlord_id", user.id)
        .order("payment_date", { ascending: false })

      const rows = paymentRows ?? []

      // Load all of this landlord's properties for the filter dropdown
      const { data: configRow } = await supabase
        .from("payment_configuration")
        .select("etransfer_email")
        .eq("landlord_id", user.id)
        .maybeSingle()
      const defaultEtransferEmail = configRow?.etransfer_email ?? ""

      const { data: allProps } = await supabase
        .from("properties")
        .select("id, name, address, etransfer_email")
        .eq("landlord_id", user.id)
        .order("name", { ascending: true })
      const propertyNameMap = new Map<string, string>()
      const propertyInfoMap = new Map<string, any>()
      ;(allProps ?? []).forEach((p: any) => {
        propertyNameMap.set(p.id, p.name)
        propertyInfoMap.set(p.id, p)
      })

      // Resolve unit numbers referenced by the payments
      const unitIds = Array.from(
        new Set(rows.map((p: any) => p.unit_id).filter(Boolean))
      )
      const unitNumberMap = new Map<string, string>()
      if (unitIds.length > 0) {
        const { data: units } = await supabase
          .from("units")
          .select("id, unit_number")
          .in("id", unitIds)
        ;(units ?? []).forEach((u: any) => unitNumberMap.set(u.id, u.unit_number))
      }

      // Resolve tenant names: prefer the lease's tenant_name, fall back to the profile
      const leaseIds = Array.from(
        new Set(rows.map((p: any) => p.lease_id).filter(Boolean))
      )
      const leaseTenantMap = new Map<string, string>()
      if (leaseIds.length > 0) {
        const { data: leases } = await supabase
          .from("leases")
          .select("id, tenant_name")
          .in("id", leaseIds)
        ;(leases ?? []).forEach((l: any) => {
          if (l.tenant_name) leaseTenantMap.set(l.id, l.tenant_name)
        })
      }

      const tenantIds = Array.from(
        new Set(rows.map((p: any) => p.tenant_id).filter(Boolean))
      )
      const profileNameMap = new Map<string, string>()
      if (tenantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", tenantIds)
        ;(profiles ?? []).forEach((pr: any) => {
          const name = [pr.first_name, pr.last_name].filter(Boolean).join(" ").trim()
          if (name) profileNameMap.set(pr.id, name)
        })
      }

      const mapped = rows.map((p: any) => ({
        id: p.id,
        tenant:
          (p.lease_id && leaseTenantMap.get(p.lease_id)) ||
          (p.tenant_id && profileNameMap.get(p.tenant_id)) ||
          "—",
        unit: (p.unit_id && unitNumberMap.get(p.unit_id)) || "—",
        propertyId: p.property_id ?? null,
        property: (p.property_id && propertyNameMap.get(p.property_id)) || "—",
        amount: p.amount ?? 0,
        method: p.payment_method ?? "—",
        date: p.payment_date,
        status: p.status ?? "pending",
      }))

      // Leases available for manual payment entry
      const { data: leaseList } = await supabase
        .from("leases")
        .select("id, tenant_name, tenant_id, monthly_rent, property_id, unit_id, status, etransfer_email")
        .eq("landlord_id", user.id)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })

      if (!isMounted) return
      const leaseMapped = (leaseList ?? []).map((l: any) => {
        const prop = propertyInfoMap.get(l.property_id)
        return {
          ...l,
          propertyName: prop?.name ?? "",
          propertyAddress: prop?.address ?? "",
          payToEmail:
            l.etransfer_email || prop?.etransfer_email || defaultEtransferEmail || "",
          label:
            `${l.tenant_name || "Tenant"}` +
            (prop?.name ? ` — ${prop.name}` : ""),
        }
      })
      setLeaseOptions(leaseMapped)
      if (leaseMapped.length > 0) setInstructionLeaseId(leaseMapped[0].id)
      // ---- Expected rent this period, per active lease ----
      // An overdue tenant has NO payment row, so we synthesize one per active
      // lease and mark it paid / overdue / upcoming.
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const activeLeases = (leaseList ?? []).filter((l: any) => l.status === "active")
      const expectedRows = activeLeases.map((l: any) => {
        const dueDay = Math.min(Math.max(Number(l.payment_due_day ?? 1), 1), 28)
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay)
        const prop = propertyInfoMap.get(l.property_id)
        // Was there a completed payment for this lease this period?
        const paid = (rows ?? []).some(
          (p: any) =>
            p.lease_id === l.id &&
            p.status === "completed" &&
            p.payment_date &&
            new Date(p.payment_date) >= periodStart
        )
        let status: string
        if (paid) status = "completed"
        else if (dueDate < todayMid) status = "overdue"
        else status = "upcoming"
        return {
          id: `expected-${l.id}`,
          synthetic: true,
          leaseId: l.id,
          tenant: l.tenant_name || "Tenant",
          tenantId: l.tenant_id ?? null,
          landlordEmail: l.etransfer_email || prop?.etransfer_email || defaultEtransferEmail || "",
          unit: (l.unit_id && unitNumberMap.get(l.unit_id)) || "—",
          propertyId: l.property_id ?? null,
          property: prop?.name || "—",
          amount: Number(l.monthly_rent ?? 0),
          method: "—",
          date: dueDate.toISOString(),
          status,
        }
      })

      // Only show synthetic rows for leases that are NOT already paid this period
      // (paid ones are represented by their real completed payment row).
      const unpaidExpected = expectedRows.filter((e) => e.status !== "completed")

      // Real chart: last 6 months collected vs expected
      const monthFmt = new Intl.DateTimeFormat("en-CA", { month: "short" })
      const chart: { month: string; collected: number; expected: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        const collected = (rows ?? [])
          .filter(
            (p: any) =>
              p.status === "completed" &&
              p.payment_date &&
              new Date(p.payment_date) >= mStart &&
              new Date(p.payment_date) < mEnd
          )
          .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)
        const expected = activeLeases.reduce(
          (s: number, l: any) => s + Number(l.monthly_rent ?? 0),
          0
        )
        chart.push({ month: monthFmt.format(mStart), collected, expected })
      }
      setRevenueData(chart)

      setPayments([...mapped, ...unpaidExpected])
      setDbProperties(allProps ?? [])
      setLoading(false)
    }

    loadPayments()

    return () => {
      isMounted = false
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  // Property dropdown: real properties for this landlord, plus an "all" option
  const propertyOptions = [{ id: "all", name: "All Properties" }, ...dbProperties]

  // Status dropdown: live statuses present in the payments for the selected property
  const statusOptions = Array.from(
    new Set(
      payments
        .filter((p) => propertyFilter === "all" || p.propertyId === propertyFilter)
        .map((p) => p.status)
        .filter(Boolean)
    )
  ).sort()

  // Reset the status filter to "all" whenever the selected property changes
  const handlePropertyChange = (value: string) => {
    setPropertyFilter(value)
    setStatusFilter("all")
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.tenant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProperty = propertyFilter === "all" || payment.propertyId === propertyFilter
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesProperty && matchesStatus
  })

const totalExpected = leaseOptions
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.monthly_rent ?? 0), 0)
  const refreshPayments = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: rows } = await supabase
      .from("payments")
      .select("*")
      .eq("landlord_id", user.id)
      .order("payment_date", { ascending: false })
    setPayments((prev) =>
      (rows ?? []).map((p: any) => {
        const existing = prev.find((x) => x.id === p.id)
        return {
          id: p.id,
          tenant: existing?.tenant ?? "—",
          unit: existing?.unit ?? "—",
          propertyId: p.property_id ?? null,
          property: existing?.property ?? "—",
          amount: p.amount ?? 0,
          method: p.payment_method ?? "—",
          date: p.payment_date,
          status: p.status ?? "pending",
        }
      })
    )
  }

  const handleConfirmReceived = async (paymentId: string) => {
    setConfirmingId(paymentId)
    const supabase = createClient()
    const { error } = await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("id", paymentId)
    setConfirmingId(null)
    if (error) {
      toast.error(error.message || "Could not confirm payment")
      return
    }
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "completed" } : p))
    )
    toast.success("Payment confirmed")
  }

  const openRecordFor = (payment: any) => {
    const leaseId = payment.leaseId ?? ""
    const lease = leaseOptions.find((l) => l.id === leaseId)
    setForm((f) => ({
      ...f,
      leaseId,
      amount: String(payment.amount ?? lease?.monthly_rent ?? ""),
    }))
    setShowRecordModal(true)
  }

  const handleRecordPayment = async () => {
    if (!form.leaseId || !form.amount || savingPayment) return
    const lease = leaseOptions.find((l) => l.id === form.leaseId)
    if (!lease) return
    setSavingPayment(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSavingPayment(false)
      return
    }
    const { error } = await supabase.from("payments").insert({
      lease_id: lease.id,
      property_id: lease.property_id ?? null,
      unit_id: lease.unit_id ?? null,
      tenant_id: lease.tenant_id ?? null,
      landlord_id: user.id,
      amount: Number(form.amount),
      payment_date: form.date,
      payment_method: form.method,
      status: "completed",
      description: "Recorded by landlord",
    })
    setSavingPayment(false)
    if (error) {
      toast.error(error.message || "Could not record payment")
      return
    }
    toast.success("Payment recorded")
    setShowRecordModal(false)
    setForm({
      leaseId: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      method: "e_transfer",
    })
    await refreshPayments()
  }

  const totalCollected = filteredPayments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0)
  const totalPending = filteredPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
const totalOverdue = filteredPayments.filter(p => p.status === "overdue").reduce((sum, p) => sum + p.amount, 0)
  const avgDaysToPay = (() => {
    const completed = payments.filter((p) => p.status === "completed" && p.date)
    if (completed.length === 0) return null
    const diffs: number[] = []
    completed.forEach((p) => {
      const lease = leaseOptions.find((l) => l.id === (p as any).leaseId)
      const dueDay = Math.min(Math.max(Number((lease as any)?.payment_due_day ?? 1), 1), 28)
      const paid = new Date(p.date)
      if (Number.isNaN(paid.getTime())) return
      const due = new Date(paid.getFullYear(), paid.getMonth(), dueDay)
      diffs.push(Math.round((paid.getTime() - due.getTime()) / 86400000))
    })
    if (diffs.length === 0) return null
    return Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10
  })()
  const selectedInstructionLease = leaseOptions.find((l) => l.id === instructionLeaseId)

  const instructionText = selectedInstructionLease
    ? `Send e-Transfer to: ${selectedInstructionLease.payToEmail || "(not set)"}\n` +
      `Amount: ${formatCurrency(selectedInstructionLease.monthly_rent ?? 0)}\n` +
      `Message: Rent - ${
        selectedInstructionLease.propertyAddress ||
        selectedInstructionLease.propertyName ||
        "your rental"
      }`
    : ""

  const handleCopyInstructions = () => {
    if (!instructionText) return
    navigator.clipboard.writeText(instructionText)
    setCopiedInstructions(true)
    setTimeout(() => setCopiedInstructions(false), 2000)
  }

  const handleRemindOverdue = async (payment: any) => {
    if (!payment?.leaseId || remindingId) return
    setRemindingId(payment.id)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setRemindingId(null)
      return
    }
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: payment.tenantId,
      lease_id: payment.leaseId,
      subject: "Rent reminder",
      content:
        `Hi ${payment.tenant}, this is a friendly reminder that rent of ` +
        `${formatCurrency(payment.amount)} for ${payment.property} is now due` +
        `${payment.landlordEmail ? `. You can send it by e-Transfer to ${payment.landlordEmail}` : ""}.` +
        ` Thank you!`,
    })
    setRemindingId(null)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`Reminder sent to ${payment.tenant}`)
  }

  const handleSendReminder = async () => {
    if (!selectedInstructionLease || sendingReminder) return
    if (!selectedInstructionLease.tenant_id) {
      toast.error("This tenant hasn't accepted their lease invitation yet")
      return
    }
    setSendingReminder(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSendingReminder(false)
      return
    }
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: selectedInstructionLease.tenant_id,
      lease_id: selectedInstructionLease.id,
      subject: "Rent payment reminder",
      content: `A friendly reminder that rent is due.\n\n${instructionText}\n\nOnce you've sent it, mark it in your portal so I can confirm receipt.`,
    })
    setSendingReminder(false)
    if (error) {
      toast.error(error.message || "Could not send reminder")
      return
    }
    toast.success("Reminder sent to tenant's inbox")
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-navy">Payments</h1>
        <Button
          onClick={() => setShowRecordModal(true)}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          Record Payment
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This Month Expected"
          value={formatCurrency(totalExpected)}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(totalCollected)}
          className="[&_p:last-of-type]:text-success"
        />
        <StatCard
          label="Overdue"
          value={formatCurrency(totalOverdue)}
          className="[&_p:last-of-type]:text-destructive"
        />
        <StatCard
          label="Avg. Days to Pay"
          value={avgDaysToPay === null ? "—" : avgDaysToPay}
          sublabel="days after due date"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="border-sage/50 mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-navy">Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sage)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "var(--navy)" }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid var(--sage)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="expected" name="Expected" fill="var(--sage)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="var(--teal)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* e-Transfer Instructions */}
      <Card className="border-sage/50 mb-6 bg-cream/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-medium text-navy mb-1">How tenants pay rent</h3>
                  <p className="text-sm text-text-muted">
                    Choose a method and share the details with your tenant.
                  </p>
                </div>
                {leaseOptions.length > 0 && (
                  <Select value={instructionLeaseId} onValueChange={setInstructionLeaseId}>
                    <SelectTrigger className="w-56 border-sage bg-white">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaseOptions.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Method switcher */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: "etransfer", label: "e-Transfer", ready: true },
                  { key: "pad", label: "Pre-authorized debit", ready: false },
                  { key: "auto", label: "Automatic collection", ready: false },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPayMethodTab(m.key as typeof payMethodTab)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      payMethodTab === m.key
                        ? "bg-teal text-white border-teal"
                        : "bg-white text-navy border-sage hover:bg-sage/20"
                    }`}
                  >
                    {m.label}
                    {!m.ready && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-70">
                        soon
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {payMethodTab === "etransfer" && (
                <>
                  {leaseOptions.length === 0 ? (
                    <div className="bg-white rounded-lg p-4 border border-sage/30 text-sm text-text-muted">
                      Create a lease to generate payment instructions.
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-lg p-4 border border-sage/30">
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-text-muted">Send e-Transfer to:</span>{" "}
                            <span className="text-navy font-medium">
                              {selectedInstructionLease?.payToEmail || "Not set — add one on the lease"}
                            </span>
                          </p>
                          <p>
                            <span className="text-text-muted">Amount:</span>{" "}
                            <span className="text-navy font-medium">
                              {formatCurrency(selectedInstructionLease?.monthly_rent ?? 0)}
                            </span>
                          </p>
                          <p>
                            <span className="text-text-muted">Message:</span>{" "}
                            <span className="text-navy font-medium">
                              Rent -{" "}
                              {selectedInstructionLease?.propertyAddress ||
                                selectedInstructionLease?.propertyName ||
                                "your rental"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={handleCopyInstructions}
                          className="border-navy/20 text-navy hover:bg-navy/5"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {copiedInstructions ? "Copied!" : "Copy instructions"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleSendReminder}
                          disabled={sendingReminder}
                          className="border-navy/20 text-navy hover:bg-navy/5"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {sendingReminder ? "Sending..." : "Send reminder"}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}

              {payMethodTab === "pad" && (
                <div className="bg-white rounded-lg p-4 border border-sage/30 text-sm space-y-2">
                  <p className="text-navy font-medium">Pre-authorized debit (PAD)</p>
                  <p className="text-text-muted">
                    Have your tenant sign your bank&apos;s PAD agreement as part of their
                    onboarding documents, then submit it to your bank to pull rent
                    automatically each month.
                  </p>
                  <p className="text-text-muted">
                    Coming with the document signing release — you&apos;ll upload your
                    bank&apos;s form once and send it with every new lease.
                  </p>
                </div>
              )}

              {payMethodTab === "auto" && (
                <div className="bg-white rounded-lg p-4 border border-sage/30 text-sm space-y-2">
                  <p className="text-navy font-medium">Automatic collection</p>
                  <p className="text-text-muted">
                    Rent debited from your tenant&apos;s account on the due date and
                    recorded here automatically — no reminders, no manual confirming.
                  </p>
                  <p className="text-text-muted">
                    On the roadmap. For now, e-Transfer with confirmation is the
                    fastest way to keep records accurate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card className="border-sage/50 mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search tenant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-sage"
              />
            </div>
            <Select value={propertyFilter} onValueChange={handlePropertyChange}>
              <SelectTrigger className="w-48 border-sage">
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                {propertyOptions.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 border-sage">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Array.from(new Set([...statusOptions, "overdue", "upcoming", "completed"])).map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-sage/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-text-muted py-12">
                    {loading ? "Loading payments..." : "No payments yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-navy">{payment.tenant}</TableCell>
                    <TableCell>{payment.unit}</TableCell>
                    <TableCell>{payment.property}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{payment.date ? formatDate(payment.date) : "—"}</TableCell>
                    <TableCell><StatusBadge status={payment.status} /></TableCell>
                    <TableCell className="text-right">
                      {payment.status === "pending" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={confirmingId === payment.id}
                          onClick={() => handleConfirmReceived(payment.id)}
                          className="text-teal hover:bg-teal/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {confirmingId === payment.id ? "Confirming..." : "Confirm received"}
                        </Button>
                      ) : payment.status === "overdue" ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRecordFor(payment)}
                            className="text-teal hover:bg-teal/10"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Record
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={remindingId === payment.id}
                            onClick={() => handleRemindOverdue(payment)}
                            className="text-warning hover:bg-warning/10"
                          >
                            <Bell className="h-4 w-4 mr-1" />
                            {remindingId === payment.id ? "Sending..." : "Remind"}
                          </Button>
                        </div>
                      ) : payment.status === "upcoming" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRecordFor(payment)}
                          className="text-teal hover:bg-teal/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted pr-2">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy font-medium">Record Payment</DialogTitle>
          </DialogHeader>
          {leaseOptions.length === 0 ? (
            <p className="py-6 text-sm text-text-muted text-center">
              You need an active lease before you can record a payment.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lease">Lease</Label>
                <Select
                  value={form.leaseId}
                  onValueChange={(v) => {
                    const lease = leaseOptions.find((l) => l.id === v)
                    setForm((f) => ({
                      ...f,
                      leaseId: v,
                      amount: f.amount || String(lease?.monthly_rent ?? ""),
                    }))
                  }}
                >
                  <SelectTrigger id="lease">
                    <SelectValue placeholder="Select a lease" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseOptions.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount (CAD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="date">Payment date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="method">Method</Label>
                <Select
                  value={form.method}
                  onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}
                >
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="e_transfer">e-Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="direct_deposit">Direct deposit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRecordModal(false)}
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={!form.leaseId || !form.amount || savingPayment}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  {savingPayment ? "Saving..." : "Record Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsPageInner />
    </Suspense>
  )
}
