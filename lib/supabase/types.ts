export type UserRole = "admin" | "landlord" | "tenant"
export type SubscriptionStatus = "trial" | "essential" | "expired"
export type PropertyStatus = "vacant" | "occupied" | "maintenance"
export type LeaseStatus = "pending" | "active" | "expired" | "terminated"
export type PaymentStatus = "pending" | "completed" | "failed"
export type MaintenancePriority = "low" | "medium" | "high" | "urgent"
export type MaintenanceStatus = "open" | "in_progress" | "completed" | "cancelled"

export interface Profile {
  id: string
  email: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  subscription_status: SubscriptionStatus
  trial_end_date: string | null
  stripe_customer_id: string | null
  profile_completed: boolean
  created_at: string
}

export interface Property {
  id: string
  landlord_id: string
  name: string
  property_type: "house" | "condo" | "townhouse" | "studio" | "apartment"
  status: PropertyStatus
  address: string
  city: string
  province: string
  postal_code: string
  country: string
  description: string | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  rent_amount: number | null
  deposit_amount: number | null
  total_units: number | null
  total_floors: number | null
  etransfer_email: string | null
  created_at: string
}

export interface Unit {
  id: string
  property_id: string
  unit_number: string
  floor: number | null
  bedrooms: number | null
  bathrooms: number | null
  rent_amount: number | null
  status: PropertyStatus
  tenant_id: string | null
  created_at: string
}

export interface Lease {
  id: string
  property_id: string
  unit_id: string | null
  landlord_id: string
  tenant_id: string | null
  tenant_name: string | null
  tenant_email: string | null
  tenant_phone: string | null
  start_date: string
  end_date: string
  monthly_rent: number
  security_deposit: number | null
  payment_due_day: number
  status: LeaseStatus
  etransfer_email: string | null
  created_at: string
}

export interface Payment {
  id: string
  lease_id: string
  property_id: string | null
  unit_id: string | null
  tenant_id: string | null
  landlord_id: string | null
  amount: number
  payment_date: string
  payment_method: string
  status: PaymentStatus
  description: string | null
  created_at: string
}

export interface MaintenanceRequest {
  id: string
  property_id: string | null
  unit_id: string | null
  tenant_id: string | null
  landlord_id: string | null
  title: string
  description: string | null
  category: string | null
  priority: MaintenancePriority
  status: MaintenanceStatus
  scheduled_date: string | null
  contractor_id: string | null
  photos: string[]
  landlord_notes: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  lease_id: string | null
  subject: string | null
  content: string
  read: boolean
  created_at: string
}

export interface Contractor {
  id: string
  landlord_id: string
  name: string
  category: string
  phone: string | null
  email: string | null
  website: string | null
  notes: string | null
  preferred: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "payment" | "lease" | "maintenance" | "message" | "system"
  read: boolean
  link: string | null
  created_at: string
}
