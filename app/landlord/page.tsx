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
  Search,
  Calendar,
  CreditCard,
  MessageSquare,
  Check,
  Circle,
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

// Mock data
const revenueData = [
  { month: "Jan", collected: 7200, expected: 7500 },
  { month: "Feb", collected: 7500, expected: 7500 },
  { month: "Mar", collected: 7350, expected: 7500 },
  { month: "Apr", collected: 7500, expected: 7500 },
  { month: "May", collected: 7200, expected: 7500 },
  { month: "Jun", collected: 5100, expected: 7500 },
]

const occupancyData = [
  { name: "Occupied", value: 4, color: "var(--success)" },
  { name: "Vacant", value: 1, color: "var(--sage)" },
]

const upcomingEvents = [
  {
    type: "rent",
    icon: DollarSign,
    title: "Rent due",
    description: "Michael Chen - Unit 2A",
    amount: "$2,150.00",
    date: new Date(2026, 5, 1),
  },
  {
    type: "lease",
    icon: FileText,
    title: "Lease expiring",
    description: "Emma Wilson - Main St House",
    daysRemaining: 28,
    date: new Date(2026, 5, 29),
  },
  {
    type: "maintenance",
    icon: Wrench,
    title: "HVAC inspection",
    description: "Downtown Condo - TechPro Services",
    date: new Date(2026, 5, 3),
  },
  {
    type: "rent",
    icon: DollarSign,
    title: "Rent due",
    description: "James Park - Downtown Condo",
    amount: "$2,580.00",
    date: new Date(2026, 5, 1),
  },
  {
    type: "utility",
    icon: CreditCard,
    title: "Utility bill due",
    description: "Hydro - Main St Duplex",
    amount: "$245.00",
    date: new Date(2026, 5, 15),
  },
]

const recentActivity = [
  {
    type: "payment",
    description: "Payment received from Sarah Johnson",
    property: "Oak Street Apartment",
    amount: "$1,850.00",
    time: "2 hours ago",
  },
  {
    type: "lease",
    description: "Lease signed by Michael Chen",
    property: "Unit 2A",
    time: "Yesterday",
  },
  {
    type: "maintenance",
    description: "Maintenance request submitted",
    title: "Leaky faucet in bathroom",
    property: "Main St House",
    time: "Yesterday",
  },
  {
    type: "message",
    description: "New message from Emma Wilson",
    property: "Main St House",
    time: "2 days ago",
  },
  {
    type: "payment",
    description: "Payment received from James Park",
    property: "Downtown Condo",
    amount: "$2,580.00",
    time: "3 days ago",
  },
]

const onboardingChecklist = [
  { id: "account", label: "Account created", completed: true },
  { id: "profile", label: "Complete your profile", completed: true },
  { id: "property", label: "Add your first property", completed: true },
  { id: "lease", label: "Create your first lease", completed: false },
  { id: "tenant", label: "Invite your first tenant", completed: false },
  { id: "payment", label: "Set up payment details", completed: false },
]

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

export default function LandlordDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const trialDaysRemaining = 5

  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    openRequests: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadStats() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) setStatsLoading(false)
        return
      }

      // First and last day of the current month (for payment_date filtering)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const monthStartStr = format(monthStart, "yyyy-MM-dd")
      const monthEndStr = format(monthEnd, "yyyy-MM-dd")

      const [propertiesRes, leasesRes, paymentsRes, maintenanceRes] = await Promise.all([
        supabase
          .from("properties")
          .select("id", { count: "exact", head: true })
          .eq("landlord_id", user.id),
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
      ])

      const monthlyRevenue = (paymentsRes.data ?? []).reduce(
        (sum, payment) => sum + (payment.amount ?? 0),
        0
      )

      if (isMounted) {
        setStats({
          totalProperties: propertiesRes.count ?? 0,
          activeTenants: leasesRes.count ?? 0,
          monthlyRevenue,
          openRequests: maintenanceRes.count ?? 0,
        })
        setStatsLoading(false)
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  const completedSteps = onboardingChecklist.filter((item) => item.completed).length
  const totalSteps = onboardingChecklist.length
  const showChecklist = completedSteps < totalSteps

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {trialDaysRemaining <= 7 && trialDaysRemaining > 0 && (
        <TrialBanner daysRemaining={trialDaysRemaining} />
      )}

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          type="search"
          placeholder="Search properties, tenants, leases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-sage focus:ring-teal"
        />
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Properties"
          value={statsLoading ? "—" : stats.totalProperties}
        />
        <StatCard
          label="Active Tenants"
          value={statsLoading ? "—" : stats.activeTenants}
        />
        <StatCard
          label="Monthly Revenue"
          value={statsLoading ? "—" : formatCurrency(stats.monthlyRevenue)}
        />
        <StatCard
          label="Open Maintenance"
          value={statsLoading ? "—" : stats.openRequests}
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
          </CardContent>
        </Card>

        {/* Occupancy Chart */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-navy">Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
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
              <p className="text-3xl font-medium text-navy">80%</p>
              <p className="text-sm text-text-muted">4 of 5 units occupied</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events & Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-navy">Upcoming Events</CardTitle>
            <Link href="/landlord/calendar" className="text-sm text-teal hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event, index) => (
                <li key={index} className="flex items-start gap-3 py-2 border-b border-sage/50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-sage/30 flex items-center justify-center flex-shrink-0">
                    <event.icon className="h-4 w-4 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy">{event.title}</p>
                    <p className="text-xs text-text-muted truncate">{event.description}</p>
                    {event.amount && (
                      <p className="text-xs font-medium text-teal">{event.amount}</p>
                    )}
                    {event.daysRemaining !== undefined && (
                      <p className={cn(
                        "text-xs font-medium",
                        event.daysRemaining < 30 ? "text-destructive" : "text-text-muted"
                      )}>
                        {event.daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Calendar className="h-3 w-3" />
                    {formatDate(event.date)}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-navy">Recent Activity</CardTitle>
            <Link href="/landlord/activity" className="text-sm text-teal hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
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
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Checklist Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-[0.5px] border-sage">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-navy">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
                asChild
              >
                <Link href="/landlord/properties/new">
                  <Building2 className="h-5 w-5" />
                  <span className="text-sm">Add Property</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
                asChild
              >
                <Link href="/landlord/leases/new">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm">Create Lease</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 border-navy/20 text-navy hover:bg-navy/5"
                asChild
              >
                <Link href="/landlord/maintenance">
                  <Wrench className="h-5 w-5" />
                  <span className="text-sm">Maintenance</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Checklist */}
        {showChecklist && (
          <Card className="border-[0.5px] border-sage">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-navy">Getting Started</CardTitle>
              <p className="text-sm text-text-muted">{completedSteps} of {totalSteps} complete</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {onboardingChecklist.map((item) => (
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
    </div>
  )
}
