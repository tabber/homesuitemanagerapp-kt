"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  Eye,
  Users,
  MoreHorizontal,
  AlertTriangle,
  Building2,
  Calendar,
  Mail,
  Phone,
  ArrowLeft,
  Clock,
  Ban,
  Trash2,
} from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Landlord {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: "active" | "pending" | "expired"
  plan: string
  properties: number
  tenants: number
  joinedAt: string
  billingDate: string
  monthlyAmount: number
  activityLog: { date: string; action: string }[]
  supportNotes: string
}

// Map a raw subscription_status to the UI status/plan used by this page
function deriveStatus(subscriptionStatus: string | null): "active" | "pending" | "expired" {
  const s = (subscriptionStatus ?? "").toLowerCase()
  if (s === "active") return "active"
  if (s === "trial" || s === "trialing") return "pending"
  return "expired"
}

function derivePlan(status: "active" | "pending" | "expired"): string {
  if (status === "active") return "Essential"
  if (status === "pending") return "Trial"
  return "Expired"
}

export default function AdminLandlords() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [landlords, setLandlords] = useState<Landlord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null)
  const [supportNotes, setSupportNotes] = useState("")
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadLandlords() {
      const supabase = createClient()

      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id, email, first_name, last_name, phone, subscription_status, trial_end_date, created_at"
        )
        .eq("role", "landlord")
        .order("created_at", { ascending: false })

      const profileRows = profiles ?? []
      const landlordIds = profileRows.map((p: any) => p.id)

      // Count properties and tenants per landlord
      const propertyCounts = new Map<string, number>()
      const tenantSets = new Map<string, Set<string>>()

      if (landlordIds.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("landlord_id")
          .in("landlord_id", landlordIds)
        ;(props ?? []).forEach((row: any) => {
          if (!row.landlord_id) return
          propertyCounts.set(row.landlord_id, (propertyCounts.get(row.landlord_id) ?? 0) + 1)
        })

        const { data: leases } = await supabase
          .from("leases")
          .select("landlord_id, tenant_id")
          .in("landlord_id", landlordIds)
        ;(leases ?? []).forEach((row: any) => {
          if (!row.landlord_id || !row.tenant_id) return
          if (!tenantSets.has(row.landlord_id)) tenantSets.set(row.landlord_id, new Set())
          tenantSets.get(row.landlord_id)!.add(row.tenant_id)
        })
      }

      const formatDate = (value: string | null) =>
        value
          ? new Date(value).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N/A"

      const mapped: Landlord[] = profileRows.map((p: any) => {
        const status = deriveStatus(p.subscription_status)
        return {
          id: p.id,
          firstName: p.first_name ?? "",
          lastName: p.last_name ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "—",
          status,
          plan: derivePlan(status),
          properties: propertyCounts.get(p.id) ?? 0,
          tenants: tenantSets.get(p.id)?.size ?? 0,
          joinedAt: formatDate(p.created_at),
          billingDate: formatDate(p.trial_end_date),
          monthlyAmount: 0,
          activityLog: [],
          supportNotes: "",
        }
      })

      if (!isMounted) return
      setLandlords(mapped)
      setLoading(false)
    }

    loadLandlords()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredLandlords = landlords.filter((landlord) => {
    const matchesSearch =
      landlord.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landlord.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landlord.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || landlord.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  const getStatusBadgeStatus = (status: string) => {
    if (status === "active") return "active"
    if (status === "pending") return "pending"
    return "expired"
  }

  if (selectedLandlord) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setSelectedLandlord(null)}
          className="text-navy hover:bg-sage/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Landlords
        </Button>

        {/* Landlord Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-sage-light">
              <AvatarFallback className="bg-sage-light text-navy text-xl">
                {(selectedLandlord.firstName[0] ?? "") + (selectedLandlord.lastName[0] ?? "") ||
                  selectedLandlord.email[0]?.toUpperCase() ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-medium text-navy">
                  {`${selectedLandlord.firstName} ${selectedLandlord.lastName}`.trim() || "Unnamed"}
                </h1>
                <StatusBadge status={getStatusBadgeStatus(selectedLandlord.status)} />
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {selectedLandlord.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {selectedLandlord.phone}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-teal text-teal hover:bg-teal/10"
            >
              <Users className="h-4 w-4 mr-2" />
              Impersonate
            </Button>
            {selectedLandlord.status === "pending" && (
              <Button
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
              >
                <Clock className="h-4 w-4 mr-2" />
                Extend Trial
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Properties"
            value={selectedLandlord.properties}
          />
          <StatCard
            label="Tenants"
            value={selectedLandlord.tenants}
          />
          <StatCard
            label="Plan"
            value={selectedLandlord.plan}
          />
          <StatCard
            label="Monthly"
            value={selectedLandlord.monthlyAmount > 0 ? formatCurrency(selectedLandlord.monthlyAmount) : "Trial"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscription */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Plan
                  </p>
                  <p className="text-sm font-medium text-navy">
                    {selectedLandlord.plan}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Billing Amount
                  </p>
                  <p className="text-sm font-medium text-navy">
                    {selectedLandlord.monthlyAmount > 0
                      ? `${formatCurrency(selectedLandlord.monthlyAmount)}/mo`
                      : "Free Trial"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Next Billing
                  </p>
                  <p className="text-sm font-medium text-navy">
                    {selectedLandlord.billingDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                    Joined
                  </p>
                  <p className="text-sm font-medium text-navy">
                    {selectedLandlord.joinedAt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Properties */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Properties ({selectedLandlord.properties})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted">
                This landlord manages {selectedLandlord.properties} properties
                with {selectedLandlord.tenants} tenants.
              </p>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedLandlord.activityLog.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-sage/30 last:border-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-teal mt-2" />
                    <div>
                      <p className="text-sm text-navy">{activity.action}</p>
                      <p className="text-xs text-text-muted">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Support Notes */}
          <Card className="border-sage/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-navy">
                Support Notes (Admin Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={supportNotes || selectedLandlord.supportNotes}
                onChange={(e) => setSupportNotes(e.target.value)}
                placeholder="Add notes about this landlord..."
                rows={4}
              />
              <Button className="bg-teal hover:bg-teal-dark text-white">
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
                onClick={() => setShowSuspendDialog(true)}
              >
                <Ban className="h-4 w-4 mr-2" />
                Suspend Account
              </Button>
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Suspend Dialog */}
        <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to suspend this landlord&apos;s account?
                They will lose access to their dashboard until reactivated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-warning hover:bg-warning/90">
                Suspend
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                landlord&apos;s account and all associated data including
                properties, leases, and tenant information.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-medium text-navy">Landlords</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage all landlord accounts on the platform
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search landlords..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Landlords Table */}
      <Card className="border-sage/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Landlord</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Tenants</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-text-muted py-8">
                    Loading landlords...
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredLandlords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-text-muted py-8">
                    No landlords found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && filteredLandlords.map((landlord) => (
                <TableRow key={landlord.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-sage-light">
                        <AvatarFallback className="bg-sage-light text-navy text-xs">
                          {(landlord.firstName[0] ?? "") + (landlord.lastName[0] ?? "") ||
                            landlord.email[0]?.toUpperCase() ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-navy">
                        {`${landlord.firstName} ${landlord.lastName}`.trim() || "Unnamed"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {landlord.email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getStatusBadgeStatus(landlord.status)} />
                  </TableCell>
                  <TableCell className="text-sm text-navy">{landlord.plan}</TableCell>
                  <TableCell className="text-sm text-navy">
                    {landlord.properties}
                  </TableCell>
                  <TableCell className="text-sm text-navy">
                    {landlord.tenants}
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {landlord.joinedAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setSelectedLandlord(landlord)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-warning">
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
