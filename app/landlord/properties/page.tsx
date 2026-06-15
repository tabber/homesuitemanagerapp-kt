"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { EmptyState } from "@/components/empty-state"
import { LockedFeature } from "@/components/locked-feature"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Property } from "@/lib/supabase/types"

// Mock data
const properties = [
  {
    id: "1",
    name: "Viceroy",
    address: "1009 Fairfield Rd, Victoria, BC V8V 3A9",
    type: "apartment",
    status: "occupied" as const,
    totalUnits: 12,
    occupiedUnits: 10,
    monthlyRevenue: 18500,
    units: [
      { id: "101", number: "101", floor: 1, bedrooms: 1, bathrooms: 1, tenant: "John Smith", rent: 1500, status: "occupied" as const },
      { id: "102", number: "102", floor: 1, bedrooms: 2, bathrooms: 1, tenant: "Sarah Johnson", rent: 1800, status: "occupied" as const },
      { id: "103", number: "103", floor: 1, bedrooms: 1, bathrooms: 1, tenant: null, rent: 1500, status: "vacant" as const },
      { id: "201", number: "201", floor: 2, bedrooms: 2, bathrooms: 2, tenant: "Mike Brown", rent: 2000, status: "occupied" as const },
      { id: "202", number: "202", floor: 2, bedrooms: 1, bathrooms: 1, tenant: null, rent: 1500, status: "maintenance" as const },
      { id: "203", number: "203", floor: 2, bedrooms: 2, bathrooms: 1, tenant: "Emily Davis", rent: 1800, status: "occupied" as const },
      { id: "301", number: "301", floor: 3, bedrooms: 3, bathrooms: 2, tenant: "Robert Wilson", rent: 2500, status: "occupied" as const },
      { id: "302", number: "302", floor: 3, bedrooms: 2, bathrooms: 2, tenant: "Lisa Anderson", rent: 2000, status: "occupied" as const },
      { id: "303", number: "303", floor: 3, bedrooms: 1, bathrooms: 1, tenant: "David Lee", rent: 1500, status: "occupied" as const },
      { id: "401", number: "401", floor: 4, bedrooms: 2, bathrooms: 2, tenant: "Jennifer Taylor", rent: 2100, status: "occupied" as const },
      { id: "402", number: "402", floor: 4, bedrooms: 1, bathrooms: 1, tenant: null, rent: 1600, status: "vacant" as const },
      { id: "403", number: "403", floor: 4, bedrooms: 2, bathrooms: 1, tenant: "Chris Martin", rent: 1900, status: "occupied" as const },
    ],
  },
  {
    id: "2",
    name: "Oak Street House",
    address: "456 Oak St, Vancouver, BC V6H 2M4",
    type: "single",
    status: "occupied" as const,
    monthlyRent: 2800,
    tenant: {
      name: "Amanda Wilson",
      email: "amanda.wilson@email.com",
      phone: "(604) 555-0123",
    },
    lease: {
      startDate: "2025-09-01",
      endDate: "2026-08-31",
      rent: 2800,
      deposit: 2800,
      status: "active" as const,
    },
    payments: [
      { id: "p1", tenant: "Amanda Wilson", amount: 2800, date: "2026-05-01", method: "e-Transfer", status: "completed" as const },
      { id: "p2", tenant: "Amanda Wilson", amount: 2800, date: "2026-04-01", method: "e-Transfer", status: "completed" as const },
      { id: "p3", tenant: "Amanda Wilson", amount: 2800, date: "2026-03-01", method: "e-Transfer", status: "completed" as const },
    ],
    maintenanceRequests: [
      { id: "m1", title: "Leaky faucet in kitchen", priority: "medium" as const, status: "completed" as const, date: "2026-04-15" },
    ],
    openRequests: 0,
  },
  {
    id: "3",
    name: "Maple Condo",
    address: "789 Maple Ave, Toronto, ON M5V 1A1",
    type: "single",
    status: "vacant" as const,
    monthlyRent: 2200,
    tenant: null,
    lease: null,
    payments: [],
    maintenanceRequests: [],
    openRequests: 0,
  },
]

const maintenanceRequests = [
  { id: "m1", title: "Broken window latch", property: "Viceroy", unit: "201", priority: "high" as const, status: "open" as const, date: "2026-05-28" },
  { id: "m2", title: "HVAC not cooling", property: "Viceroy", unit: "303", priority: "urgent" as const, status: "in-progress" as const, date: "2026-05-25" },
  { id: "m3", title: "Dishwasher leak", property: "Viceroy", unit: "102", priority: "medium" as const, status: "open" as const, date: "2026-05-20" },
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

  useEffect(() => {
    let isMounted = true

    async function loadProperties() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: true })

      if (isMounted && data) {
        setDbProperties(data as Property[])
        if (data.length > 0) {
          setSelectedPropertyId(data[0].id)
        }
      }
    }

    loadProperties()

    return () => {
      isMounted = false
    }
  }, [])

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

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) ?? properties[0]
  const selectedDbProperty = dbProperties.find((p) => p.id === selectedPropertyId)
  const isApartment = selectedProperty.type === "apartment"
  const selectedUnit = isApartment && selectedUnitId
    ? selectedProperty.units?.find((u) => u.id === selectedUnitId)
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

  // Single unit property view
  const SingleUnitView = () => {
    const property = selectedProperty as typeof properties[1]
    
    return (
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
                    <StatusBadge status={property.status} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">{property.address}</p>
                </div>
              </div>
              <Button variant="outline" className="border-navy/20 text-navy hover:bg-navy/5">
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
            value={formatCurrency(property.monthlyRent || 0)}
          />
          <StatCard
            label="Lease Status"
            value={property.lease ? "Active" : "No Lease"}
            sublabel={property.lease ? `Ends ${formatDate(property.lease.endDate)}` : undefined}
          />
          <StatCard
            label="Open Requests"
            value={property.openRequests || 0}
          />
          <StatCard
            label="Last Payment"
            value={property.payments[0] ? formatDate(property.payments[0].date) : "N/A"}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lease" className="w-full">
          <TabsList className="bg-sage/20 border border-sage/30">
            <TabsTrigger value="lease" className="data-[state=active]:bg-white data-[state=active]:text-navy">Lease</TabsTrigger>
            <TabsTrigger value="tenant" className="data-[state=active]:bg-white data-[state=active]:text-navy">Tenant</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-white data-[state=active]:text-navy">Payments</TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-white data-[state=active]:text-navy">Maintenance</TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-white data-[state=active]:text-navy">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="lease" className="mt-6">
            {property.lease ? (
              <Card className="border-sage/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-navy">Current Lease</CardTitle>
                    <StatusBadge status={property.lease.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-muted">Tenant</p>
                      <p className="text-sm font-medium text-navy">{property.tenant?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Lease Period</p>
                      <p className="text-sm font-medium text-navy">
                        {formatDate(property.lease.startDate)} - {formatDate(property.lease.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Monthly Rent</p>
                      <p className="text-sm font-medium text-navy">{formatCurrency(property.lease.rent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-muted">Security Deposit</p>
                      <p className="text-sm font-medium text-navy">{formatCurrency(property.lease.deposit)}</p>
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
            {property.tenant ? (
              <Card className="border-sage/50">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-navy">Tenant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-medium">
                      {property.tenant.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-navy">{property.tenant.name}</h3>
                      <p className="text-sm text-text-muted">{property.tenant.email}</p>
                      <p className="text-sm text-text-muted">{property.tenant.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-sage/30">
                    <div>
                      <p className="text-sm text-text-muted">Lease Period</p>
                      <p className="text-sm font-medium text-navy">
                        {property.lease && `${formatDate(property.lease.startDate)} - ${formatDate(property.lease.endDate)}`}
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
                {property.payments.length > 0 ? (
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
                    <TableBody>
                      {property.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium text-navy">{payment.tenant}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell><StatusBadge status={payment.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
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
                {property.maintenanceRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {property.maintenanceRequests.map((request) => (
                        <TableRow key={request.id} className="cursor-pointer hover:bg-sage/10">
                          <TableCell className="font-medium text-navy">{request.title}</TableCell>
                          <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                          <TableCell><StatusBadge status={request.status} /></TableCell>
                          <TableCell>{formatDate(request.date)}</TableCell>
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

          <TabsContent value="messages" className="mt-6">
            <Card className="border-sage/50">
              <CardContent className="p-6">
                {property.tenant ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-sage/30">
                      <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-medium">
                        {property.tenant.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-navy">{property.tenant.name}</p>
                        <p className="text-sm text-text-muted">{property.name}</p>
                      </div>
                    </div>
                    <div className="h-64 flex items-center justify-center text-text-muted">
                      <p>No messages yet. Start a conversation with your tenant.</p>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-sage/30">
                      <Input placeholder="Type a message..." className="flex-1 border-sage" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-navy/20 text-navy" disabled>
                            Templates
                            <span className="ml-2 text-xs bg-sage/50 px-1.5 py-0.5 rounded">Essential</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Late Rent Reminder</DropdownMenuItem>
                          <DropdownMenuItem>Maintenance Update</DropdownMenuItem>
                          <DropdownMenuItem>Lease Renewal Notice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button className="bg-teal hover:bg-teal-dark text-white">Send</Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="No Tenant"
                    description="Add a tenant to start messaging."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Multi-unit building view
  const MultiUnitBuildingView = () => {
    const property = selectedProperty as typeof properties[0]
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
                    <Button className="bg-teal hover:bg-teal-dark text-white">
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
                    <StatusBadge status={property.status} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">{property.address}</p>
                </div>
              </div>
              <Button variant="outline" className="border-navy/20 text-navy hover:bg-navy/5">
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
            <TabsTrigger value="messages" className="data-[state=active]:bg-white data-[state=active]:text-navy">Messages</TabsTrigger>
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
                    {maintenanceRequests.map((request) => (
                      <TableRow key={request.id} className="cursor-pointer hover:bg-sage/10">
                        <TableCell className="font-medium text-navy">{request.title}</TableCell>
                        <TableCell>{request.unit}</TableCell>
                        <TableCell><PriorityBadge priority={request.priority} /></TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell>{formatDate(request.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <Card className="border-sage/50">
              <CardContent className="p-6">
                <EmptyState
                  icon={MessageSquare}
                  title="Building Messages"
                  description="Select a unit to view or send messages to tenants."
                />
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
                {selectedProperty.type === "apartment" ? (
                  <Building2 className="h-4 w-4 mr-2" />
                ) : (
                  <Home className="h-4 w-4 mr-2" />
                )}
                {selectedProperty.name} - {selectedProperty.address.split(",")[0]}
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
      {isApartment ? <MultiUnitBuildingView /> : <SingleUnitView />}
    </div>
  )
}
