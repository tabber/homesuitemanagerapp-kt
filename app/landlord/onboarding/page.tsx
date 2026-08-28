"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Check, User, Home as HomeIcon, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const provinces = [
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

const propertyTypes = [
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "apartment", label: "Apartment" },
  { value: "townhouse", label: "Townhouse" },
  { value: "duplex", label: "Duplex" },
  { value: "multiplex", label: "Multiplex" },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-medium text-navy">HomeSuite</span>
    </Link>
  )
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ["Your Profile", "First Property", "You're Ready"]

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isComplete && "bg-teal text-white",
                  isCurrent && "bg-navy text-white",
                  !isComplete && !isCurrent && "bg-sage/50 text-text-muted"
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={cn(
                  "text-sm hidden sm:inline",
                  isCurrent ? "text-navy font-medium" : "text-text-muted"
                )}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-2",
                  stepNumber < currentStep ? "bg-teal" : "bg-sage/50"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function LandlordOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1 - Profile
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")

  // Step 2 - Property
  const [propertyName, setPropertyName] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [streetAddress, setStreetAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("")
  const [postalCode, setPostalCode] = useState("")

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = async () => {
    if (isLoading) return
    setIsLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      toast.error("You must be signed in to finish setup.")
      return
    }

    // Save the profile details from step 1
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        company_name: company || null,
        profile_completed: true,
      })
      .eq("id", user.id)

    if (profileError) {
      setIsLoading(false)
      toast.error(profileError.message)
      return
    }

    // Save the first property from step 2, if they filled it in
    if (propertyName && streetAddress) {
      const { error: propertyError } = await supabase.from("properties").insert({
        landlord_id: user.id,
        name: propertyName,
        property_type: propertyType || "house",
        status: "vacant",
        address: streetAddress,
        city: city || null,
        province: province || null,
        postal_code: postalCode || null,
        country: "Canada",
      })

      if (propertyError) {
        setIsLoading(false)
        toast.error(propertyError.message)
        return
      }
    }

    setIsLoading(false)
    toast.success("You're all set")
    router.push("/landlord")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <StepIndicator currentStep={step} />

          <Card className="border-[0.5px] border-sage">
            <CardContent className="p-6">
              {/* Step 1: Profile */}
              {step === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-navy">Your Profile</h2>
                      <p className="text-sm text-text-muted">Tell us about yourself</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName" className="text-text-primary">First name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="mt-1 border-sage focus:ring-teal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-text-primary">Last name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="mt-1 border-sage focus:ring-teal"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-text-primary">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="mt-1 border-sage focus:ring-teal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-text-primary">
                        Company name <span className="text-text-muted">(optional)</span>
                      </Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="mt-1 border-sage focus:ring-teal"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full mt-6 bg-teal hover:bg-teal-dark text-white"
                    disabled={!firstName || !lastName || !phone}
                  >
                    Continue
                  </Button>
                </>
              )}

              {/* Step 2: Property */}
              {step === 2 && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                      <HomeIcon className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <h2 className="text-lg font-medium text-navy">Add Your First Property</h2>
                      <p className="text-sm text-text-muted">You can add more properties later</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="propertyName" className="text-text-primary">Property name</Label>
                        <Input
                          id="propertyName"
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          placeholder="e.g., Main Street Duplex"
                          required
                          className="mt-1 border-sage focus:ring-teal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="propertyType" className="text-text-primary">Property type</Label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                          <SelectTrigger className="mt-1 border-sage">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="streetAddress" className="text-text-primary">Street address</Label>
                      <Input
                        id="streetAddress"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        required
                        className="mt-1 border-sage focus:ring-teal"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="city" className="text-text-primary">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="mt-1 border-sage focus:ring-teal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="province" className="text-text-primary">Province</Label>
                        <Select value={province} onValueChange={setProvince}>
                          <SelectTrigger className="mt-1 border-sage">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((prov) => (
                              <SelectItem key={prov.value} value={prov.value}>
                                {prov.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-text-primary">Postal code</Label>
                        <Input
                          id="postalCode"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="A1A 1A1"
                          required
                          className="mt-1 border-sage focus:ring-teal"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-navy/20 text-navy hover:bg-navy/5"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-1 bg-teal hover:bg-teal-dark text-white"
                      disabled={!propertyName || !propertyType || !streetAddress || !city || !province || !postalCode}
                    >
                      Continue
                    </Button>
                  </div>
                </>
              )}

              {/* Step 3: Complete */}
              {step === 3 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-6">
                    <PartyPopper className="h-8 w-8 text-navy" />
                  </div>
                  <h2 className="text-2xl font-medium text-navy mb-2">{"You're"} all set!</h2>
                  <p className="text-text-muted mb-8">
                    Your account is ready. Start managing your properties with HomeSuite.
                  </p>

                  <div className="bg-cream/50 rounded-lg p-4 mb-8 text-left">
                    <h3 className="text-sm font-medium text-navy mb-3">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Name</span>
                        <span className="text-text-primary">{firstName} {lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Phone</span>
                        <span className="text-text-primary">{phone}</span>
                      </div>
                      {company && (
                        <div className="flex justify-between">
                          <span className="text-text-muted">Company</span>
                          <span className="text-text-primary">{company}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-text-muted">Property</span>
                        <span className="text-text-primary">{propertyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Location</span>
                        <span className="text-text-primary">{city}, {province}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-navy/20 text-navy hover:bg-navy/5"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleFinish}
                      className="flex-1 bg-teal hover:bg-teal-dark text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Setting up..." : "Go to Dashboard"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
