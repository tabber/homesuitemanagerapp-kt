"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Home,
  Building2,
  Plus,
  ChevronDown,
  Pencil,
  MessageSquare,
  Search,
  Filter,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { EmptyState } from "@/components/empty-state"
import { LockedFeature } from "@/components/locked-feature"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Property } from "@/lib/supabase/types"

// Live data is fetched from Supabase inside the component

const CANADIAN_PROVINCES = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
]

const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
  { value: "building", label: "Building" },
]

const PROPERTY_STATUSES = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
]

export default function PropertiesPage() {
  const router = useRouter()
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  // Real properties for the switcher dropdown
  const [dbProperties, setDbProperties] = useState<Property[]>([])
  // Aggregated unit stats for the selected property's stat cards
  const [unitStats, setUnitStats] = useState({
    totalUnits: 0,
    occupied: 0,
    vacant: 0,
    monthlyRevenue: 0,
  })

  // Per-property tab data (lease / tenant / payments / maintenance)
  const [activeLease, setActiveLease] = useState<any | null>(null)
  const [tenantProfile, setTenantProfile] = useState<any | null>(null)
  const [propertyPayments, setPropertyPayments] = useState<any[]>([])
  const [propertyMaintenance, setPropertyMaintenance] = useState<any[]>([])

  const [userId, setUserId] = useState<string | null>(null)

  // Edit Property/Building modal
  const [editOpen, setEditOpen] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    property_type: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    status: "",
  })

  const loadProperties = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    setUserId(user.id)

    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: true })

    if (data) {
      setDbProperties(data as Property[])
      // Keep the current selection on refresh; only default on first load
      setSelectedPropertyId((prev) => prev || (data.length > 0 ? data[0].id : ""))
    }
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    let isMounted = true

    async function loadUnitStats() {
      // Reset to zeros before each fetch so missing data shows 0
      if (isMounted) {
        setUnitStats({ totalUnits: 0, occupied: 0, vacant: 0, monthlyRevenue: 0 })
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("units")
        .select("status, rent_amount")
        .eq("property_id", selectedPropertyId)

      // If the units table doesn't exist or has no rows, keep zeros
      if (error || !data || !isMounted) return

      const occupied = data.filter((u) => u.status === "occupied").length
      const vacant = data.filter((u) => u.status === "vacant").length
      const monthlyRevenue = data
        .filter((u) => u.status === "occupied")
        .reduce((sum, u) => sum + (u.rent_amount ?? 0), 0)

      setUnitStats({
        totalUnits: data.length,
        occupied,
        vacant,
        monthlyRevenue,
      })
    }

    loadUnitStats()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let isMounted = true

    async function loadPropertyTabs() {
      // Reset so missing data shows empty states
      if (isMounted) {
        setActiveLease(null)
        setTenantProfile(null)
        setPropertyPayments([])
        setPropertyMaintenance([])
      }

      if (!selectedPropertyId) return

      const supabase = createClient()

      // Lease tab: active lease for this property
      const { data: leaseRow } = await supabase
        .from("leases")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle()

      // Tenant tab: profile referenced by the active lease
      let tenant: any | null = null
      if (leaseRow?.tenant_id) {
        const { data: tenantRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", leaseRow.tenant_id)
          .maybeSingle()
        tenant = tenantRow ?? null
      }

      // Payments tab: recent payments for this property
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .order("created_at", { ascending: false })
        .limit(10)

      // Maintenance tab: requests for this property
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .order("created_at", { ascending: false })

      if (!isMounted) return

      setActiveLease(leaseRow ?? null)
      setTenantProfile(tenant)
      setPropertyPayments(payments ?? [])
      setPropertyMaintenance(maintenance ?? [])
    }

    loadPropertyTabs()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyId])

const selectedProperty = dbProperties.find((p) => p.id === selectedPropertyId) ?? dbProperties[0] ?? null
  const isApartment = selectedProperty?.type === "apartment" ?? false
const selectedUnit = isApartment && selectedUnitId
  ? selectedProperty?.units?.find((u: any) => u.id === selectedUnitId)
  : null
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

  const openEditModal = () => {
    const p = selectedProperty as any
    if (!p) return
    setEditForm({
      name: p.name ?? "",
      description: p.description ?? "",
      property_type: p.property_type ?? "",
      address: p.address ?? "",
      city: p.city ?? "",
      province: p.province ?? "",
      postal_code: p.postal_code ?? "",
      status: p.status ?? "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedPropertyId || savingEdit) return
    setSavingEdit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("properties")
      .update({
        name: editForm.name,
        description: editForm.description,
        property_type: editForm.property_type,
        address: editForm.address,
        city: editForm.city,
        province: editForm.province,
        postal_code: editForm.postal_code,
        status: editForm.status,
      })
      .eq("id", selectedPropertyId)
    setSavingEdit(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Property updated")
    setEditOpen(false)
    loadProperties()
  }

  // Single unit property view — JSX built inline (not a nested component) so it
  // is not redefined on each render and uses the parent's state/hooks directly.
  const property = selectedProperty as any
  const lease = activeLease
  const tenant = tenantProfile
  const payments = propertyPayments
  const maintenance = propertyMaintenance
  const tenantName =
    [tenant?.first_name, tenant?.last_name].filter(Boolean).join(" ").trim() ||
    lease?.tenant_name ||
    ""
  const openRequestsCount = maintenance.filter((m: any) => m.status === "open").length
  // Occupancy is derived: an active lease means the property is occupied,
  // otherwise fall back to the stored status.
  const derivedStatus = activeLease ? "occupied" : (selectedProperty as any)?.status

  const singleUnitView =
    selectedProperty && !isApartment ? (
      <div className="space-y-6">
        {/* Property Header Card */}
        <Card className="border-sage/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center">
                  <Home className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-medium text-navy">{property.name}</h2>
                    <StatusBadge status={derivedStatus} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">{property.address}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-navy/20 text-navy hover:bg-navy/5"
                onClick={openEditModal}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Monthly Rent"
            value={formatCurrency(lease?.monthly_rent ?? property.rent_amount ?? 0)}
          />
          <StatCard
            label="Lease Status"
            value={lease ? "Active" : "No Lease"}
            sublabel={lease ? `Ends ${formatDate(lease.end_date)}` : undefined}
          />
          <StatCard
            label="Open Requests"
            value={openRequestsCount}
          />
          <StatCard
            label="Last Payment"
            value={payments[0] ? formatDate(payments[0].payment_date) : "N/A"}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lease" className="w-full">
          <TabsList className="bg-sage/20 border border-sage/30">
            <TabsTrigger value="lease" className="data-[state=active]:bg-white data-[state=active]:text-navy">Lease</TabsTrigger>
            <TabsTrigger value="tenant" className="data-[state=active]:bg-white data-[state=active]:text-navy">Tenant</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-navy">Payments</TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:text-navy">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="lease" className="mt-6">
            {lease ? (
              <Card className="border-sage/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-navy">Current Lease</CardTitle>
                    <StatusBadge status={lease.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-muted">Tenant</p>
                      <p className="text-sm font-medium text-navy">{tenantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Lease Period</p>
                      <p className="text-sm font-medium text-navy">
                        {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Monthly Rent</p>
                      <p className="text-sm font-medium text-navy">{formatCurrency(lease.monthly_rent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Security Deposit</p>
                      <p className="text-sm font-medium text-navy">{formatCurrency(lease.security_deposit ?? 0)}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button className="bg-teal hover:bg-teal-dark text-white">
                      View Lease Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={Home}
                title="No Active Lease"
                description="This property doesn&apos;t have an active lease. Create one to start managing your rental."
                actionLabel="Create Lease"
                onAction={() => router.push("/landlord/leases/create")}
              />
            )}
          </TabsContent>

          <TabsContent value="tenant" className="mt-6">
            {tenant ? (
              <Card className="border-sage/50">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-navy">Tenant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-medium">
                      {tenantName.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-navy">{tenantName}</h3>
                      <p className="text-sm text-text-muted">{tenant.email}</p>
                      <p className="text-sm text-text-muted">{tenant.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sage/30">
                    <div>
                      <p className="text-sm text-text-muted">Lease Period</p>
                      <p className="text-sm font-medium text-navy">
                        {lease && `${formatDate(lease.start_date)} - ${formatDate(lease.end_date)}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Payment Status (This Month)</p>
                      <StatusBadge status="completed" />
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button className="bg-teal hover:bg-teal-dark text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Tenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={Home}
                title="No Tenant"
                description="This property doesn&apos;t have a tenant yet. Create a lease to add one."
                actionLabel="Create Lease"
                onAction={() => router.push("/landlord/leases/create")}
              />
            )}
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card className="border-sage/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">Payment History</CardTitle>
                  <Button className="bg-teal hover:bg-teal-dark text-white" disabled>
                    Record Payment
                    <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">Essential</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Table>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium text-navy">{tenantName || "—"}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.payment_date)}</TableCell>
                          <TableCell>{payment.payment_method ?? "—"}</TableCell>
                          <TableCell><StatusBadge status={payment.status} /></TableCell>
                        </TableRow>
                      ))}
                    </Table>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Home}
                    title="No Payments Yet"
                    description="Payment history will appear here once rent is collected."
                  />
                )}
                <div className="mt-4 pt-4 border-t border-sage/30">
                  <p className="text-sm text-text-muted">Payment Due Day: 1st of each month</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <Card className="border-sage/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">Maintenance Requests</CardTitle>
                  <Button className="bg-teal hover:bg-teal-dark text-white">
                    Create Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] border-sage">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px] border-sage">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {maintenance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Table>
                      {maintenance.map((request: any) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-sage/10">
                          <TableCell className="font-medium text-navy">{request.title}</TableCell>
                          <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                          <TableCell><StatusBadge status={request.status} /></TableCell>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </Table>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    title="No Maintenance Requests"
                    description="Maintenance requests for this property will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    ) : null

  // Multi-unit building view
  const MultiUnitBuildingView = () => {
    const property = selectedProperty as any
    const occupiedCount = property.units?.filter((u) => u.status === "occupied").length || 0
    const vacantCount = property.units?.filter((u) => u.status === "vacant").length || 0
    const maintenanceCount = property.units?.filter((u) => u.status === "maintenance").length || 0
    const totalRevenue = property.units?.filter((u) => u.status === "occupied").reduce((sum, u) => sum + u.rent, 0) || 0
    
    // Group units by floor
    const floors = property.units?.reduce((acc, unit) => {
      if (!acc[unit.floor]) acc[unit.floor] = []
      acc[unit.floor].push(unit)
      return acc
    }, {} as Record<number, typeof property.units>) || {}

    if (selectedUnit) {
      // Unit Detail View
      return (
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setSelectedUnitId(null)}
              className="text-teal hover:text-teal-dark"
            >
              Properties
            </button>
            <span className="text-text-muted">/</span>
            <button
              onClick={() => setSelectedUnitId(null)}
              className="text-teal hover:text-teal-dark"
            >
              {property.name}
            </button>
            <span className="text-text-muted">/</span>
            <span className="text-navy">Unit {selectedUnit.number}</span>
          </div>

          <Button
            variant="outline"
            onClick={() => setSelectedUnitId(null)}
            className="border-navy/20 text-navy hover:bg-navy/5"
          >
            Back to Building Overview
          </Button>

          {/* Unit Header */}
          <Card className="border-sage/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-medium text-navy">Unit {selectedUnit.number}</h2>
                    <StatusBadge status={selectedUnit.status} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {selectedUnit.bedrooms} bed / {selectedUnit.bathrooms} bath - Floor {selectedUnit.floor}
                  </p>
                </div>
                <Button variant="outline" className="border-navy/20 text-navy hover:bg-navy/5">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Unit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label="Monthly Rent"
              value={formatCurrency(selectedUnit.rent)}
            />
            <StatCard
              label="Lease Status"
              value={selectedUnit.tenant ? "Active" : "No Lease"}
            />
            <StatCard
              label="Open Requests"
              value={0}
            />
            <StatCard
              label="Last Payment"
              value="N/A"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="lease" className="w-full">
            <TabsList className="bg-sage/20 border border-sage/30">
              <TabsTrigger value="lease" className="data-[state=active]:bg-white data-[state=active]:text-navy">Lease</TabsTrigger>
              <TabsTrigger value="tenant" className="data-[state=active]:bg-white data-[state=active]:text-navy">Tenant</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-navy">Payments</TabsTrigger>
              <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:text-navy">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="lease" className="mt-6">
              {selectedUnit.tenant ? (
                <Card className="border-sage/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-navy">Current Lease</CardTitle>
                      <StatusBadge status="active" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-text-muted">Tenant</p>
                        <p className="text-sm font-medium text-navy">{selectedUnit.tenant}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Monthly Rent</p>
                        <p className="text-sm font-medium text-navy">{formatCurrency(selectedUnit.rent)}</p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button className="bg-teal hover:bg-teal-dark text-white">
                        View Lease Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={Home}
                  title="No Active Lease"
                  description="This unit doesn&apos;t have an active lease. Create one to start renting."
                  actionLabel="Create Lease"
                  onAction={() => router.push("/landlord/leases/create")}
                />
              )}
            </TabsContent>

            <TabsContent value="tenant" className="mt-6">
              {selectedUnit.tenant ? (
                <Card className="border-sage/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-navy">Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-medium">
                        {selectedUnit.tenant.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-navy">{selectedUnit.tenant}</h3>
                        <p className="text-sm text-text-muted">Unit {selectedUnit.number}</p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button className="bg-teal hover:bg-teal-dark text-white">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Tenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={Home}
                  title="No Tenant"
                  description="This unit doesn&apos;t have a tenant yet."
                />
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <Card className="border-sage/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-navy">Payment History</CardTitle>
                    <Button className="bg-teal hover:bg-teal-dark text-white" disabled>
                      Record Payment
                      <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">Essential</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Home}
                    title="No Payments Yet"
                    description="Payment history will appear here once rent is collected."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <Card className="border-sage/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-navy">Maintenance Requests</CardTitle>
                  <Button
                    onClick={() => router.push("/landlord/inbox?tab=maintenance")}> 
                     Create Request
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Wrench}
                    title="No Maintenance Requests"
                    description="Maintenance requests for this unit will appear here."
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    // Building Overview
    return (
      <div className="space-y-6">
        {/* Property Header Card */}
        <Card className="border-sage/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-navy" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-medium text-navy">{property.name}</h2>
                    <StatusBadge status={derivedStatus} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">{property.address}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-navy/20 text-navy hover:bg-navy/5"
                onClick={openEditModal}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Building
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Units"
            value={property.totalUnits || 0}
          />
          <StatCard
            label="Occupied"
            value={occupiedCount}
            sublabel={`${Math.round((occupiedCount / (property.totalUnits || 1)) * 100)}% occupancy`}
          />
          <StatCard
            label="Vacant"
            value={vacantCount}
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(totalRevenue)}
          />
        </div>

        {/* Occupancy Grid */}
        <Card className="border-sage/50">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-navy">Occupancy Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/20 border border-success" />
                <span className="text-text-muted">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-sage/30 border border-sage" />
                <span className="text-text-muted">Vacant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                <span className="text-text-muted">Maintenance</span>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(floors).sort(([a], [b]) => Number(b) - Number(a)).map(([floor, units]) => (
                <div key={floor} className="flex items-center gap-4">
                  <span className="text-sm text-text-muted w-16">Floor {floor}</span>
                  <div className="flex gap-2">
                    {units.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => setSelectedUnitId(unit.id)}
                        className={cn(
                          "w-14 h-14 rounded-lg flex items-center justify-center text-sm font-medium transition-all hover:scale-105",
                          unit.status === "occupied" && "bg-success/20 border border-success text-success",
                          unit.status === "vacant" && "bg-sage/30 border border-sage text-text-muted",
                          unit.status === "maintenance" && "bg-orange-100 border border-orange-300 text-orange-600"
                        )}
                      >
                        {unit.number}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="units" className="w-full">
          <TabsList className="bg-sage/20 border border-sage/30">
            <TabsTrigger value="units" className="data-[state=active]:bg-white data-[state=active]:text-navy">Units</TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-white data-[state=active]:text-navy">Financials</TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:text-navy">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-6">
            <Card className="border-sage/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Floor</TableHead>
                      <TableHead>Bed/Bath</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.units?.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium text-navy">{unit.number}</TableCell>
                        <TableCell>{unit.floor}</TableCell>
                        <TableCell>{unit.bedrooms} / {unit.bathrooms}</TableCell>
                        <TableCell>{unit.tenant || "—"}</TableCell>
                        <TableCell>{formatCurrency(unit.rent)}</TableCell>
                        <TableCell><StatusBadge status={unit.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUnitId(unit.id)}
                              className="border-navy/20 text-navy hover:bg-navy/5"
                            >
                              View
                            </Button>
                            {unit.status === "vacant" && (
                              <Button
                                size="sm"
                                onClick={() => router.push("/landlord/leases/create")}
                                className="bg-teal hover:bg-teal-dark text-white"
                              >
                                Create Lease
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="mt-6">
            <Card className="border-sage/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-navy">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-text-muted">Potential Monthly Revenue</p>
                    <p className="text-2xl font-medium text-navy">{formatCurrency(property.monthlyRevenue || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Current Monthly Revenue</p>
                    <p className="text-2xl font-medium text-success">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Vacancy Loss</p>
                    <p className="text-2xl font-medium text-destructive">{formatCurrency((property.monthlyRevenue || 0) - totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <Card className="border-sage/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">Maintenance Requests</CardTitle>
                  <Button className="bg-teal hover:bg-teal-dark text-white">
                    Create Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {propertyMaintenance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {propertyMaintenance.map((request: any) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-sage/10">
                          <TableCell className="font-medium text-navy">{request.title}</TableCell>
                          <TableCell>{request.unit_id ?? "—"}</TableCell>
                          <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                          <TableCell><StatusBadge status={request.status} /></TableCell>
                          <TableCell>{formatDate(request.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    title="No Maintenance Requests"
                    description="Maintenance requests for this property will appear here."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-navy">Properties</h1>
        <div className="flex items-center gap-4">
          {/* Property Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-sage text-navy hover:bg-sage/20">
               {selectedProperty?.type === "apartment" ? (
  <Building2 className="h-4 w-4 mr-2" />
) : (
  <Home className="h-4 w-4 mr-2" />
)}
{selectedProperty?.name ?? "Select Property"} - {selectedProperty?.address?.split(",")[0] ?? ""}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
             {dbProperties.map((property) => (
  <DropdownMenuItem
    key={property.id}
    onClick={() => {
      setSelectedPropertyId(property.id)
      setSelectedUnitId(null)
    }}
                  className={cn(
                    "flex items-center gap-3 py-2",
                    property.id === selectedPropertyId && "bg-sage/20"
                  )}
                >
                  {property.type === "apartment" ? (
                    <Building2 className="h-4 w-4 text-navy" />
                  ) : (
                    <Home className="h-4 w-4 text-navy" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-navy">{property.name}</p>
                    <p className="text-xs text-text-muted">{property.address.split(",")[0]}</p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/landlord/properties/add")}
                className="text-teal"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => router.push("/landlord/properties/add")}
            className="bg-teal hover:bg-teal-dark text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Content */}
     {selectedProperty ? (isApartment ? <MultiUnitBuildingView /> : singleUnitView) : <div className="p-6 text-text-muted">Loading properties...</div>}

      {/* Edit Property / Building Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">Edit Property</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-navy">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="border-sage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-navy">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="border-sage"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-navy">Property Type</Label>
              <Select
                value={editForm.property_type}
                onValueChange={(v) => setEditForm((f) => ({ ...f, property_type: v }))}
              >
                <SelectTrigger className="border-sage">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address" className="text-navy">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                className="border-sage"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city" className="text-navy">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                  className="border-sage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postal" className="text-navy">Postal Code</Label>
                <Input
                  id="edit-postal"
                  value={editForm.postal_code}
                  onChange={(e) => setEditForm((f) => ({ ...f, postal_code: e.target.value }))}
                  className="border-sage"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-navy">Province</Label>
                <Select
                  value={editForm.province}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, province: v }))}
                >
                  <SelectTrigger className="border-sage">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANADIAN_PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-navy">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="border-sage">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-navy/20 text-navy hover:bg-navy/5"
              onClick={() => setEditOpen(false)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              className="bg-teal hover:bg-teal-dark text-white"
              onClick={handleSaveEdit}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
