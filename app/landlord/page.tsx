"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  Plus,
  FileText,
  Bell,
  Calendar,
  CreditCard,
  MessageSquare,
  Check,
  Circle,
  ChevronRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { TrialBanner } from "@/components/trial-banner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(date: Date) {
  return format(date, "MMMM d, yyyy")
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return format(date, "MMM d, yyyy")
}

const eventIconByType: Record<string, typeof DollarSign> = {
  rent: DollarSign,
  lease: FileText,
  maintenance: Wrench,
  utility: CreditCard,
}

interface UpcomingEvent {
  type: string
  icon: typeof DollarSign
  title: string
  description: string
  amount?: string
  daysRemaining?: number
  date: Date
}

interface NotificationGroup {
  key: string
  label: string
  count: number
  href: string
  tone: "urgent" | "action" | "info"
}

interface ActivityItem {
  type: string
  description: string
  property: string
  title?: string
  amount?: string
  time: string
  sortDate: number
}

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

export default function LandlordDashboard() {

  const [loading, setLoading] = useState(true)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0)
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    openRequests: 0,
  })
  const [revenueData, setRevenueData] = useState<{ month: string; collected: number; expected: number }[]>([])
  const [hasRevenue, setHasRevenue] = useState(false)
  const [occupancy, setOccupancy] = useState({ occupied: 0, vacant: 0, total: 0 })
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])

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

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const monthStartStr = format(monthStart, "yyyy-MM-dd")
      const monthEndStr = format(monthEnd, "yyyy-MM-dd")

      const [
        propertiesRes,
        activeLeasesCountRes,
        monthlyPaymentsRes,
        maintenanceCountRes,
        profileRes,
        paymentsRes,
        leasesRes,
        maintenanceRes,
        messagesRes,
        paymentConfigRes,
        utilityBillsRes,
        unitsRes,
        remindersRes,
      ] = await Promise.all([
        supabase.from("properties").select("id, name, status").eq("landlord_id", user.id),
        supabase
          .from("leases")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id)
          .eq("status", "active"),
        supabase
          .from("payments")
          .select("amount")
          .eq("landlord_id", user.id)
          .gte("payment_date", monthStartStr)
          .lte("payment_date", monthEndStr),
        supabase
          .from("maintenance_requests")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id)
          .eq("status", "open"),
        supabase
          .from("profiles")
          .select("profile_completed, trial_end_date")
          .eq("id", user.id)
          .single(),
        supabase
          .from("payments")
          .select("amount, payment_date, created_at, property_id, lease_id, status")
          .eq("landlord_id", user.id)
          .gte("payment_date", format(sixMonthsAgo, "yyyy-MM-dd")),
        supabase
          .from("leases")
          .select(
            "id, monthly_rent, status, end_date, created_at, tenant_id, tenant_name, property_id, invitation_sent_at, payment_due_day, unit_id, move_out_date, tenant_signed_at, landlord_signed_at"
          )
          .eq("landlord_id", user.id),
        supabase
          .from("maintenance_requests")
          .select("id, title, status, scheduled_date, created_at, property_id")
          .eq("landlord_id", user.id),
        supabase
          .from("messages")
          .select("id, subject, created_at")
          .eq("recipient_id", user.id),
        supabase.from("payment_configuration").select("id").eq("landlord_id", user.id),
        supabase
          .from("utility_bills")
          .select("id, utility_type, amount, due_date, paid, lease_id")
          .eq("paid", false),
        supabase.from("units").select("id, property_id, status"),
        supabase
          .from("maintenance_reminders")
          .select("id, title, due_date, property_id")
          .is("completed_at", null),
      ])

      if (!isMounted) return

      const properties = propertiesRes.data ?? []
      const propertyMap = new Map(properties.map((p) => [p.id, p.name]))
      const leases = leasesRes.data ?? []
      const maintenance = maintenanceRes.data ?? []
      const payments = paymentsRes.data ?? []
      const messages = messagesRes.data ?? []

      // Stat cards
      const monthlyRevenue = (monthlyPaymentsRes.data ?? []).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0
      )
      setStats({
        totalProperties: properties.length,
        activeTenants: activeLeasesCountRes.count ?? 0,
        monthlyRevenue,
        openRequests: maintenanceCountRes.count ?? 0,
      })

      // Trial days remaining from profile
      if (profileRes.data?.trial_end_date) {
        const end = new Date(profileRes.data.trial_end_date)
        const days = Math.ceil((end.getTime() - now.getTime()) / 86400000)
        setTrialDaysRemaining(days > 0 ? days : 0)
      }

      // Revenue (last 6 months)
      const months: { key: string; month: string }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({ key: format(d, "yyyy-MM"), month: format(d, "MMM") })
      }
      const expectedMonthly = leases
        .filter((l) => l.status === "active")
        .reduce((sum, l) => sum + Number(l.monthly_rent ?? 0), 0)
      setRevenueData(
        months.map((m) => ({
          month: m.month,
          collected: payments
            .filter((p) => p.payment_date?.startsWith(m.key))
            .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
          expected: expectedMonthly,
        }))
      )
      setHasRevenue(payments.length > 0)

      // Occupancy — derived from active leases and units, never from the
      // stale properties.status column.
      const unitRows = unitsRes.data ?? []
      const activeLeases = leases.filter((l: any) => l.status === "active")
      let rentable = 0
      let occupiedCount = 0

      properties.forEach((p: any) => {
        const propertyUnits = unitRows.filter((u: any) => u.property_id === p.id)
        if (propertyUnits.length > 0) {
          // Multi-unit: each unit is a rentable slot
          rentable += propertyUnits.length
          occupiedCount += propertyUnits.filter(
            (u: any) =>
              u.status === "occupied" ||
              activeLeases.some((l: any) => l.unit_id === u.id)
          ).length
        } else {
          // Single-unit: the property itself is the rentable slot
          rentable += 1
          if (activeLeases.some((l: any) => l.property_id === p.id)) {
            occupiedCount += 1
          }
        }
      })

      setOccupancy({
        occupied: occupiedCount,
        vacant: Math.max(0, rentable - occupiedCount),
        total: rentable,
      })

      // Upcoming events (rent due/overdue, confirmations, leases, maintenance, utilities)
      const events: UpcomingEvent[] = []
      const utilityBills = utilityBillsRes.data ?? []
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const money = (n: number) =>
        new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n)

      // Payments a tenant reported but the landlord hasn't confirmed yet
      payments
        .filter((p: any) => p.status === "pending")
        .forEach((p: any) => {
          const lease = leases.find((l: any) => l.id === p.lease_id)
          events.push({
            type: "rent",
            icon: eventIconByType.rent,
            title: "Confirm payment received",
            description: `${lease?.tenant_name ?? "Tenant"} reported a payment`,
            amount: money(Number(p.amount ?? 0)),
            date: p.payment_date ? new Date(p.payment_date) : today,
          })
        })

      // Rent due / overdue for each active lease this month
      leases
        .filter((l: any) => l.status === "active")
        .forEach((l: any) => {
          const dueDay = Math.min(Math.max(Number(l.payment_due_day ?? 1), 1), 28)
          const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay)
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          const paidThisPeriod = payments.some(
            (p: any) =>
              p.lease_id === l.id &&
              p.status === "completed" &&
              p.payment_date &&
              new Date(p.payment_date) >= periodStart
          )
          if (paidThisPeriod) return

          const overdue = dueThisMonth < today
          const nextDue = overdue
            ? new Date(now.getFullYear(), now.getMonth() + 1, dueDay)
            : dueThisMonth

          events.push({
            type: "rent",
            icon: eventIconByType.rent,
            title: overdue ? "Rent overdue" : "Rent due",
            description: `${l.tenant_name ?? "Tenant"} - ${
              propertyMap.get(l.property_id) ?? "Property"
            }`,
            amount: money(Number(l.monthly_rent ?? 0)),
            date: overdue ? dueThisMonth : nextDue,
          })
        })

      // Scheduled move-outs
      leases
        .filter((l: any) => l.move_out_date && l.status === "active")
        .forEach((l: any) => {
          const due = new Date(l.move_out_date)
          events.push({
            type: "lease",
            icon: eventIconByType.lease,
            title: due < today ? "Move-out due — complete it" : "Move-out scheduled",
            description: `${l.tenant_name ?? "Tenant"} - ${
              propertyMap.get(l.property_id) ?? "Property"
            }`,
            date: due,
          })
        })

      // Maintenance reminders coming due (within 45 days) or overdue
      ;(remindersRes.data ?? []).forEach((r: any) => {
        if (!r.due_date) return
        const due = new Date(r.due_date)
        const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
        if (days > 45) return
        events.push({
          type: "maintenance",
          icon: eventIconByType.maintenance,
          title: days < 0 ? "Maintenance overdue" : "Maintenance reminder",
          description: `${r.title}${
            r.property_id && propertyMap.get(r.property_id)
              ? " - " + propertyMap.get(r.property_id)
              : ""
          }`,
          date: due,
        })
      })

      // Unpaid utility bills coming due
      utilityBills.forEach((b: any) => {
        const lease = leases.find((l: any) => l.id === b.lease_id)
        if (!lease || !b.due_date) return
        const due = new Date(b.due_date)
        const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
        if (days > 45) return
        events.push({
          type: "utility",
          icon: eventIconByType.utility,
          title: days < 0 ? "Utility bill overdue" : "Utility bill due",
          description: `${String(b.utility_type ?? "Utility")} - ${
            propertyMap.get(lease.property_id) ?? "Property"
          }`,
          amount: money(Number(b.amount ?? 0)),
          date: due,
        })
      })
      leases.forEach((l) => {
        if (!l.end_date) return
        const end = new Date(l.end_date)
        const days = Math.ceil((end.getTime() - now.getTime()) / 86400000)
        if (days >= 0 && days <= 60) {
          events.push({
            type: "lease",
            icon: eventIconByType.lease,
            title: "Lease expiring",
            description: `${l.tenant_name ?? "Tenant"} - ${propertyMap.get(l.property_id) ?? "Property"}`,
            daysRemaining: days,
            date: end,
          })
        }
      })
      maintenance.forEach((m) => {
        if (!m.scheduled_date) return
        const d = new Date(m.scheduled_date)
        if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          events.push({
            type: "maintenance",
            icon: eventIconByType.maintenance,
            title: m.title,
            description: propertyMap.get(m.property_id) ?? "Property",
            date: d,
          })
        }
      })
      events.sort((a, b) => a.date.getTime() - b.date.getTime())
      setUpcomingEvents(events)

      // Leases the tenant accepted but the landlord hasn't confirmed
      const pendingLeaseConfirmCount = leases.filter(
        (l: any) => l.tenant_signed_at && !l.landlord_signed_at
      ).length

      // Group events into actionable notification categories with counts.
      const groups: NotificationGroup[] = []
      const pendingConfirm = events.filter((e) => e.title === "Confirm payment received")
      const overdueRent = events.filter((e) => e.title === "Rent overdue")
      const moveOuts = events.filter((e) => e.title.startsWith("Move-out"))
      const remindersDue = events.filter(
        (e) => e.title === "Maintenance reminder" || e.title === "Maintenance overdue"
      )
      const utilityDue = events.filter((e) => e.title.startsWith("Utility bill"))
      const leaseExpiring = events.filter((e) => e.title === "Lease expiring")

      if (pendingConfirm.length > 0)
        groups.push({ key: "confirm-payments", label: `${pendingConfirm.length} payment${pendingConfirm.length > 1 ? "s" : ""} to confirm`, count: pendingConfirm.length, href: "/landlord/payments", tone: "action" })
      if (pendingLeaseConfirmCount > 0)
        groups.push({ key: "confirm-leases", label: `${pendingLeaseConfirmCount} lease${pendingLeaseConfirmCount > 1 ? "s" : ""} to confirm`, count: pendingLeaseConfirmCount, href: "/landlord/properties", tone: "action" })
      if (overdueRent.length > 0)
        groups.push({ key: "overdue-rent", label: `${overdueRent.length} rent payment${overdueRent.length > 1 ? "s" : ""} overdue`, count: overdueRent.length, href: "/landlord/payments?filter=overdue", tone: "urgent" })
      if (moveOuts.length > 0)
        groups.push({ key: "move-outs", label: `${moveOuts.length} move-out${moveOuts.length > 1 ? "s" : ""} to review`, count: moveOuts.length, href: "/landlord/properties", tone: "action" })
      if (remindersDue.length > 0)
        groups.push({ key: "reminders", label: `${remindersDue.length} maintenance reminder${remindersDue.length > 1 ? "s" : ""} due`, count: remindersDue.length, href: "/landlord/reminders", tone: "info" })
      if (utilityDue.length > 0)
        groups.push({ key: "utilities", label: `${utilityDue.length} utility bill${utilityDue.length > 1 ? "s" : ""} due`, count: utilityDue.length, href: "/landlord/payments", tone: "info" })
      if (leaseExpiring.length > 0)
        groups.push({ key: "lease-expiring", label: `${leaseExpiring.length} lease${leaseExpiring.length > 1 ? "s" : ""} expiring soon`, count: leaseExpiring.length, href: "/landlord/properties", tone: "info" })

      // Open maintenance requests needing attention
      const openMaint = maintenanceCountRes.count ?? 0
      if (openMaint > 0)
        groups.push({ key: "maintenance", label: `${openMaint} maintenance request${openMaint > 1 ? "s" : ""} open`, count: openMaint, href: "/landlord/inbox", tone: "action" })

      setNotificationGroups(groups)

      // Recent activity (payments, leases, maintenance, messages)
      const activity: ActivityItem[] = []
      payments.forEach((p) => {
        activity.push({
          type: "payment",
          description: "Payment received",
          property: propertyMap.get(p.property_id) ?? "",
          amount: formatCurrency(Number(p.amount ?? 0)),
          time: p.created_at ? formatRelativeTime(p.created_at) : "",
          sortDate: p.created_at ? new Date(p.created_at).getTime() : 0,
        })
      })
      leases.forEach((l) => {
        const actionText = l.status === "active" && l.tenant_signed_at
    ? `Lease signed by ${l.tenant_name ?? "tenant"}`
    : `Lease created by ${l.created_by_name ?? l.landlord_name ?? "you"} for ${l.tenant_name}` ; ""}
        activity.push({
          type: "lease",
          description: `Lease ${l.status === "active" ? "signed" : "created"}${
            l.tenant_name ? ` by ${l.tenant_name}` : ""
          }`,
          property: propertyMap.get(l.property_id) ?? "",
          time: l.created_at ? formatRelativeTime(l.created_at) : "",
          sortDate: l.created_at ? new Date(l.created_at).getTime() : 0,
        })
      })
      maintenance.forEach((m) => {
        activity.push({
          type: "maintenance",
          description: "Maintenance request submitted",
          title: m.title,
          property: propertyMap.get(m.property_id) ?? "",
          time: m.created_at ? formatRelativeTime(m.created_at) : "",
          sortDate: m.created_at ? new Date(m.created_at).getTime() : 0,
        })
      })
      messages.forEach((msg) => {
        activity.push({
          type: "message",
          description: "New message",
          property: msg.subject ?? "",
          time: msg.created_at ? formatRelativeTime(msg.created_at) : "",
          sortDate: msg.created_at ? new Date(msg.created_at).getTime() : 0,
        })
      })
      activity.sort((a, b) => b.sortDate - a.sortDate)
      setRecentActivity(activity.slice(0, 5))

      // Onboarding checklist
      setChecklist([
        { id: "account", label: "Account created", completed: true },
        {
          id: "profile",
          label: "Complete your profile",
          completed: !!profileRes.data?.profile_completed,
        },
        { id: "property", label: "Add your first property", completed: properties.length > 0 },
        { id: "lease", label: "Create your first lease", completed: leases.length > 0 },
        {
          id: "tenant",
          label: "Invite your first tenant",
          completed: leases.some((l) => l.tenant_id || l.invitation_sent_at),
        },
        {
          id: "payment",
          label: "Set up payment details",
          completed: (paymentConfigRes.data?.length ?? 0) > 0,
        },
      ])

      setLoading(false)
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const occupancyData = [
    { name: "Occupied", value: occupancy.occupied, color: "var(--success)" },
    { name: "Vacant", value: occupancy.vacant, color: "var(--sage)" },
  ]
  const occupancyPercent = occupancy.total > 0 ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0

  const completedSteps = checklist.filter((item) => item.completed).length
  const totalSteps = checklist.length
  const showChecklist = totalSteps > 0 && completedSteps < totalSteps

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {trialDaysRemaining <= 7 && trialDaysRemaining > 0 && (
        <TrialBanner daysRemaining={trialDaysRemaining} />
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Properties"
          value={loading ? "—" : stats.totalProperties}
        />
        <StatCard
          label="Active Tenants"
          value={loading ? "—" : stats.activeTenants}
        />
        <StatCard
          label="Monthly Revenue"
          value={loading ? "—" : formatCurrency(stats.monthlyRevenue)}
        />
        <StatCard
          label="Open Maintenance"
          value={loading ? "—" : stats.openRequests}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-navy">Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && !hasRevenue ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-text-muted">No data yet</p>
              </div>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "var(--white)",
                          border: "1px solid var(--sage)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="expected" fill="var(--sage)" radius={[4, 4, 0, 0]} name="Expected" />
                      <Bar dataKey="collected" fill="var(--teal)" radius={[4, 4, 0, 0]} name="Collected" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-sage" />
                    <span className="text-text-muted">Expected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-teal" />
                    <span className="text-text-muted">Collected</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-navy">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && occupancy.total === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-text-muted">No data yet</p>
              </div>
            ) : (
              <>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occupancyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {occupancyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-sm text-text-muted">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-4">
                  <p className="text-3xl font-medium text-navy">{occupancyPercent}%</p>
                  <p className="text-sm text-text-muted">{occupancy.occupied} of {occupancy.total} properties occupied</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events & Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-navy">Notifications</CardTitle>
            {notificationGroups.length > 0 && (
              <span className="text-xs font-medium text-white bg-teal rounded-full px-2 py-0.5">
                {notificationGroups.reduce((sum, g) => sum + g.count, 0)}
              </span>
            )}
          </CardHeader>
          <CardContent>
            {!loading && notificationGroups.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center mx-auto mb-2">
                  <Check className="h-5 w-5 text-teal" />
                </div>
                <p className="text-sm text-text-muted">You&apos;re all caught up</p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {notificationGroups.map((g) => (
                  <li key={g.key}>
                    <Link
                      href={g.href}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-sage/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold",
                            g.tone === "urgent" && "bg-destructive/15 text-destructive",
                            g.tone === "action" && "bg-teal/15 text-teal",
                            g.tone === "info" && "bg-sage/40 text-navy"
                          )}
                        >
                          {g.count}
                        </span>
                        <span className="text-sm text-navy truncate">{g.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-navy flex-shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-navy">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!loading && recentActivity.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No data yet</p>
            ) : (
              <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {recentActivity.map((activity, index) => (
                  <li key={index} className="flex items-start gap-3 py-2 border-b border-sage/50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-sage/30 flex items-center justify-center flex-shrink-0">
                      {activity.type === "payment" && <DollarSign className="h-4 w-4 text-navy" />}
                      {activity.type === "lease" && <FileText className="h-4 w-4 text-navy" />}
                      {activity.type === "maintenance" && <Wrench className="h-4 w-4 text-navy" />}
                      {activity.type === "message" && <MessageSquare className="h-4 w-4 text-navy" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{activity.description}</p>
                      <p className="text-xs text-text-muted">{activity.property}</p>
                      {activity.amount && (
                        <p className="text-xs font-medium text-teal">{activity.amount}</p>
                      )}
                    </div>
                    <span className="text-xs text-text-muted whitespace-nowrap">{activity.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Checklist Row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Onboarding Checklist */}
        {showChecklist && (
          <Card className="border-[0.5px] border-sage">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-navy">Getting Started</CardTitle>
              <p className="text-sm text-text-muted">{completedSteps} of {totalSteps} complete</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    {item.completed ? (
                      <div className="w-5 h-5 rounded-full bg-teal flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-sage" />
                    )}
                    <span className={cn(
                      "text-sm",
                      item.completed ? "text-text-muted line-through" : "text-text-primary"
                    )}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions — full width across the bottom */}
      <Card className="border-[0.5px] border-sage">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-navy">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
              asChild
            >
              <Link href="/landlord/properties/add">
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Add Property</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
              asChild
            >
              <Link href="/landlord/leases/create">
                <Plus className="h-5 w-5" />
                <span className="text-sm">Create Lease</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
              asChild
            >
              <Link href="/landlord/payments?record=1">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Record Payment</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
              asChild
            >
              <Link href="/landlord/reminders?add=1">
                <Bell className="h-5 w-5" />
                <span className="text-sm">Reminders</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
              asChild
            >
              <Link href="/landlord/inbox?tab=maintenance">
                <Wrench className="h-5 w-5" />
                <span className="text-sm">Maintenance</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
