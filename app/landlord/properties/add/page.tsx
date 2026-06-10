"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Home,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react"
import { toast } from "sonner"
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

const PROVINCES = [
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
]

const PROPERTY_STATUS = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Under Maintenance" },
]

const PARKING_TYPES = [
  { value: "none", label: "No Parking" },
  { value: "street", label: "Street" },
  { value: "lot", label: "Lot" },
  { value: "garage", label: "Garage" },
  { value: "underground", label: "Underground" },
  { value: "covered", label: "Covered" },
]

const LAUNDRY_OPTIONS = [
  { value: "none", label: "No Laundry" },
  { value: "in-unit", label: "In-Unit" },
  { value: "shared", label: "Shared" },
  { value: "hookups", label: "Hookups Only" },
]

const PET_POLICIES = [
  { value: "no-pets", label: "No Pets" },
  { value: "cats-only", label: "Cats Only" },
  { value: "dogs-only", label: "Dogs Only" },
  { value: "all-pets", label: "All Pets" },
  { value: "case-by-case", label: "Case by Case" },
]

const AMENITIES = [
  "Gym",
  "Pool",
  "Rooftop",
  "Doorman",
  "Elevator",
  "Storage",
  "Bike Storage",
  "Package Room",
  "Courtyard",
  "BBQ",
  "Playground",
  "24/7 Security",
]

const UTILITIES = [
  "Water",
  "Gas",
  "Electricity",
  "Heat",
  "Internet",
  "Cable",
  "Trash",
]

type PropertyType = "single" | "multi" | null

interface UnitType {
  id: string
  bedrooms: number
  bathrooms: number
  rent: number
  deposit: number
}

interface FloorUnit {
  id: string
  unitTypeId: string
  count: number
}

interface Floor {
  id: string
  number: number
  units: FloorUnit[]
}

export default function AddPropertyPage() {
  const router = useRouter()
  const [propertyType, setPropertyType] = useState<PropertyType>(null)
  const [currentStep, setCurrentStep] = useState(0)

  // Single Unit Form State
  const [singleForm, setSingleForm] = useState({
    name: "",
    type: "",
    status: "vacant",
    description: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: "",
    parkingType: "none",
    parkingSpaces: 0,
    laundry: "none",
    petPolicy: "no-pets",
    yearBuilt: "",
    amenities: [] as string[],
    utilities: [] as string[],
    monthlyRent: "",
    securityDeposit: "",
    availableFrom: "",
    eTransferEmail: "",
  })

  // Multi Unit Form State
  const [multiForm, setMultiForm] = useState({
    name: "",
    status: "vacant",
    description: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    unitTypes: [{ id: "1", bedrooms: 1, bathrooms: 1, rent: 0, deposit: 0 }] as UnitType[],
    totalFloors: 1,
    yearBuilt: "",
    floors: [{ id: "1", number: 1, units: [] as FloorUnit[] }] as Floor[],
    amenities: [] as string[],
  })

  const [showUnitPreview, setShowUnitPreview] = useState(false)

  const totalSteps = propertyType === "single" ? 4 : 5

  const handleBack = () => {
    if (currentStep === 0) {
      setPropertyType(null)
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
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be signed in to add a property.")
      return
    }

    const formData =
      propertyType === "single"
        ? {
            name: singleForm.name,
            property_type: singleForm.type,
            status: singleForm.status || "vacant",
            address: singleForm.streetAddress,
            city: singleForm.city,
            province: singleForm.province,
            postal_code: singleForm.postalCode,
            description: singleForm.description,
            bedrooms: singleForm.bedrooms ? String(singleForm.bedrooms) : "",
            bathrooms: singleForm.bathrooms ? String(singleForm.bathrooms) : "",
            square_feet: singleForm.squareFeet,
            rent_amount: singleForm.monthlyRent,
            deposit_amount: singleForm.securityDeposit,
            total_units: "",
            total_floors: "",
          }
        : {
            name: multiForm.name,
            property_type: "building",
            status: multiForm.status || "vacant",
            address: multiForm.streetAddress,
            city: multiForm.city,
            province: multiForm.province,
            postal_code: multiForm.postalCode,
            description: multiForm.description,
            bedrooms: "",
            bathrooms: "",
            square_feet: "",
            rent_amount: "",
            deposit_amount: "",
            total_units: String(calculateTotalUnits()),
            total_floors: String(multiForm.totalFloors),
          }

    const { error } = await supabase.from("properties").insert({
      landlord_id: user.id,
      name: formData.name,
      property_type: formData.property_type,
      status: formData.status || "vacant",
      address: formData.address,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postal_code,
      country: "Canada",
      description: formData.description,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
      square_feet: formData.square_feet ? parseInt(formData.square_feet) : null,
      rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
      deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
      total_units: formData.total_units ? parseInt(formData.total_units) : null,
      total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    router.push("/landlord/properties")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount)
  }

  // Calculate total units for multi-unit building
  const calculateTotalUnits = () => {
    return multiForm.floors.reduce((total, floor) => {
      return total + floor.units.reduce((floorTotal, unit) => floorTotal + unit.count, 0)
    }, 0)
  }

  // Generate unit numbers preview
  const generateUnitNumbers = () => {
    const units: string[] = []
    multiForm.floors.forEach((floor) => {
      let unitNum = 1
      floor.units.forEach((unit) => {
        for (let i = 0; i < unit.count; i++) {
          units.push(`${floor.number}${String(unitNum).padStart(2, "0")}`)
          unitNum++
        }
      })
    })
    return units
  }

  // Update floors when totalFloors changes
  const handleTotalFloorsChange = (value: number) => {
    const newFloors: Floor[] = []
    for (let i = 1; i <= value; i++) {
      const existingFloor = multiForm.floors.find((f) => f.number === i)
      if (existingFloor) {
        newFloors.push(existingFloor)
      } else {
        newFloors.push({ id: String(i), number: i, units: [] })
      }
    }
    setMultiForm((prev) => ({ ...prev, totalFloors: value, floors: newFloors }))
  }

  // Property Type Selection Screen
  if (propertyType === null) {
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

        <h1 className="text-2xl font-medium text-navy mb-2">Add New Property</h1>
        <p className="text-text-muted mb-8">What type of property are you adding?</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPropertyType("single")}
            className={cn(
              "p-6 rounded-lg border-2 text-left transition-all hover:border-teal",
              "border-sage bg-white"
            )}
          >
            <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-navy" />
            </div>
            <h3 className="text-lg font-medium text-navy mb-1">Single Unit Property</h3>
            <p className="text-sm text-text-muted">House, condo, townhouse, or studio</p>
          </button>

          <button
            onClick={() => setPropertyType("multi")}
            className={cn(
              "p-6 rounded-lg border-2 text-left transition-all hover:border-teal",
              "border-sage bg-white"
            )}
          >
            <div className="w-12 h-12 rounded-lg bg-sage/30 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-navy" />
            </div>
            <h3 className="text-lg font-medium text-navy mb-1">Multi-Unit Building</h3>
            <p className="text-sm text-text-muted">Apartment building with multiple units</p>
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

  // Single Unit Steps
  const SingleUnitStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Property Information</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-navy">Property Name *</Label>
          <Input
            id="name"
            value={singleForm.name}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Oak Street House"
            className="mt-1.5 border-sage"
          />
        </div>
        <div>
          <Label htmlFor="type" className="text-navy">Property Type *</Label>
          <Select
            value={singleForm.type}
            onValueChange={(value) => setSingleForm((prev) => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="mt-1.5 border-sage">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status" className="text-navy">Status *</Label>
          <Select
            value={singleForm.status}
            onValueChange={(value) => setSingleForm((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="mt-1.5 border-sage">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description" className="text-navy">Description (Optional)</Label>
          <Textarea
            id="description"
            value={singleForm.description}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your property..."
            className="mt-1.5 border-sage min-h-[100px]"
          />
        </div>
      </div>
    </div>
  )

  const SingleUnitStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Property Address</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="streetAddress" className="text-navy">Street Address *</Label>
          <Input
            id="streetAddress"
            value={singleForm.streetAddress}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, streetAddress: e.target.value }))}
            placeholder="123 Main Street"
            className="mt-1.5 border-sage"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="text-navy">City *</Label>
            <Input
              id="city"
              value={singleForm.city}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Victoria"
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="province" className="text-navy">Province *</Label>
            <Select
              value={singleForm.province}
              onValueChange={(value) => setSingleForm((prev) => ({ ...prev, province: value }))}
            >
              <SelectTrigger className="mt-1.5 border-sage">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province.value} value={province.value}>
                    {province.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode" className="text-navy">Postal Code *</Label>
            <Input
              id="postalCode"
              value={singleForm.postalCode}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              placeholder="A1A 1A1"
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="country" className="text-navy">Country</Label>
            <Input
              id="country"
              value={singleForm.country}
              disabled
              className="mt-1.5 border-sage bg-sage/10"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const SingleUnitStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Property Details & Amenities</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="bedrooms" className="text-navy">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              value={singleForm.bedrooms}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="bathrooms" className="text-navy">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              step={0.5}
              value={singleForm.bathrooms}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, bathrooms: parseFloat(e.target.value) || 0 }))}
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="squareFeet" className="text-navy">Square Feet</Label>
            <Input
              id="squareFeet"
              type="number"
              value={singleForm.squareFeet}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, squareFeet: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="parkingType" className="text-navy">Parking Type</Label>
            <Select
              value={singleForm.parkingType}
              onValueChange={(value) => setSingleForm((prev) => ({ ...prev, parkingType: value }))}
            >
              <SelectTrigger className="mt-1.5 border-sage">
                <SelectValue placeholder="Select parking type" />
              </SelectTrigger>
              <SelectContent>
                {PARKING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="parkingSpaces" className="text-navy">Parking Spaces</Label>
            <Input
              id="parkingSpaces"
              type="number"
              min={0}
              value={singleForm.parkingSpaces}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, parkingSpaces: parseInt(e.target.value) || 0 }))}
              className="mt-1.5 border-sage"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="laundry" className="text-navy">Laundry</Label>
            <Select
              value={singleForm.laundry}
              onValueChange={(value) => setSingleForm((prev) => ({ ...prev, laundry: value }))}
            >
              <SelectTrigger className="mt-1.5 border-sage">
                <SelectValue placeholder="Select laundry option" />
              </SelectTrigger>
              <SelectContent>
                {LAUNDRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="petPolicy" className="text-navy">Pet Policy</Label>
            <Select
              value={singleForm.petPolicy}
              onValueChange={(value) => setSingleForm((prev) => ({ ...prev, petPolicy: value }))}
            >
              <SelectTrigger className="mt-1.5 border-sage">
                <SelectValue placeholder="Select pet policy" />
              </SelectTrigger>
              <SelectContent>
                {PET_POLICIES.map((policy) => (
                  <SelectItem key={policy.value} value={policy.value}>
                    {policy.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="yearBuilt" className="text-navy">Year Built (Optional)</Label>
          <Input
            id="yearBuilt"
            type="number"
            value={singleForm.yearBuilt}
            onChange={(e) => setSingleForm((prev) => ({ ...prev, yearBuilt: e.target.value }))}
            placeholder="e.g., 2005"
            className="mt-1.5 border-sage w-32"
          />
        </div>

        <div>
          <Label className="text-navy mb-3 block">Amenities</Label>
          <div className="grid grid-cols-3 gap-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={singleForm.amenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    setSingleForm((prev) => ({
                      ...prev,
                      amenities: checked
                        ? [...prev.amenities, amenity]
                        : prev.amenities.filter((a) => a !== amenity),
                    }))
                  }}
                />
                <span className="text-sm text-navy">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-navy mb-3 block">Utilities Included</Label>
          <div className="grid grid-cols-4 gap-3">
            {UTILITIES.map((utility) => (
              <label key={utility} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={singleForm.utilities.includes(utility)}
                  onCheckedChange={(checked) => {
                    setSingleForm((prev) => ({
                      ...prev,
                      utilities: checked
                        ? [...prev.utilities, utility]
                        : prev.utilities.filter((u) => u !== utility),
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

  const SingleUnitStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Rental Information & Review</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="monthlyRent" className="text-navy">Monthly Rent *</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              <Input
                id="monthlyRent"
                type="number"
                value={singleForm.monthlyRent}
                onChange={(e) => setSingleForm((prev) => ({ ...prev, monthlyRent: e.target.value }))}
                className="pl-7 border-sage"
                placeholder="0.00"
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
                value={singleForm.securityDeposit}
                onChange={(e) => setSingleForm((prev) => ({ ...prev, securityDeposit: e.target.value }))}
                className="pl-7 border-sage"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="availableFrom" className="text-navy">Available From</Label>
            <Input
              id="availableFrom"
              type="date"
              value={singleForm.availableFrom}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, availableFrom: e.target.value }))}
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="eTransferEmail" className="text-navy">e-Transfer Email</Label>
            <Input
              id="eTransferEmail"
              type="email"
              value={singleForm.eTransferEmail}
              onChange={(e) => setSingleForm((prev) => ({ ...prev, eTransferEmail: e.target.value }))}
              placeholder="payments@example.com"
              className="mt-1.5 border-sage"
            />
          </div>
        </div>
      </div>

      {/* Review Summary */}
      <Card className="border-sage/50 mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-navy mb-4">Review Summary</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-sage/30">
              <div>
                <p className="text-sm text-text-muted">Property Name</p>
                <p className="text-sm font-medium text-navy">{singleForm.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Type</p>
                <p className="text-sm font-medium text-navy">
                  {PROPERTY_TYPES.find((t) => t.value === singleForm.type)?.label || "—"}
                </p>
              </div>
            </div>
            <div className="pb-4 border-b border-sage/30">
              <p className="text-sm text-text-muted">Address</p>
              <p className="text-sm font-medium text-navy">
                {singleForm.streetAddress ? `${singleForm.streetAddress}, ${singleForm.city}, ${singleForm.province} ${singleForm.postalCode}` : "—"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-sage/30">
              <div>
                <p className="text-sm text-text-muted">Bedrooms</p>
                <p className="text-sm font-medium text-navy">{singleForm.bedrooms}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Bathrooms</p>
                <p className="text-sm font-medium text-navy">{singleForm.bathrooms}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Square Feet</p>
                <p className="text-sm font-medium text-navy">{singleForm.squareFeet || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Monthly Rent</p>
                <p className="text-sm font-medium text-navy">
                  {singleForm.monthlyRent ? formatCurrency(parseFloat(singleForm.monthlyRent)) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Security Deposit</p>
                <p className="text-sm font-medium text-navy">
                  {singleForm.securityDeposit ? formatCurrency(parseFloat(singleForm.securityDeposit)) : "—"}
                </p>
              </div>
            </div>
            {singleForm.amenities.length > 0 && (
              <div className="pt-4 border-t border-sage/30">
                <p className="text-sm text-text-muted mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {singleForm.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-sage/20 text-navy text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Multi Unit Steps
  const MultiUnitStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Building Information</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-navy">Building Name *</Label>
          <Input
            id="name"
            value={multiForm.name}
            onChange={(e) => setMultiForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., The Viceroy"
            className="mt-1.5 border-sage"
          />
        </div>
        <div>
          <Label htmlFor="status" className="text-navy">Status</Label>
          <Select
            value={multiForm.status}
            onValueChange={(value) => setMultiForm((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="mt-1.5 border-sage">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_STATUS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description" className="text-navy">Description (Optional)</Label>
          <Textarea
            id="description"
            value={multiForm.description}
            onChange={(e) => setMultiForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your building..."
            className="mt-1.5 border-sage min-h-[100px]"
          />
        </div>
      </div>
    </div>
  )

  const MultiUnitStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Building Address</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="streetAddress" className="text-navy">Street Address *</Label>
          <Input
            id="streetAddress"
            value={multiForm.streetAddress}
            onChange={(e) => setMultiForm((prev) => ({ ...prev, streetAddress: e.target.value }))}
            placeholder="1009 Fairfield Road"
            className="mt-1.5 border-sage"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city" className="text-navy">City *</Label>
            <Input
              id="city"
              value={multiForm.city}
              onChange={(e) => setMultiForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Victoria"
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="province" className="text-navy">Province *</Label>
            <Select
              value={multiForm.province}
              onValueChange={(value) => setMultiForm((prev) => ({ ...prev, province: value }))}
            >
              <SelectTrigger className="mt-1.5 border-sage">
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province.value} value={province.value}>
                    {province.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode" className="text-navy">Postal Code *</Label>
            <Input
              id="postalCode"
              value={multiForm.postalCode}
              onChange={(e) => setMultiForm((prev) => ({ ...prev, postalCode: e.target.value }))}
              placeholder="V8V 3A9"
              className="mt-1.5 border-sage"
            />
          </div>
          <div>
            <Label htmlFor="country" className="text-navy">Country</Label>
            <Input
              id="country"
              value={multiForm.country}
              disabled
              className="mt-1.5 border-sage bg-sage/10"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const MultiUnitStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Unit Types & Pricing</h2>
      <p className="text-sm text-text-muted">Define the different unit configurations available in your building.</p>
      
      <div className="space-y-4">
        {multiForm.unitTypes.map((unitType, index) => (
          <Card key={unitType.id} className="border-sage/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-navy text-xs">Bedrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      value={unitType.bedrooms}
                      onChange={(e) => {
                        const newUnitTypes = [...multiForm.unitTypes]
                        newUnitTypes[index].bedrooms = parseInt(e.target.value) || 0
                        setMultiForm((prev) => ({ ...prev, unitTypes: newUnitTypes }))
                      }}
                      className="mt-1 border-sage"
                    />
                  </div>
                  <div>
                    <Label className="text-navy text-xs">Bathrooms</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={unitType.bathrooms}
                      onChange={(e) => {
                        const newUnitTypes = [...multiForm.unitTypes]
                        newUnitTypes[index].bathrooms = parseFloat(e.target.value) || 0
                        setMultiForm((prev) => ({ ...prev, unitTypes: newUnitTypes }))
                      }}
                      className="mt-1 border-sage"
                    />
                  </div>
                  <div>
                    <Label className="text-navy text-xs">Monthly Rent</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                      <Input
                        type="number"
                        value={unitType.rent || ""}
                        onChange={(e) => {
                          const newUnitTypes = [...multiForm.unitTypes]
                          newUnitTypes[index].rent = parseFloat(e.target.value) || 0
                          setMultiForm((prev) => ({ ...prev, unitTypes: newUnitTypes }))
                        }}
                        className="pl-6 border-sage"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-navy text-xs">Security Deposit</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                      <Input
                        type="number"
                        value={unitType.deposit || ""}
                        onChange={(e) => {
                          const newUnitTypes = [...multiForm.unitTypes]
                          newUnitTypes[index].deposit = parseFloat(e.target.value) || 0
                          setMultiForm((prev) => ({ ...prev, unitTypes: newUnitTypes }))
                        }}
                        className="pl-6 border-sage"
                      />
                    </div>
                  </div>
                </div>
                {multiForm.unitTypes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMultiForm((prev) => ({
                        ...prev,
                        unitTypes: prev.unitTypes.filter((_, i) => i !== index),
                      }))
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => {
          setMultiForm((prev) => ({
            ...prev,
            unitTypes: [
              ...prev.unitTypes,
              { id: String(Date.now()), bedrooms: 1, bathrooms: 1, rent: 0, deposit: 0 },
            ],
          }))
        }}
        className="border-navy/20 text-navy hover:bg-navy/5"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Unit Type
      </Button>
    </div>
  )

  const MultiUnitStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Building Details & Floor Builder</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalFloors" className="text-navy">Total Floors *</Label>
          <Input
            id="totalFloors"
            type="number"
            min={1}
            value={multiForm.totalFloors}
            onChange={(e) => handleTotalFloorsChange(parseInt(e.target.value) || 1)}
            className="mt-1.5 border-sage w-24"
          />
        </div>
        <div>
          <Label htmlFor="yearBuilt" className="text-navy">Year Built (Optional)</Label>
          <Input
            id="yearBuilt"
            type="number"
            value={multiForm.yearBuilt}
            onChange={(e) => setMultiForm((prev) => ({ ...prev, yearBuilt: e.target.value }))}
            placeholder="e.g., 2005"
            className="mt-1.5 border-sage w-24"
          />
        </div>
      </div>

      <div className="bg-sage/10 rounded-lg p-4">
        <p className="text-sm text-navy font-medium">Total Units: {calculateTotalUnits()}</p>
      </div>

      <div className="space-y-4">
        {multiForm.floors.map((floor, floorIndex) => (
          <Card key={floor.id} className="border-sage/50">
            <CardContent className="p-4">
              <h4 className="font-medium text-navy mb-4">Floor {floor.number}</h4>
              <div className="space-y-3">
                {floor.units.map((unit, unitIndex) => (
                  <div key={unit.id} className="flex items-center gap-3">
                    <Select
                      value={unit.unitTypeId}
                      onValueChange={(value) => {
                        const newFloors = [...multiForm.floors]
                        newFloors[floorIndex].units[unitIndex].unitTypeId = value
                        setMultiForm((prev) => ({ ...prev, floors: newFloors }))
                      }}
                    >
                      <SelectTrigger className="w-48 border-sage">
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {multiForm.unitTypes.map((ut) => (
                          <SelectItem key={ut.id} value={ut.id}>
                            {ut.bedrooms} bed / {ut.bathrooms} bath
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-text-muted">Count:</Label>
                      <Input
                        type="number"
                        min={1}
                        value={unit.count}
                        onChange={(e) => {
                          const newFloors = [...multiForm.floors]
                          newFloors[floorIndex].units[unitIndex].count = parseInt(e.target.value) || 1
                          setMultiForm((prev) => ({ ...prev, floors: newFloors }))
                        }}
                        className="w-20 border-sage"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newFloors = [...multiForm.floors]
                        newFloors[floorIndex].units = newFloors[floorIndex].units.filter((_, i) => i !== unitIndex)
                        setMultiForm((prev) => ({ ...prev, floors: newFloors }))
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFloors = [...multiForm.floors]
                    newFloors[floorIndex].units.push({
                      id: String(Date.now()),
                      unitTypeId: multiForm.unitTypes[0]?.id || "",
                      count: 1,
                    })
                    setMultiForm((prev) => ({ ...prev, floors: newFloors }))
                  }}
                  className="border-navy/20 text-navy hover:bg-navy/5"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Unit Type to Floor
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unit Number Preview */}
      {calculateTotalUnits() > 0 && (
        <div className="border border-sage/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowUnitPreview(!showUnitPreview)}
            className="w-full flex items-center justify-between p-4 bg-sage/10 hover:bg-sage/20 transition-colors"
          >
            <span className="text-sm font-medium text-navy">Unit Number Preview</span>
            {showUnitPreview ? (
              <ChevronUp className="h-4 w-4 text-navy" />
            ) : (
              <ChevronDown className="h-4 w-4 text-navy" />
            )}
          </button>
          {showUnitPreview && (
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {generateUnitNumbers().map((unitNum, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-sage/20 text-navy text-xs rounded"
                  >
                    {unitNum}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const MultiUnitStep5 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-navy">Amenities & Review</h2>
      
      <div>
        <Label className="text-navy mb-3 block">Building Amenities</Label>
        <div className="grid grid-cols-3 gap-3">
          {AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={multiForm.amenities.includes(amenity)}
                onCheckedChange={(checked) => {
                  setMultiForm((prev) => ({
                    ...prev,
                    amenities: checked
                      ? [...prev.amenities, amenity]
                      : prev.amenities.filter((a) => a !== amenity),
                  }))
                }}
              />
              <span className="text-sm text-navy">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Review Summary */}
      <Card className="border-sage/50 mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-navy mb-4">Review Summary</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-sage/30">
              <div>
                <p className="text-sm text-text-muted">Building Name</p>
                <p className="text-sm font-medium text-navy">{multiForm.name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Units</p>
                <p className="text-sm font-medium text-navy">{calculateTotalUnits()}</p>
              </div>
            </div>
            <div className="pb-4 border-b border-sage/30">
              <p className="text-sm text-text-muted">Address</p>
              <p className="text-sm font-medium text-navy">
                {multiForm.streetAddress ? `${multiForm.streetAddress}, ${multiForm.city}, ${multiForm.province} ${multiForm.postalCode}` : "—"}
              </p>
            </div>
            <div className="pb-4 border-b border-sage/30">
              <p className="text-sm text-text-muted mb-2">Unit Types</p>
              <div className="space-y-2">
                {multiForm.unitTypes.map((ut) => (
                  <div key={ut.id} className="flex items-center justify-between text-sm">
                    <span className="text-navy">{ut.bedrooms} bed / {ut.bathrooms} bath</span>
                    <span className="text-navy font-medium">{formatCurrency(ut.rent)}/mo</span>
                  </div>
                ))}
              </div>
            </div>
            {multiForm.amenities.length > 0 && (
              <div>
                <p className="text-sm text-text-muted mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {multiForm.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-sage/20 text-navy text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Render current step
  const renderStep = () => {
    if (propertyType === "single") {
      switch (currentStep) {
        case 0:
          return SingleUnitStep1()
        case 1:
          return SingleUnitStep2()
        case 2:
          return SingleUnitStep3()
        case 3:
          return SingleUnitStep4()
        default:
          return null
      }
    } else {
      switch (currentStep) {
        case 0:
          return MultiUnitStep1()
        case 1:
          return MultiUnitStep2()
        case 2:
          return MultiUnitStep3()
        case 3:
          return MultiUnitStep4()
        case 4:
          return MultiUnitStep5()
        default:
          return null
      }
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

      <StepIndicator />

      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-sage/30">
        <Button
          variant="outline"
          onClick={handleBack}
          className="border-navy/20 text-navy hover:bg-navy/5"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-teal hover:bg-teal-dark text-white"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Submit
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
