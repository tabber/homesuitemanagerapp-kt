"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  Home,
  Building2,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const UTILITIES = [
  "Water",
  "Gas",
  "Electricity",
  "Heat",
  "Internet",
  "Cable",
  "Trash",
]

type VacantUnit = {
  id: string
  number: string
  bedrooms: number
  bathrooms: number
  rent: number
}

type PropertyOption = {
  id: string
  name: string
  address: string
  type: string
  monthlyRent: number
  vacantUnits: VacantUnit[]
}

type TenantOption = {
  id: string
  name: string
  email: string
  phone: string
}

type LeaseType = "create" | "upload" | null

export default function CreateLeasePage() {
  const router = useRouter()
  const [leaseType, setLeaseType] = useState<LeaseType>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    // Step 1 - Property & Unit
    propertyId: "",
    unitId: "",
    // Step 2 - Landlord Details
    landlordName: "",
    landlordPhone: "",
    landlordEmail: "",
    eTransferEmail: "",
    // Step 3 - Tenant Details
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    additionalTenants: "",
    additionalOccupants: "",
    petsAllowed: false,
    petDetails: "",
    numberOfVehicles: 0,
    vehicleDetails: "",
    tenantUtilities: [] as string[],
    // Step 4 - Lease Terms
    startDate: "",
    endDate: "",
    monthlyRent: "",
    securityDeposit: "",
    paymentDueDay: "1",
    parkingDetails: "",
    smokingAllowed: false,
    additionalTerms: "",
    internalNotes: "",
    // Step 5 - Documents
    documents: [] as File[],
  })

  const totalSteps = 5
  const selectedProperty = properties.find((p) => p.id === form.propertyId)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Landlord profile -> prefill landlord details
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, email")
        .eq("id", user.id)
        .single()

      // Properties owned by this landlord
      const { data: propertyRows } = await supabase
        .from("properties")
        .select("id, name, address, property_type, rent_amount")
        .eq("landlord_id", user.id)
        .order("created_at", { ascending: true })

      // Vacant units across those properties
      const propertyIds = (propertyRows ?? []).map((p) => p.id)
      let unitRows: any[] = []
      if (propertyIds.length > 0) {
        const { data: units } = await supabase
          .from("units")
          .select("id, property_id, unit_number, bedrooms, bathrooms, rent_amount, status")
          .in("property_id", propertyIds)
          .eq("status", "vacant")
        unitRows = units ?? []
      }

      const mappedProperties: PropertyOption[] = (propertyRows ?? []).map((p) => ({
        id: p.id,
        name: p.name ?? "",
        address: p.address ?? "",
        type: p.property_type === "building" ? "apartment" : "single",
        monthlyRent: p.rent_amount ?? 0,
        vacantUnits: unitRows
          .filter((u) => u.property_id === p.id)
          .map((u) => ({
            id: u.id,
            number: u.unit_number ?? "",
            bedrooms: u.bedrooms ?? 0,
            bathrooms: u.bathrooms ?? 0,
            rent: u.rent_amount ?? 0,
          })),
      }))

      // Tenants available to assign to a lease
      const { data: tenantRows } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone")
        .eq("role", "tenant")

      const mappedTenants: TenantOption[] = (tenantRows ?? []).map((t) => ({
        id: t.id,
        name: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim(),
        email: t.email ?? "",
        phone: t.phone ?? "",
      }))

      if (!isMounted) return

      setProperties(mappedProperties)
      setTenants(mappedTenants)

      if (profile) {
        setForm((prev) => ({
          ...prev,
          landlordName: `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim(),
          landlordPhone: profile.phone ?? "",
          landlordEmail: profile.email ?? "",
        }))
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleBack = () => {
    if (currentStep === 0) {
      setLeaseType(null)
    } else {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleContinue = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be signed in to create a lease.")
      setIsSubmitting(false)
      return
    }

    // Guard the NOT NULL columns so the insert never fails with a 23502 violation
    const monthlyRent = form.monthlyRent ? parseFloat(form.monthlyRent) : NaN
    if (!form.propertyId) {
      toast.error("Please select a property before creating the lease.")
      setIsSubmitting(false)
      return
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Please set both a start date and an end date.")
      setIsSubmitting(false)
      return
    }
    if (Number.isNaN(monthlyRent)) {
      toast.error("Please enter the monthly rent amount.")
      setIsSubmitting(false)
      return
    }

    // Resolve tenant_id by matching the entered email to a tenant profile
    const matchedTenant = tenants.find(
      (t) => t.email && t.email.toLowerCase() === form.tenantEmail.trim().toLowerCase()
    )

   const { data: newLease, error } = await supabase.from("leases").insert({
      property_id: form.propertyId,
      unit_id: form.unitId || null,
      tenant_id: matchedTenant?.id ?? null,
      landlord_id: user.id,
      landlord_name: form.landlordName || null,
      landlord_phone: form.landlordPhone || null,
      landlord_email: form.landlordEmail || null,
      etransfer_email: form.eTransferEmail || null,
      tenant_name: form.tenantName || null,
      tenant_email: form.tenantEmail || null,
      tenant_phone: form.tenantPhone || null,
      additional_tenants: form.additionalTenants || null,
      additional_occupants: form.additionalOccupants || null,
      pets_allowed: form.petsAllowed,
      pet_details: form.petDetails || null,
      num_vehicles: form.numberOfVehicles || null,
      vehicle_details: form.vehicleDetails || null,
      parking_details: form.parkingDetails || null,
      smoking_allowed: form.smokingAllowed,
      utilities_included: form.tenantUtilities,
      start_date: form.startDate,
      end_date: form.endDate,
      monthly_rent: monthlyRent,
      security_deposit: form.securityDeposit ? parseFloat(form.securityDeposit) : null,
      payment_due_day: form.paymentDueDay ? parseInt(form.paymentDueDay) : null,
      terms: form.additionalTerms || null,
      notes: form.internalNotes || null,
      status: "pending",
    }).select("id").single()
    if (error) {
      toast.error(error.message)
      setIsSubmitting(false)
      return
    }
    // Send the tenant invite (best-effort)
    if (form.tenantEmail) {
      try {
        const res = await fetch("/api/landlord/invite-tenant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: newLease.id }),
        })
        if (res.ok) {
          toast.success("Lease created and tenant invited")
        } else {
          toast.success("Lease created (invite could not be sent)")
        }
      } catch {
        toast.success("Lease created (invite could not be sent)")
      }
    }
    router.push("/landlord/properties")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  // Entry Point - Choose Lease Type
  if (leaseType === null) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/landlord/properties")}
            className="text-navy hover:bg-sage/20 -ml-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Properties
          </Button>
        </div>

        <h1 className="text-2xl font-medium text-navy mb-2">Create Lease</h1>
        <p className="text-text-muted mb-8">How would you like to create the lease?</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLeaseType("create")}
            className="p-6 rounded-lg border-2 border-sage bg-white text-left transition-all hover:border-teal"
          >
            <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-navy" />
            </div>
            <h3 className="text-lg font-medium text-navy mb-1">Create New Lease</h3>
            <p className="text-sm text-text-muted">Build a lease from scratch with our step-by-step form</p>
          </button>

          <button
            disabled
            className="p-6 rounded-lg border-2 border-sage bg-sage/10 text-left opacity-70 cursor-not-allowed relative"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-navy bg-sage/30 px-2 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Essential
            </div>
            <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-navy" />
            </div>
            <h3 className="text-lg font-medium text-navy mb-1">Upload Existing Lease</h3>
            <p className="text-sm text-text-muted">Upload a PDF of an existing lease document</p>
          </button>
        </div>
      </div>
    )
  }

  // Step Indicator
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-muted">Step {currentStep + 1} of {totalSteps}</span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              index <= currentStep ? "bg-teal" : "bg-sage/30"
            )}
          />
        ))}
      </div>
    </div>
  )

  // Step 1 - Select Property & Unit
  const Step1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Select Property & Unit</h2>
      <p className="text-sm text-text-muted">Choose the property and unit for this lease.</p>

      <div className="space-y-3">
        {properties.filter((p) => p.type === "single" || p.vacantUnits.length > 0).map((property) => (
          <button
            key={property.id}
            onClick={() => setForm((prev) => ({ ...prev, propertyId: property.id, unitId: "" }))}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all",
              form.propertyId === property.id
                ? "border-teal bg-teal/5"
                : "border-sage bg-white hover:border-teal/50"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-sage/30 flex items-center justify-center">
                {property.type === "apartment" ? (
                  <Building2 className="h-5 w-5 text-navy" />
                ) : (
                  <Home className="h-5 w-5 text-navy" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-navy">{property.name}</h3>
                  <span className="text-sm text-navy font-medium">
                    {formatCurrency(property.monthlyRent)}/mo
                  </span>
                </div>
                <p className="text-sm text-text-muted">{property.address}</p>
                {property.type === "apartment" && (
                  <p className="text-sm text-teal mt-1">
                    {property.vacantUnits.length} units available
                  </p>
                )}
              </div>
              {form.propertyId === property.id && (
                <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Unit Selector for Apartment */}
      {selectedProperty?.type === "apartment" && selectedProperty.vacantUnits.length > 0 && (
        <div className="mt-6">
          <Label className="text-navy mb-3 block">Select Unit</Label>
          <div className="grid grid-cols-3 gap-3">
            {selectedProperty.vacantUnits.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setForm((prev) => ({ ...prev, unitId: unit.id, monthlyRent: String(unit.rent) }))}
                className={cn(
                  "p-4 rounded-lg border-2 text-center transition-all",
                  form.unitId === unit.id
                    ? "border-teal bg-teal/5"
                    : "border-sage bg-white hover:border-teal/50"
                )}
              >
                <p className="font-medium text-navy">Unit {unit.number}</p>
                <p className="text-sm text-text-muted">{unit.bedrooms} bed / {unit.bathrooms} bath</p>
                <p className="text-sm text-navy font-medium mt-1">{formatCurrency(unit.rent)}/mo</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // Step 2 - Landlord Details
  const Step2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Landlord Details</h2>
      <p className="text-sm text-text-muted">Confirm your information for the lease agreement.</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="landlordName" className="text-navy">Name</Label>
          <Input
            id="landlordName"
            value={form.landlordName}
            onChange={(e) => setForm((prev) => ({ ...prev, landlordName: e.target.value }))}
            className="mt-1.5 border-sage"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="landlordPhone" className="text-navy">Phone</Label>
            <Input
              id="landlordPhone"
              value={form.landlordPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, landlordPhone: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="landlordEmail" className="text-navy">Email</Label>
            <Input
              id="landlordEmail"
              type="email"
              value={form.landlordEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, landlordEmail: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="eTransferEmail" className="text-navy">e-Transfer Email</Label>
          <Input
            id="eTransferEmail"
            type="email"
            value={form.eTransferEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, eTransferEmail: e.target.value }))}
            placeholder="payments@example.com"
            className="mt-1.5 border-sage"
          />
          <p className="text-xs text-text-muted mt-1">This email will be used for rent payments via e-Transfer.</p>
        </div>
      </div>
    </div>
  )

  // Step 3 - Tenant Details
  const Step3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Tenant Details</h2>
      <p className="text-sm text-text-muted">Enter the primary tenant information.</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tenantName" className="text-navy">Primary Tenant Name *</Label>
          <Input
            id="tenantName"
            value={form.tenantName}
            onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))}
            placeholder="Full legal name"
            className="mt-1.5 border-sage"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tenantEmail" className="text-navy">Email *</Label>
            <Input
              id="tenantEmail"
              type="email"
              value={form.tenantEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, tenantEmail: e.target.value }))}
              placeholder="tenant@email.com"
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="tenantPhone" className="text-navy">Phone *</Label>
            <Input
              id="tenantPhone"
              value={form.tenantPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, tenantPhone: e.target.value }))}
              placeholder="(604) 555-1234"
              className="mt-1.5 border-sage"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="additionalTenants" className="text-navy">Additional Tenants</Label>
          <Textarea
            id="additionalTenants"
            value={form.additionalTenants}
            onChange={(e) => setForm((prev) => ({ ...prev, additionalTenants: e.target.value }))}
            placeholder="List any additional tenants on the lease (one per line)"
            className="mt-1.5 border-sage min-h-[80px]"
          />
        </div>

        <div>
          <Label htmlFor="additionalOccupants" className="text-navy">Additional Occupants</Label>
          <Textarea
            id="additionalOccupants"
            value={form.additionalOccupants}
            onChange={(e) => setForm((prev) => ({ ...prev, additionalOccupants: e.target.value }))}
            placeholder="List other people who will live in the unit (children, etc.)"
            className="mt-1.5 border-sage min-h-[80px]"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={form.petsAllowed}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, petsAllowed: !!checked }))}
            />
            <span className="text-sm text-navy">Pets allowed</span>
          </label>
          {form.petsAllowed && (
            <div>
              <Label htmlFor="petDetails" className="text-navy">Pet Details</Label>
              <Textarea
                id="petDetails"
                value={form.petDetails}
                onChange={(e) => setForm((prev) => ({ ...prev, petDetails: e.target.value }))}
                placeholder="Describe pets (type, breed, size, etc.)"
                className="mt-1.5 border-sage min-h-[60px]"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numberOfVehicles" className="text-navy">Number of Vehicles</Label>
            <Input
              id="numberOfVehicles"
              type="number"
              min={0}
              value={form.numberOfVehicles}
              onChange={(e) => setForm((prev) => ({ ...prev, numberOfVehicles: parseInt(e.target.value) || 0 }))}
              className="mt-1.5 border-sage"
            />
          </div>
          {form.numberOfVehicles > 0 && (
            <div>
              <Label htmlFor="vehicleDetails" className="text-navy">Vehicle Details</Label>
              <Input
                id="vehicleDetails"
                value={form.vehicleDetails}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicleDetails: e.target.value }))}
                placeholder="Make, model, license plate"
                className="mt-1.5 border-sage"
              />
            </div>
          )}
        </div>

        <div>
          <Label className="text-navy mb-3 block">Utilities Tenant is Responsible For</Label>
          <div className="grid grid-cols-4 gap-3">
            {UTILITIES.map((utility) => (
              <label key={utility} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.tenantUtilities.includes(utility)}
                  onCheckedChange={(checked) => {
                    setForm((prev) => ({
                      ...prev,
                      tenantUtilities: checked
                        ? [...prev.tenantUtilities, utility]
                        : prev.tenantUtilities.filter((u) => u !== utility),
                    }))
                  }}
                />
                <span className="text-sm text-navy">{utility}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Step 4 - Lease Terms
  const Step4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Lease Terms</h2>
      <p className="text-sm text-text-muted">Set the terms and conditions of the lease.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate" className="text-navy">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-navy">End Date *</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="monthlyRent" className="text-navy">Monthly Rent *</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                id="monthlyRent"
                type="number"
                value={form.monthlyRent}
                onChange={(e) => setForm((prev) => ({ ...prev, monthlyRent: e.target.value }))}
                className="pl-7 border-sage"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="securityDeposit" className="text-navy">Security Deposit</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                id="securityDeposit"
                type="number"
                value={form.securityDeposit}
                onChange={(e) => setForm((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                className="pl-7 border-sage"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="paymentDueDay" className="text-navy">Payment Due Day</Label>
          <Select
            value={form.paymentDueDay}
            onValueChange={(value) => setForm((prev) => ({ ...prev, paymentDueDay: value }))}
          >
            <SelectTrigger className="mt-1.5 border-sage w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}{day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-text-muted mt-1">Day of the month rent is due</p>
        </div>

        <div>
          <Label htmlFor="parkingDetails" className="text-navy">Parking Details</Label>
          <Input
            id="parkingDetails"
            value={form.parkingDetails}
            onChange={(e) => setForm((prev) => ({ ...prev, parkingDetails: e.target.value }))}
            placeholder="e.g., 1 underground parking spot included"
            className="mt-1.5 border-sage"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={form.smokingAllowed}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smokingAllowed: !!checked }))}
          />
          <span className="text-sm text-navy">Smoking allowed</span>
        </label>

        <div>
          <Label htmlFor="additionalTerms" className="text-navy">Additional Terms</Label>
          <Textarea
            id="additionalTerms"
            value={form.additionalTerms}
            onChange={(e) => setForm((prev) => ({ ...prev, additionalTerms: e.target.value }))}
            placeholder="Any additional terms or conditions..."
            className="mt-1.5 border-sage min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="internalNotes" className="text-navy">Internal Notes</Label>
          <Textarea
            id="internalNotes"
            value={form.internalNotes}
            onChange={(e) => setForm((prev) => ({ ...prev, internalNotes: e.target.value }))}
            placeholder="Private notes (not visible to tenant)..."
            className="mt-1.5 border-sage min-h-[80px]"
          />
          <p className="text-xs text-text-muted mt-1">These notes are only visible to you.</p>
        </div>
      </div>
    </div>
  )

  // Step 5 - Review & Create
  const Step5 = () => {
    const property = selectedProperty
    const unit = property?.type === "apartment"
      ? property.vacantUnits.find((u) => u.id === form.unitId)
      : null

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-navy">Review & Create</h2>
        <p className="text-sm text-text-muted">Review the lease details before creating.</p>

        <Card className="border-sage/50">
          <CardContent className="p-6 space-y-6">
            {/* Property */}
            <div className="pb-4 border-b border-sage/30">
              <h4 className="text-sm font-medium text-text-muted mb-2">Property</h4>
              <p className="text-navy font-medium">{property?.name}</p>
              <p className="text-sm text-text-muted">{property?.address}</p>
              {unit && <p className="text-sm text-navy mt-1">Unit {unit.number}</p>}
            </div>

            {/* Landlord */}
            <div className="pb-4 border-b border-sage/30">
              <h4 className="text-sm font-medium text-text-muted mb-2">Landlord</h4>
              <p className="text-navy">{form.landlordName}</p>
              <p className="text-sm text-text-muted">{form.landlordEmail} | {form.landlordPhone}</p>
            </div>

            {/* Tenant */}
            <div className="pb-4 border-b border-sage/30">
              <h4 className="text-sm font-medium text-text-muted mb-2">Tenant</h4>
              <p className="text-navy">{form.tenantName || "—"}</p>
              <p className="text-sm text-text-muted">{form.tenantEmail || "—"} | {form.tenantPhone || "—"}</p>
            </div>

            {/* Lease Terms */}
            <div className="pb-4 border-b border-sage/30">
              <h4 className="text-sm font-medium text-text-muted mb-2">Lease Terms</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-muted">Lease Period</p>
                  <p className="text-sm text-navy">
                    {form.startDate && form.endDate
                      ? `${new Date(form.startDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })} - ${new Date(form.endDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Payment Due</p>
                  <p className="text-sm text-navy">{form.paymentDueDay}{form.paymentDueDay === "1" ? "st" : form.paymentDueDay === "2" ? "nd" : form.paymentDueDay === "3" ? "rd" : "th"} of each month</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Monthly Rent</p>
                  <p className="text-sm text-navy font-medium">
                    {form.monthlyRent ? formatCurrency(parseFloat(form.monthlyRent)) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Security Deposit</p>
                  <p className="text-sm text-navy">
                    {form.securityDeposit ? formatCurrency(parseFloat(form.securityDeposit)) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-2">Attach Documents</h4>
              <div className="border-2 border-dashed border-sage rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Upload PDF documents (optional)</p>
                <Button variant="outline" className="mt-3 border-navy/20 text-navy hover:bg-navy/5">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-teal/10 border border-teal/30 rounded-lg p-4">
          <p className="text-sm text-navy">
            After creating the lease, the tenant will receive an email invitation to review and accept the lease terms.
          </p>
        </div>
      </div>
    )
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return Step1()
      case 1:
        return Step2()
      case 2:
        return Step3()
      case 3:
        return Step4()
      case 4:
        return Step5()
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/landlord/properties")}
          className="text-navy hover:bg-sage/20 -ml-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </Button>
      </div>

      {StepIndicator()}

      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-sage/30">
        <Button
          variant="outline"
         onClick={() => setCurrentStep(prev => prev - 1)}
          className="border-navy/20 text-navy hover:bg-navy/5"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={currentStep === totalSteps - 1 ? handleSubmit : () => setCurrentStep(prev => prev + 1)}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Create Lease
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
