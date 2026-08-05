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
  AlertCircle,
  FileText,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/stat-card"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { EmptyState } from "@/components/empty-state"
import { LockedFeature } from "@/components/locked-feature"
import { CreateRequestModal } from "@/components/create-request-modal"
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

const MULTI_UNIT_TYPES = [
  "building",
  "apartment",
  "multi_unit",
  "multi",
  "duplex",
  "triplex",
  "fourplex",
]

// A property is multi-unit if its type says so, or it already has units,
// or it declares more than one total unit.
function isMultiUnitProperty(p: any, unitCount = 0) {
  if (!p) return false
  const t = String(p.property_type ?? "").toLowerCase()
  return (
    MULTI_UNIT_TYPES.includes(t) ||
    unitCount > 0 ||
    Number(p.total_units ?? 0) > 1
  )
}

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
  const [showLeaseSummary, setShowLeaseSummary] = useState(false)
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
  const [propertyLeases, setPropertyLeases] = useState<any[]>([])
  const [unitTenants, setUnitTenants] = useState<Record<string, any>>({})
  const [acknowledging, setAcknowledging] = useState(false)
  const [unitRows, setUnitRows] = useState<any[]>([])
  const [unitDialogOpen, setUnitDialogOpen] = useState(false)
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null)
  const [savingUnit, setSavingUnit] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [moveOutOpen, setMoveOutOpen] = useState(false)
  const [moveOutLease, setMoveOutLease] = useState<any | null>(null)
  const [savingMoveOut, setSavingMoveOut] = useState(false)
  const [editLeaseOpen, setEditLeaseOpen] = useState(false)
  const [editingLease, setEditingLease] = useState<any | null>(null)
  const [savingLeaseEdit, setSavingLeaseEdit] = useState(false)
  const [cancelLeaseOpen, setCancelLeaseOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<any | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [leaseEditForm, setLeaseEditForm] = useState({
    tenant_name: "",
    tenant_email: "",
    tenant_phone: "",
    monthly_rent: "",
    security_deposit: "",
    payment_due_day: "1",
    start_date: "",
    end_date: "",
  })
  const [moveOutForm, setMoveOutForm] = useState({
    date: "",
    reason: "tenant_notice",
    notes: "",
    inspectionDone: false,
    depositReturned: "",
    depositWithheld: "",
    withheldReason: "",
  })
  const [addUnitsOpen, setAddUnitsOpen] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    count: "1",
    startNumber: "101",
    floor: "1",
    bedrooms: "1",
    bathrooms: "1",
    rent: "",
    deposit: "",
  })
  const [unitForm, setUnitForm] = useState({
    unit_number: "",
    floor: "",
    bedrooms: "",
    bathrooms: "",
    rent_amount: "",
    deposit_amount: "",
    status: "vacant",
    notes: "",
  })
  const [tenantProfile, setTenantProfile] = useState<any | null>(null)
  const [propertyPayments, setPropertyPayments] = useState<any[]>([])
  const [propertyMaintenance, setPropertyMaintenance] = useState<any[]>([])

  const [userId, setUserId] = useState<string | null>(null)

  // Create Maintenance Request modal (shared component)
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [tabsRefreshTick, setTabsRefreshTick] = useState(0)

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
      .or("archived.is.null,archived.eq.false")
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
        .select("*")
        .eq("property_id", selectedPropertyId)
        .order("unit_number", { ascending: true })

      if (isMounted) setUnitRows(data ?? [])

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

      // All leases for this property (used by the per-unit views)
      const { data: allLeases } = await supabase
        .from("leases")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .in("status", ["active", "pending"])

      // Tenant profiles referenced by those leases
      const tenantIds = Array.from(
        new Set((allLeases ?? []).map((l: any) => l.tenant_id).filter(Boolean))
      )
      const tenantMap: Record<string, any> = {}
      if (tenantIds.length > 0) {
        const { data: tenantRows } = await supabase
          .from("profiles")
          .select("*")
          .in("id", tenantIds)
        ;(tenantRows ?? []).forEach((t: any) => {
          tenantMap[t.id] = t
        })
      }

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
        .limit(200)

      // Maintenance tab: requests for this property
      const { data: maintenance } = await supabase
        .from("maintenance_requests")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .order("created_at", { ascending: false })

      if (!isMounted) return

      setActiveLease(leaseRow ?? null)
      setPropertyLeases(allLeases ?? [])
      setUnitTenants(tenantMap)
      setTenantProfile(tenant)
      setPropertyPayments(payments ?? [])
      setPropertyMaintenance(maintenance ?? [])
    }

    loadPropertyTabs()

    return () => {
      isMounted = false
    }
  }, [selectedPropertyId, tabsRefreshTick])

const selectedProperty = dbProperties.find((p) => p.id === selectedPropertyId) ?? dbProperties[0] ?? null
  const isApartment = isMultiUnitProperty(selectedProperty, unitRows.length)

  // Lease/tenant/payment/maintenance data scoped to the selected unit
  const leaseForUnit = (unitId: string | null) =>
    unitId
      ? propertyLeases.find(
          (l: any) => l.unit_id === unitId && (l.status === "active" || l.status === "pending")
        ) ?? null
      : null
const selectedUnitRow =
  isApartment && selectedUnitId
    ? unitRows.find((u: any) => u.id === selectedUnitId)
    : null
const selectedUnit = selectedUnitRow
  ? {
      id: selectedUnitRow.id,
      number: selectedUnitRow.unit_number ?? "",
      floor: selectedUnitRow.floor ?? 1,
      bedrooms: selectedUnitRow.bedrooms ?? 0,
      bathrooms: selectedUnitRow.bathrooms ?? 0,
      rent: Number(selectedUnitRow.rent_amount ?? 0),
      deposit: Number(selectedUnitRow.deposit_amount ?? 0),
      status: selectedUnitRow.status ?? "vacant",
      notes: selectedUnitRow.notes ?? "",
      tenant: (() => {
        const l = propertyLeases.find(
          (x: any) => x.unit_id === selectedUnitRow.id && x.status === "active"
        )
        if (!l) return null
        const p = l.tenant_id ? unitTenants[l.tenant_id] : null
        return (
          [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
          l.tenant_name ||
          "Tenant"
        )
      })(),
    }
  : null

const selectedUnitLease = selectedUnitRow ? leaseForUnit(selectedUnitRow.id) : null
const selectedUnitTenantProfile = selectedUnitLease?.tenant_id
  ? unitTenants[selectedUnitLease.tenant_id] ?? null
  : null
const selectedUnitPayments = selectedUnitRow
  ? propertyPayments.filter((p: any) => p.unit_id === selectedUnitRow.id)
  : []
const selectedUnitMaintenance = selectedUnitRow
  ? propertyMaintenance.filter((m: any) => m.unit_id === selectedUnitRow.id)
  : []
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
  const UNIT_STATUSES = [
    { value: "vacant", label: "Vacant" },
    { value: "occupied", label: "Occupied" },
    { value: "maintenance", label: "Under repair" },
    { value: "renovating", label: "Renovating" },
    { value: "unavailable", label: "Not available" },
  ]

  const reloadUnits = async () => {
    if (!selectedPropertyId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", selectedPropertyId)
      .order("unit_number", { ascending: true })
    setUnitRows(data ?? [])
  }

  const openUnitEditor = (unit: any) => {
    setEditingUnitId(unit.id)
    setUnitForm({
      unit_number: String(unit.number ?? unit.unit_number ?? ""),
      floor: String(unit.floor ?? ""),
      bedrooms: String(unit.bedrooms ?? ""),
      bathrooms: String(unit.bathrooms ?? ""),
      rent_amount: String(unit.rent ?? unit.rent_amount ?? ""),
      deposit_amount: String(unit.deposit ?? unit.deposit_amount ?? ""),
      status: unit.status ?? "vacant",
      notes: unit.notes ?? "",
    })
    setUnitDialogOpen(true)
  }

  const handleSaveUnit = async () => {
    if (!editingUnitId || savingUnit) return
    setSavingUnit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("units")
      .update({
        unit_number: unitForm.unit_number,
        floor: unitForm.floor ? parseInt(unitForm.floor) : null,
        bedrooms: unitForm.bedrooms ? parseInt(unitForm.bedrooms) : null,
        bathrooms: unitForm.bathrooms ? parseFloat(unitForm.bathrooms) : null,
        rent_amount: unitForm.rent_amount ? parseFloat(unitForm.rent_amount) : null,
        deposit_amount: unitForm.deposit_amount ? parseFloat(unitForm.deposit_amount) : null,
        status: unitForm.status,
        notes: unitForm.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingUnitId)
    setSavingUnit(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Unit updated")
    setUnitDialogOpen(false)
    setEditingUnitId(null)
    reloadUnits()
  }

  const handleDeleteUnit = async (unitId: string, status: string) => {
    if (status === "occupied") {
      toast.error("End the lease before removing an occupied unit")
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from("units").delete().eq("id", unitId)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Unit removed")
    setUnitDialogOpen(false)
    setEditingUnitId(null)
    reloadUnits()
  }

  const handleAddUnits = async () => {
    if (!selectedPropertyId || savingUnit) return
    const count = Math.max(1, Math.min(parseInt(bulkForm.count || "1"), 50))
    const start = parseInt(bulkForm.startNumber || "101")
    if (Number.isNaN(start)) {
      toast.error("Starting unit number must be a number")
      return
    }
    setSavingUnit(true)
    const supabase = createClient()
    const rows = Array.from({ length: count }, (_, i) => ({
      property_id: selectedPropertyId,
      unit_number: String(start + i),
      floor: bulkForm.floor ? parseInt(bulkForm.floor) : null,
      bedrooms: bulkForm.bedrooms ? parseInt(bulkForm.bedrooms) : null,
      bathrooms: bulkForm.bathrooms ? parseFloat(bulkForm.bathrooms) : null,
      rent_amount: bulkForm.rent ? parseFloat(bulkForm.rent) : null,
      deposit_amount: bulkForm.deposit ? parseFloat(bulkForm.deposit) : null,
      status: "vacant",
    }))
    const { error } = await supabase.from("units").insert(rows)
    setSavingUnit(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${count} unit${count === 1 ? "" : "s"} added`)
    setAddUnitsOpen(false)
    reloadUnits()
  }

  const handleArchiveProperty = async () => {
    if (!selectedPropertyId || archiving) return
    setArchiving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("properties")
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq("id", selectedPropertyId)
    setArchiving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Property archived")
    setEditOpen(false)
    setSelectedPropertyId("")
    loadProperties()
  }

  const openMoveOut = (lease: any) => {
    if (!lease) return
    setMoveOutLease(lease)
    setMoveOutForm({
      date: lease.move_out_date ?? "",
      reason: lease.move_out_reason ?? "tenant_notice",
      notes: lease.move_out_notes ?? "",
      inspectionDone: !!lease.move_out_inspection_at,
      depositReturned:
        lease.deposit_returned_amount != null
          ? String(lease.deposit_returned_amount)
          : String(lease.security_deposit ?? ""),
      depositWithheld:
        lease.deposit_withheld_amount != null ? String(lease.deposit_withheld_amount) : "",
      withheldReason: lease.deposit_withheld_reason ?? "",
    })
    setMoveOutOpen(true)
  }

  const refreshLeases = async () => {
    if (!selectedPropertyId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("leases")
      .select("*")
      .eq("property_id", selectedPropertyId)
      .in("status", ["active", "pending"])
    setPropertyLeases(data ?? [])
    setActiveLease((prev: any) =>
      prev ? (data ?? []).find((l: any) => l.id === prev.id) ?? prev : prev
    )
  }

  const handleScheduleMoveOut = async () => {
    if (!moveOutLease || !moveOutForm.date || savingMoveOut) return
    setSavingMoveOut(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("leases")
      .update({
        move_out_date: moveOutForm.date,
        move_out_reason: moveOutForm.reason,
        move_out_notes: moveOutForm.notes || null,
        notice_given_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", moveOutLease.id)
    setSavingMoveOut(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Move-out scheduled")
    setMoveOutOpen(false)
    await refreshLeases()
    await reloadUnits()
  }

  const handleCancelMoveOut = async () => {
    if (!moveOutLease || savingMoveOut) return
    setSavingMoveOut(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("leases")
      .update({
        move_out_date: null,
        move_out_reason: null,
        move_out_notes: null,
        notice_given_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moveOutLease.id)
    setSavingMoveOut(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Move-out cancelled")
    setMoveOutOpen(false)
    await refreshLeases()
  }

  const handleCompleteMoveOut = async () => {
    if (!moveOutLease || savingMoveOut) return
    setSavingMoveOut(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    // Terminating the lease fires the database trigger that vacates the unit.
    const { error } = await supabase
      .from("leases")
      .update({
        status: "terminated",
        moved_out_at: now,
        move_out_inspection_at: moveOutForm.inspectionDone ? now : null,
        deposit_returned_amount: moveOutForm.depositReturned
          ? Number(moveOutForm.depositReturned)
          : null,
        deposit_withheld_amount: moveOutForm.depositWithheld
          ? Number(moveOutForm.depositWithheld)
          : null,
        deposit_withheld_reason: moveOutForm.withheldReason || null,
        deposit_settled_at:
          moveOutForm.depositReturned || moveOutForm.depositWithheld ? now : null,
        updated_at: now,
      })
      .eq("id", moveOutLease.id)
    setSavingMoveOut(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Move-out completed — the unit is now vacant")
    setMoveOutOpen(false)
    setSelectedUnitId("")
    await refreshLeases()
    await reloadUnits()
    loadProperties()
  }

  const openLeaseEditor = (lease: any) => {
    if (!lease) return
    setEditingLease(lease)
    setLeaseEditForm({
      tenant_name: lease.tenant_name ?? "",
      tenant_email: lease.tenant_email ?? "",
      tenant_phone: lease.tenant_phone ?? "",
      monthly_rent: lease.monthly_rent != null ? String(lease.monthly_rent) : "",
      security_deposit: lease.security_deposit != null ? String(lease.security_deposit) : "",
      payment_due_day: lease.payment_due_day != null ? String(lease.payment_due_day) : "1",
      start_date: lease.start_date ?? "",
      end_date: lease.end_date ?? "",
    })
    setEditLeaseOpen(true)
  }

  const handleSaveLeaseEdit = async () => {
    if (!editingLease || savingLeaseEdit) return
    setSavingLeaseEdit(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("leases")
      .update({
        tenant_name: leaseEditForm.tenant_name || null,
        tenant_email: leaseEditForm.tenant_email || null,
        tenant_phone: leaseEditForm.tenant_phone || null,
        monthly_rent: leaseEditForm.monthly_rent ? Number(leaseEditForm.monthly_rent) : null,
        security_deposit: leaseEditForm.security_deposit ? Number(leaseEditForm.security_deposit) : null,
        payment_due_day: leaseEditForm.payment_due_day ? Number(leaseEditForm.payment_due_day) : null,
        start_date: leaseEditForm.start_date || null,
        end_date: leaseEditForm.end_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingLease.id)
    setSavingLeaseEdit(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Lease updated")
    setEditLeaseOpen(false)
    setEditingLease(null)
    await refreshLeases()
    loadProperties()
  }

  const openCancelLease = (lease: any) => {
    setCancelTarget(lease)
    setCancelLeaseOpen(true)
  }

  // Cancel a lease safely: if it's pending with no payments, delete it clean.
  // Otherwise void it (status = cancelled) so history and references survive.
  const handleCancelLease = async () => {
    if (!cancelTarget || cancelling) return
    setCancelling(true)
    const supabase = createClient()

    // Does this lease have any payments referencing it?
    const { count: paymentCount } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("lease_id", cancelTarget.id)

    const isPending = cancelTarget.status === "pending"
    const hasPayments = (paymentCount ?? 0) > 0

    if (isPending && !hasPayments) {
      // Clean delete — free the unit if one was tied to it
      const { error } = await supabase.from("leases").delete().eq("id", cancelTarget.id)
      if (error) {
        setCancelling(false)
        toast.error(error.message)
        return
      }
      if (cancelTarget.unit_id) {
        await supabase.from("units").update({ status: "vacant" }).eq("id", cancelTarget.unit_id)
      }
      toast.success("Lease cancelled")
    } else {
      // Void: preserve the record, free the unit
      const { error } = await supabase
        .from("leases")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", cancelTarget.id)
      if (error) {
        setCancelling(false)
        toast.error(error.message)
        return
      }
      if (cancelTarget.unit_id) {
        await supabase.from("units").update({ status: "vacant" }).eq("id", cancelTarget.unit_id)
      }
      toast.success("Lease voided — history preserved")
    }

    setCancelling(false)
    setCancelLeaseOpen(false)
    setCancelTarget(null)
    setSelectedUnitId("")
    await refreshLeases()
    loadProperties()
  }

  const confirmLeaseById = async (leaseId: string) => {
    if (!leaseId || acknowledging) return
    setAcknowledging(true)
    const supabase = createClient()
    const now = new Date().toISOString()
    const { error } = await supabase
      .from("leases")
      .update({ landlord_signed_at: now })
      .eq("id", leaseId)
    setAcknowledging(false)
    if (error) {
      toast.error(error.message || "Could not confirm the lease")
      return
    }
    setActiveLease((prev: any) =>
      prev && prev.id === leaseId ? { ...prev, landlord_signed_at: now } : prev
    )
    setPropertyLeases((prev) =>
      prev.map((l: any) => (l.id === leaseId ? { ...l, landlord_signed_at: now } : l))
    )
    toast.success("Lease confirmed")
  }

  const handleAcknowledgeLease = async () => {
    if (!activeLease) return
    await confirmLeaseById(activeLease.id)
  }

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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {lease.move_out_date && (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                        <p className="text-sm text-navy">
                          Moving out on {formatDate(lease.move_out_date)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openMoveOut(lease)}
                        className="bg-teal hover:bg-teal-dark text-white flex-shrink-0"
                      >
                        Complete move-out
                      </Button>
                    </div>
                  )}

                  {lease.tenant_signed_at && !lease.landlord_signed_at && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                      <p className="text-sm text-navy">
                        Your tenant has accepted this lease — confirm it to complete the record.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {!lease.move_out_date && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMoveOut(lease)}
                        className="border-sage text-navy hover:bg-sage/20"
                      >
                        Schedule move-out
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLeaseEditor(lease)}
                      className="border-sage text-navy hover:bg-sage/20"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit lease
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLeaseSummary(true)}
                      className="border-sage text-navy hover:bg-sage/20"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View lease summary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelLease(lease)}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      Cancel lease
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage/30">
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
                    <Button 
                      onClick={() => router.push("/landlord/inbox")}
                      className="bg-teal hover:bg-teal-dark text-white">
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
                  <Button
                    variant="outline"
                    onClick={() => router.push("/landlord/payments")}
                    className="border-navy/20 text-navy hover:bg-navy/5"
                  >
                    Go to Payments
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
                 <Button 
  onClick={() => setShowCreateRequest(true)}
  className="bg-teal hover:bg-teal-dark text-white"
>
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
    // Units come from the database, mapped into the shape this view expects.
    const mappedUnits = unitRows.map((u: any) => ({
      id: u.id,
      number: u.unit_number ?? "",
      floor: u.floor ?? 1,
      bedrooms: u.bedrooms ?? 0,
      bathrooms: u.bathrooms ?? 0,
      rent: Number(u.rent_amount ?? 0),
      deposit: Number(u.deposit_amount ?? 0),
      status: u.status ?? "vacant",
      notes: u.notes ?? "",
      tenant: null,
    }))
    const occupiedCount = mappedUnits.filter((u) => u.status === "occupied").length
    const vacantCount = mappedUnits.filter((u) => u.status === "vacant").length
    const maintenanceCount = mappedUnits.filter((u) =>
      ["maintenance", "renovating", "unavailable"].includes(u.status)
    ).length
    const totalRevenue = mappedUnits
      .filter((u) => u.status === "occupied")
      .reduce((sum, u) => sum + u.rent, 0)
    
    // Group units by floor
    const floors = mappedUnits.reduce((acc: any, unit: any) => {
      if (!acc[unit.floor]) acc[unit.floor] = []
      acc[unit.floor].push(unit)
      return acc
    }, {} as Record<number, any[]>)

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
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-medium text-navy">Unit {selectedUnit.number}</h2>
                    <StatusBadge status={selectedUnit.status} />
                  </div>
                  <p className="text-sm text-text-muted mt-1">
                    {selectedUnit.bedrooms} bed / {selectedUnit.bathrooms} bath - Floor {selectedUnit.floor}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openUnitEditor(selectedUnit)}
                    className="border-navy/20 text-navy hover:bg-navy/5"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Unit
                  </Button>
                  {!selectedUnitLease && (
                    <Button
                      onClick={() =>
                        router.push(
                          `/landlord/leases/create?property=${selectedPropertyId}&unit=${selectedUnit.id}`
                        )
                      }
                      className="bg-teal hover:bg-teal-dark text-white"
                    >
                      Create Lease
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Monthly Rent"
              value={formatCurrency(selectedUnit.rent)}
            />
            <StatCard
              label="Lease Status"
              value={
                selectedUnitLease
                  ? selectedUnitLease.status === "active"
                    ? "Active"
                    : "Pending"
                  : "No Lease"
              }
            />
            <StatCard
              label="Open Requests"
              value={
                selectedUnitMaintenance.filter(
                  (m: any) => m.status !== "completed" && m.status !== "closed"
                ).length
              }
            />
            <StatCard
              label="Last Payment"
              value={
                selectedUnitPayments.length > 0
                  ? formatCurrency(Number(selectedUnitPayments[0].amount ?? 0))
                  : "None yet"
              }
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
            <TabsContent value="lease" className="mt-6 space-y-4">
              {selectedUnitLease?.move_out_date && (
                <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                    <p className="text-sm text-navy">
                      Moving out on {formatDate(selectedUnitLease.move_out_date)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openMoveOut(selectedUnitLease)}
                    className="bg-teal hover:bg-teal-dark text-white flex-shrink-0"
                  >
                    Complete move-out
                  </Button>
                </div>
              )}

              {selectedUnitLease && selectedUnitLease.tenant_signed_at && !selectedUnitLease.landlord_signed_at && (
                <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                    <p className="text-sm text-navy">
                      Your tenant has accepted this lease — confirm it to complete the record.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => confirmLeaseById(selectedUnitLease.id)}
                    disabled={acknowledging}
                    className="bg-teal hover:bg-teal-dark text-white flex-shrink-0"
                  >
                    {acknowledging ? "Confirming..." : "Confirm lease"}
                  </Button>
                </div>
              )}
              {selectedUnitLease ? (
                <Card className="border-sage/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium text-navy">Current Lease</CardTitle>
                      <StatusBadge status={selectedUnitLease.status === "active" ? "active" : "pending"} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-text-muted">Tenant</p>
                        <p className="text-sm font-medium text-navy">
                          {[selectedUnitTenantProfile?.first_name, selectedUnitTenantProfile?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                            selectedUnitLease.tenant_name ||
                            "Tenant"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Monthly Rent</p>
                        <p className="text-sm font-medium text-navy">{formatCurrency(selectedUnit.rent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Lease Period</p>
                        <p className="text-sm font-medium text-navy">
                          {formatDate(selectedUnitLease.start_date)} - {formatDate(selectedUnitLease.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted">Security Deposit</p>
                        <p className="text-sm font-medium text-navy">
                          {formatCurrency(Number(selectedUnitLease.security_deposit ?? 0))}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-sage/40 pt-4 space-y-3 text-sm">
                      <p className="text-xs uppercase tracking-wide text-text-muted">Lease Status</p>
                      <div>
                        <p className="text-navy font-medium">Tenant acceptance</p>
                        <p className="text-text-muted">
                          {selectedUnitLease.tenant_signed_at
                            ? `Accepted on ${formatDate(selectedUnitLease.tenant_signed_at)}`
                            : "Awaiting tenant acceptance"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-navy font-medium">Your confirmation</p>
                          <p className="text-text-muted">
                            {selectedUnitLease.landlord_signed_at
                              ? `Confirmed on ${formatDate(selectedUnitLease.landlord_signed_at)}`
                              : "Not yet confirmed"}
                          </p>
                        </div>
                        {!selectedUnitLease.landlord_signed_at && (
                          <Button
                            size="sm"
                            onClick={() => confirmLeaseById(selectedUnitLease.id)}
                            disabled={acknowledging}
                            className="bg-teal hover:bg-teal-dark text-white flex-shrink-0"
                          >
                            {acknowledging ? "Confirming..." : "Confirm lease"}
                          </Button>
                        )}
                      </div>
                      {!selectedUnitLease.move_out_date && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLeaseEditor(selectedUnitLease)}
                            className="border-sage text-navy hover:bg-sage/20"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit lease
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMoveOut(selectedUnitLease)}
                            className="border-sage text-navy hover:bg-sage/20"
                          >
                            Schedule move-out
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancelLease(selectedUnitLease)}
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                          >
                            Cancel lease
                          </Button>
                        </div>
                      )}
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
              {selectedUnitLease ? (
                <Card className="border-sage/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-navy">Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white text-xl font-medium">
                        {(
                          [selectedUnitTenantProfile?.first_name, selectedUnitTenantProfile?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                          selectedUnitLease.tenant_name ||
                          "T"
                        )
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-navy">
                          {[selectedUnitTenantProfile?.first_name, selectedUnitTenantProfile?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                            selectedUnitLease.tenant_name ||
                            "Tenant"}
                        </h3>
                        <p className="text-sm text-text-muted">
                          {selectedUnitTenantProfile?.email ?? selectedUnitLease.tenant_email ?? ""}
                          {(selectedUnitTenantProfile?.phone ?? selectedUnitLease.tenant_phone)
                            ? ` · ${selectedUnitTenantProfile?.phone ?? selectedUnitLease.tenant_phone}`
                            : ""}
                        </p>
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
                    <Button
                      onClick={() => router.push("/landlord/payments")}
                      variant="outline"
                      className="border-navy/20 text-navy hover:bg-navy/5"
                    >
                      Go to Payments
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedUnitPayments.length === 0 ? (
                    <EmptyState
                      icon={Home}
                      title="No Payments Yet"
                      description="Payment history will appear here once rent is collected."
                    />
                  ) : (
                    <div className="space-y-2">
                      {selectedUnitPayments.slice(0, 12).map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-sage/40"
                        >
                          <div>
                            <p className="text-sm font-medium text-navy">
                              {formatCurrency(Number(p.amount ?? 0))}
                            </p>
                            <p className="text-xs text-text-muted">
                              {p.payment_date ?? ""} ·{" "}
                              {String(p.payment_method ?? "").replace(/_/g, " ")}
                            </p>
                          </div>
                          <StatusBadge status={p.status === "completed" ? "active" : "pending"} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <Card className="border-sage/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-navy">Maintenance Requests</CardTitle>
                  <Button
                    onClick={() => setShowCreateRequest(true)}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                     Create Request
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedUnitMaintenance.length === 0 ? (
                    <EmptyState
                      icon={Wrench}
                      title="No Maintenance Requests"
                      description="Maintenance requests for this unit will appear here."
                    />
                  ) : (
                    <div className="space-y-2">
                      {selectedUnitMaintenance.map((m: any) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-sage/40"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy truncate">{m.title}</p>
                            <p className="text-xs text-text-muted capitalize">
                              {String(m.priority ?? "medium")} priority
                              {m.created_at ? ` · ${formatDate(m.created_at)}` : ""}
                            </p>
                          </div>
                          <StatusBadge
                            status={
                              m.status === "completed" || m.status === "closed"
                                ? "active"
                                : "pending"
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex flex-wrap gap-2">
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-navy">
                    Units ({mappedUnits.length})
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddUnitsOpen(true)}
                    className="border-sage text-navy hover:bg-sage/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add units
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {mappedUnits.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-text-muted mb-4">
                      No units yet. Add units so you can create leases for this building.
                    </p>
                  </div>
                )}
                <div className="overflow-x-auto">
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
                    {mappedUnits.map((unit: any) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium text-navy">
                          {unit.number}
                          {unit.notes && (
                            <p className="text-xs text-text-muted font-normal mt-0.5 max-w-[220px] truncate">
                              {unit.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{unit.floor}</TableCell>
                        <TableCell>{unit.bedrooms} / {unit.bathrooms}</TableCell>
                        <TableCell>
                          {(() => {
                            const l = leaseForUnit(unit.id)
                            if (!l) return "—"
                            const p = l.tenant_id ? unitTenants[l.tenant_id] : null
                            const name =
                              [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
                              l.tenant_name ||
                              "Tenant"
                            return (
                              <span>
                                {name}
                                {l.status === "pending" && (
                                  <span className="ml-2 text-xs text-warning">pending</span>
                                )}
                                {l.tenant_signed_at && !l.landlord_signed_at && (
                                  <span className="ml-2 text-xs text-warning">needs confirmation</span>
                                )}
                                {l.move_out_date && (
                                  <span className="ml-2 text-xs text-warning">
                                    moving out {formatDate(l.move_out_date)}
                                  </span>
                                )}
                              </span>
                            )
                          })()}
                        </TableCell>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUnitEditor(unit)}
                              className="border-navy/20 text-navy hover:bg-navy/5"
                            >
                              Edit
                            </Button>
                            {unit.status === "vacant" && !leaseForUnit(unit.id) && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/landlord/leases/create?property=${selectedPropertyId}&unit=${unit.id}`
                                  )
                                }
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="mt-6">
            <Card className="border-sage/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-navy">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                  <Button
                    onClick={() => setShowCreateRequest(true)}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                    Create Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {propertyMaintenance.length > 0 ? (
                  <div className="overflow-x-auto">
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
                  </div>
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
                  {isMultiUnitProperty(property) ? (
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

      <CreateRequestModal
        open={showCreateRequest}
        onOpenChange={setShowCreateRequest}
        landlordId={userId ?? ""}
        presetPropertyId={selectedPropertyId}
        presetPropertyName={(selectedProperty as any)?.name}
        onCreated={() => setTabsRefreshTick((t) => t + 1)}
      />

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              onClick={handleArchiveProperty}
              disabled={archiving}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 mr-auto"
            >
              {archiving ? "Archiving..." : "Archive property"}
            </Button>
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
      {/* Move-out Dialog */}
      <Dialog open={moveOutOpen} onOpenChange={setMoveOutOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">
              {moveOutLease?.move_out_date ? "Complete move-out" : "Schedule move-out"}
            </DialogTitle>
          </DialogHeader>

          {moveOutLease?.move_out_date ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-sage/20 text-sm">
                <p className="text-navy font-medium">
                  Move-out scheduled for {formatDate(moveOutLease.move_out_date)}
                </p>
                {moveOutLease.move_out_reason && (
                  <p className="text-text-muted mt-1">{moveOutLease.move_out_reason}</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-navy">
                In BC a move-out condition inspection is required. Completing it
                protects your ability to claim against the deposit.
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="mo_inspection"
                  checked={moveOutForm.inspectionDone}
                  onCheckedChange={(v) =>
                    setMoveOutForm((f) => ({ ...f, inspectionDone: v === true }))
                  }
                />
                <Label htmlFor="mo_inspection" className="cursor-pointer">
                  Move-out inspection completed
                </Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mo_returned">Deposit returned</Label>
                  <Input
                    id="mo_returned"
                    type="number"
                    step="0.01"
                    value={moveOutForm.depositReturned}
                    onChange={(e) =>
                      setMoveOutForm((f) => ({ ...f, depositReturned: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="mo_withheld">Deposit withheld</Label>
                  <Input
                    id="mo_withheld"
                    type="number"
                    step="0.01"
                    value={moveOutForm.depositWithheld}
                    onChange={(e) =>
                      setMoveOutForm((f) => ({ ...f, depositWithheld: e.target.value }))
                    }
                  />
                </div>
              </div>

              {Number(moveOutForm.depositWithheld || 0) > 0 && (
                <div>
                  <Label htmlFor="mo_reason">Reason for withholding</Label>
                  <Textarea
                    id="mo_reason"
                    rows={2}
                    value={moveOutForm.withheldReason}
                    onChange={(e) =>
                      setMoveOutForm((f) => ({ ...f, withheldReason: e.target.value }))
                    }
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Keep this specific — it&apos;s the record if the tenant disputes.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelMoveOut}
                  disabled={savingMoveOut}
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  Cancel move-out
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setMoveOutOpen(false)}
                    className="border-sage text-navy hover:bg-sage/20"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleCompleteMoveOut}
                    disabled={savingMoveOut}
                    className="bg-teal hover:bg-teal-dark text-white"
                  >
                    {savingMoveOut ? "Completing..." : "Complete move-out"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">
                The tenancy stays active until the move-out date — rent is still
                owed and the unit stays occupied until you complete it.
              </p>

              <div>
                <Label htmlFor="mo_date">Move-out date</Label>
                <Input
                  id="mo_date"
                  type="date"
                  value={moveOutForm.date}
                  onChange={(e) => setMoveOutForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="mo_why">Reason</Label>
                <Select
                  value={moveOutForm.reason}
                  onValueChange={(v) => setMoveOutForm((f) => ({ ...f, reason: v }))}
                >
                  <SelectTrigger id="mo_why">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant_notice">Tenant gave notice</SelectItem>
                    <SelectItem value="landlord_notice">Landlord gave notice</SelectItem>
                    <SelectItem value="end_of_term">End of term</SelectItem>
                    <SelectItem value="mutual">Mutual agreement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mo_notes">Notes (optional)</Label>
                <Textarea
                  id="mo_notes"
                  rows={2}
                  value={moveOutForm.notes}
                  onChange={(e) => setMoveOutForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setMoveOutOpen(false)}
                  className="border-sage text-navy hover:bg-sage/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleMoveOut}
                  disabled={!moveOutForm.date || savingMoveOut}
                  className="bg-teal hover:bg-teal-dark text-white"
                >
                  {savingMoveOut ? "Saving..." : "Schedule move-out"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lease Dialog */}
      <Dialog open={editLeaseOpen} onOpenChange={setEditLeaseOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">Edit lease</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="el_name">Tenant name</Label>
                <Input id="el_name" value={leaseEditForm.tenant_name}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, tenant_name: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="el_email">Tenant email</Label>
                <Input id="el_email" type="email" value={leaseEditForm.tenant_email}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, tenant_email: e.target.value }))} />
                {editingLease?.status === "active" && (
                  <p className="text-xs text-warning mt-1">
                    This lease is active — changing the email won&apos;t move the tenant&apos;s existing account.
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="el_phone">Tenant phone</Label>
                <Input id="el_phone" value={leaseEditForm.tenant_phone}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, tenant_phone: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="el_rent">Monthly rent</Label>
                <Input id="el_rent" type="number" step="0.01" value={leaseEditForm.monthly_rent}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, monthly_rent: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="el_dep">Deposit</Label>
                <Input id="el_dep" type="number" step="0.01" value={leaseEditForm.security_deposit}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, security_deposit: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="el_start">Start date</Label>
                <Input id="el_start" type="date" value={leaseEditForm.start_date}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="el_end">End date</Label>
                <Input id="el_end" type="date" value={leaseEditForm.end_date}
                  onChange={(e) => setLeaseEditForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="el_due">Rent due day</Label>
                <Select value={leaseEditForm.payment_due_day}
                  onValueChange={(v) => setLeaseEditForm((f) => ({ ...f, payment_due_day: v }))}>
                  <SelectTrigger id="el_due"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => String(i + 1)).map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditLeaseOpen(false)}
                className="border-sage text-navy hover:bg-sage/20">Cancel</Button>
              <Button onClick={handleSaveLeaseEdit} disabled={savingLeaseEdit}
                className="bg-teal hover:bg-teal-dark text-white">
                {savingLeaseEdit ? "Saving..." : "Save lease"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Lease Dialog */}
      <Dialog open={cancelLeaseOpen} onOpenChange={setCancelLeaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Cancel this lease?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              {cancelTarget?.status === "pending"
                ? "This lease hasn't been accepted yet. If nothing is attached to it, it will be removed entirely. Otherwise it will be voided and its history kept."
                : "This lease will be voided (marked cancelled). Its payment history is preserved and the unit becomes available again."}
            </p>
            {cancelTarget && (
              <div className="p-3 rounded-lg bg-sage/20 text-sm">
                <p className="text-navy font-medium">{cancelTarget.tenant_name || "Tenant"}</p>
                <p className="text-text-muted">{cancelTarget.tenant_email}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setCancelLeaseOpen(false)}
                className="border-sage text-navy hover:bg-sage/20">Keep lease</Button>
              <Button onClick={handleCancelLease} disabled={cancelling}
                className="bg-destructive hover:bg-destructive/90 text-white">
                {cancelling ? "Cancelling..." : "Cancel lease"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-navy">Edit unit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="u_number">Unit number</Label>
                <Input id="u_number" value={unitForm.unit_number} onChange={(e) => setUnitForm((f) => ({ ...f, unit_number: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="u_floor">Floor</Label>
                <Input id="u_floor" type="number" value={unitForm.floor} onChange={(e) => setUnitForm((f) => ({ ...f, floor: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="u_bed">Bedrooms</Label>
                <Input id="u_bed" type="number" value={unitForm.bedrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bedrooms: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="u_bath">Bathrooms</Label>
                <Input id="u_bath" type="number" step="0.5" value={unitForm.bathrooms} onChange={(e) => setUnitForm((f) => ({ ...f, bathrooms: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="u_rent">Monthly rent</Label>
                <Input id="u_rent" type="number" step="0.01" value={unitForm.rent_amount} onChange={(e) => setUnitForm((f) => ({ ...f, rent_amount: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="u_dep">Deposit</Label>
                <Input id="u_dep" type="number" step="0.01" value={unitForm.deposit_amount} onChange={(e) => setUnitForm((f) => ({ ...f, deposit_amount: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label htmlFor="u_status">Status</Label>
              <Select value={unitForm.status} onValueChange={(v) => setUnitForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger id="u_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {unitForm.status === "occupied" && (
                <p className="text-xs text-text-muted mt-1">
                  Occupied is normally set automatically when a lease becomes active.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="u_notes">Notes</Label>
              <Textarea id="u_notes" rows={3} placeholder="Upgraded windows 2026, north-facing, new dishwasher..." value={unitForm.notes} onChange={(e) => setUnitForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-3 justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  const u = unitRows.find((x) => x.id === editingUnitId)
                  if (editingUnitId) handleDeleteUnit(editingUnitId, u?.status ?? "vacant")
                }}
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Remove unit
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setUnitDialogOpen(false)} className="border-sage text-navy hover:bg-sage/20">
                  Cancel
                </Button>
                <Button onClick={handleSaveUnit} disabled={savingUnit} className="bg-teal hover:bg-teal-dark text-white">
                  {savingUnit ? "Saving..." : "Save unit"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Units Dialog */}
      <Dialog open={addUnitsOpen} onOpenChange={setAddUnitsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Add units</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Units are numbered sequentially from the starting number. You can rename or adjust any of them afterwards.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="b_count">How many</Label>
                <Input id="b_count" type="number" min="1" max="50" value={bulkForm.count} onChange={(e) => setBulkForm((f) => ({ ...f, count: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="b_start">Starting number</Label>
                <Input id="b_start" value={bulkForm.startNumber} onChange={(e) => setBulkForm((f) => ({ ...f, startNumber: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="b_floor">Floor</Label>
                <Input id="b_floor" type="number" value={bulkForm.floor} onChange={(e) => setBulkForm((f) => ({ ...f, floor: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="b_bed">Bedrooms</Label>
                <Input id="b_bed" type="number" value={bulkForm.bedrooms} onChange={(e) => setBulkForm((f) => ({ ...f, bedrooms: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="b_bath">Bathrooms</Label>
                <Input id="b_bath" type="number" step="0.5" value={bulkForm.bathrooms} onChange={(e) => setBulkForm((f) => ({ ...f, bathrooms: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="b_rent">Monthly rent</Label>
                <Input id="b_rent" type="number" step="0.01" value={bulkForm.rent} onChange={(e) => setBulkForm((f) => ({ ...f, rent: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setAddUnitsOpen(false)} className="border-sage text-navy hover:bg-sage/20">
                Cancel
              </Button>
              <Button onClick={handleAddUnits} disabled={savingUnit} className="bg-teal hover:bg-teal-dark text-white">
                {savingUnit ? "Adding..." : "Add units"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

          <Dialog open={showLeaseSummary} onOpenChange={setShowLeaseSummary}>
              <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-navy font-medium">Lease Summary</DialogTitle>
                </DialogHeader>
                {activeLease && (
                  <div className="space-y-5 py-2 text-sm">
                    {/* Tenant */}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Tenant</p>
                      <p className="font-medium text-navy">{tenantName}</p>
                      {activeLease.tenant_email && <p className="text-text-muted">{activeLease.tenant_email}</p>}
                      {activeLease.tenant_phone && <p className="text-text-muted">{activeLease.tenant_phone}</p>}
                    </div>

                    {/* Lease terms */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-text-muted">Start Date</p>
                        <p className="font-medium text-navy">{formatDate(activeLease.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">End Date</p>
                        <p className="font-medium text-navy">{formatDate(activeLease.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Monthly Rent</p>
                        <p className="font-medium text-navy">{formatCurrency(activeLease.monthly_rent)}</p>
                      </div>
                      <div>
                        <p className="text-text-muted">Security Deposit</p>
                        <p className="font-medium text-navy">{formatCurrency(activeLease.security_deposit ?? 0)}</p>
                      </div>
                      {activeLease.payment_due_day && (
                        <div>
                          <p className="text-text-muted">Rent Due</p>
                          <p className="font-medium text-navy">Day {activeLease.payment_due_day} of each month</p>
                        </div>
                      )}
                    </div>

                    {/* Policies */}
                    <div className="border-t border-sage/40 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-text-muted">Pets</p>
                        <p className="font-medium text-navy">
                          {activeLease.pets_allowed ? "Allowed" : "Not allowed"}
                        </p>
                        {activeLease.pets_allowed && activeLease.pet_details && (
                          <p className="text-text-muted whitespace-pre-line">{activeLease.pet_details}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-text-muted">Smoking</p>
                        <p className="font-medium text-navy">
                          {activeLease.smoking_allowed ? "Allowed" : "Not allowed"}
                        </p>
                      </div>
                      {activeLease.num_vehicles != null && (
                        <div>
                          <p className="text-text-muted">Vehicles</p>
                          <p className="font-medium text-navy">{activeLease.num_vehicles}</p>
                          {activeLease.vehicle_details && (
                            <p className="text-text-muted whitespace-pre-line">{activeLease.vehicle_details}</p>
                          )}
                        </div>
                      )}
                      {activeLease.parking_details && (
                        <div>
                          <p className="text-text-muted">Parking</p>
                          <p className="font-medium text-navy">{activeLease.parking_details}</p>
                        </div>
                      )}
                    </div>

                    {/* Utilities */}
                    {activeLease.utilities_included &&
                      Object.keys(activeLease.utilities_included).some((k) => activeLease.utilities_included[k]) && (
                        <div className="border-t border-sage/40 pt-4">
                          <p className="text-text-muted mb-1">Utilities Covered by Tenant</p>
                          <p className="font-medium text-navy capitalize">
                            {Object.keys(activeLease.utilities_included)
                              .filter((k) => activeLease.utilities_included[k])
                              .join(", ")}
                          </p>
                        </div>
                      )}

                    {/* Occupants */}
                    {(activeLease.additional_tenants || activeLease.additional_occupants) && (
                      <div className="border-t border-sage/40 pt-4 space-y-2">
                        {activeLease.additional_tenants && (
                          <div>
                            <p className="text-text-muted">Additional Tenants</p>
                            <p className="font-medium text-navy whitespace-pre-line">{activeLease.additional_tenants}</p>
                          </div>
                        )}
                        {activeLease.additional_occupants && (
                          <div>
                            <p className="text-text-muted">Additional Occupants</p>
                            <p className="font-medium text-navy whitespace-pre-line">{activeLease.additional_occupants}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Terms */}
                    {activeLease.terms && (
                      <div className="border-t border-sage/40 pt-4">
                        <p className="text-text-muted mb-1">Additional Terms</p>
                        <p className="text-navy whitespace-pre-line">{activeLease.terms}</p>
                      </div>
                    )}

                    {/* Lease status */}
                    <div className="border-t border-sage/40 pt-4 space-y-3">
                      <p className="text-xs uppercase tracking-wide text-text-muted">
                        Lease Status
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-navy font-medium">Tenant acceptance</p>
                          <p className="text-text-muted">
                            {activeLease.tenant_signed_at
                              ? `Accepted on ${formatDate(activeLease.tenant_signed_at)}`
                              : "Awaiting tenant acceptance"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-navy font-medium">Your confirmation</p>
                          <p className="text-text-muted">
                            {activeLease.landlord_signed_at
                              ? `Confirmed on ${formatDate(activeLease.landlord_signed_at)}`
                              : "Not yet confirmed"}
                          </p>
                        </div>
                        {!activeLease.landlord_signed_at && (
                          <Button
                            size="sm"
                            onClick={handleAcknowledgeLease}
                            disabled={acknowledging}
                            className="bg-teal hover:bg-teal-dark text-white flex-shrink-0"
                          >
                            {acknowledging ? "Confirming..." : "Confirm lease"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
    </div>
  )
}
