// Province-agnostic lease data + form registry types.
//
// The "launch pad": one generic engine fills any province's official form from a
// single LeaseFormData shape, using a per-province mapping. Provinces with no
// registered official form fall back to a generated HomeSuite agreement.

export interface LeaseParty {
  last: string
  first: string
}

export interface LeaseAddress {
  unit?: string
  street?: string
  city?: string
  province?: string
  postal?: string
}

// The single, province-neutral representation of a lease. Every province mapping
// reads from this — so the app only ever builds this one object.
export interface LeaseFormData {
  landlords: LeaseParty[]
  tenants: LeaseParty[]
  tenant_phone?: string
  tenant_email?: string
  landlord_phone?: string
  landlord_email?: string
  rental_unit: LeaseAddress
  service_address?: LeaseAddress
  start_date?: string // ISO yyyy-mm-dd
  tenancy_type?: "periodic" | "fixed"
  periodic_type?: "monthly" | "weekly" | "biweekly" | "other"
  end_date?: string
  end_of_term_action?: "periodic" | "vacate"
  monthly_rent?: number | string
  rent_due_day?: string | number
  rent_includes?: string[]
  parking_spaces?: string | number
  security_deposit?: number | string
  pet_deposit?: number | string
  additional_terms?: string
}

// A registered province: either an official fillable PDF form + mapping, or
// nothing (→ the generic fallback is used).
export interface ProvinceForm {
  code: string // 'BC', 'ON', ...
  name: string
  // Official form info (present only when we've mapped that province's PDF).
  official?: {
    formId: string // e.g. 'RTB-1', 'Form 2229'
    templateFile: string // filename under public/forms/
    // Fills the loaded PDF form from lease data. Kept per-province because each
    // official form has its own field ids/quirks.
    fill: (template: Uint8Array, data: LeaseFormData) => Promise<Uint8Array>
  }
  // Whether this province LEGALLY MANDATES its official form (Ontario, Quebec).
  // Drives the honesty labeling in the UI/fallback.
  officialMandatory?: boolean
}
