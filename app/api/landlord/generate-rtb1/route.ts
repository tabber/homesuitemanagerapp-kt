import { createClient } from "@/lib/supabase/server"
import { generateLeaseForm } from "@/lib/lease-forms"
import type { LeaseFormData, LeaseParty } from "@/lib/lease-forms/types"
import { NextResponse } from "next/server"

// Split a stored full name into { last, first } for the RTB-1's split boxes.
// Business names go entirely in the last-name box (per the form's instructions),
// which we approximate: if there's no space, treat it as last name.
function splitName(full: string | null | undefined, isBusiness = false): LeaseParty {
  const name = (full ?? "").trim()
  if (!name) return { last: "", first: "" }
  if (isBusiness || !name.includes(" ")) return { last: name, first: "" }
  const parts = name.split(/\s+/)
  const last = parts.pop() as string
  return { last, first: parts.join(" ") }
}

function utilitiesToIncludedList(utilities_included: unknown): string[] {
  if (!utilities_included) return []
  if (Array.isArray(utilities_included)) return utilities_included.map(String)
  if (typeof utilities_included === "object") {
    return Object.entries(utilities_included as Record<string, unknown>)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
  }
  return []
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { leaseId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.leaseId) {
    return NextResponse.json({ error: "Missing leaseId" }, { status: 400 })
  }

  // Load the lease (RLS ensures the landlord owns it).
  const { data: lease, error: leaseErr } = await supabase
    .from("leases")
    .select("*")
    .eq("id", body.leaseId)
    .maybeSingle()
  if (leaseErr || !lease) {
    return NextResponse.json({ error: "Lease not found" }, { status: 404 })
  }

  // Property + unit for the address.
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", lease.property_id)
    .maybeSingle()
  let unitNumber = ""
  if (lease.unit_id) {
    const { data: unit } = await supabase
      .from("units")
      .select("unit_number")
      .eq("id", lease.unit_id)
      .maybeSingle()
    unitNumber = unit?.unit_number ?? ""
  }

  // Build the RTB-1 data from the lease.
  const rentIncludes = utilitiesToIncludedList(lease.utilities_included)
  if (lease.rent_includes) {
    // free-text rent_includes: split on commas as extra hints
    for (const t of String(lease.rent_includes).split(",")) {
      const s = t.trim()
      if (s) rentIncludes.push(s)
    }
  }

  const data: LeaseFormData = {
    landlords: [splitName(lease.landlord_name, true)],
    tenants: [splitName(lease.tenant_name)],
    tenant_phone: lease.tenant_phone ?? undefined,
    tenant_email: lease.tenant_email ?? undefined,
    rental_unit: {
      unit: unitNumber || undefined,
      street: property?.address ?? undefined,
      city: property?.city ?? undefined,
      province: property?.province ?? undefined,
      postal: property?.postal_code ?? undefined,
    },
    service_address: lease.landlord_address_for_service
      ? { street: lease.landlord_address_for_service }
      : undefined,
    landlord_phone: lease.landlord_phone ?? undefined,
    landlord_email: lease.landlord_email ?? undefined,
    start_date: lease.start_date ?? undefined,
    tenancy_type: (lease.tenancy_type as "fixed" | "periodic") ?? "fixed",
    periodic_type: (lease.periodic_type as any) ?? "monthly",
    end_date: lease.end_date ?? undefined,
    end_of_term_action: (lease.end_of_term_action as any) ?? "periodic",
    monthly_rent: lease.monthly_rent ?? undefined,
    rent_due_day: lease.payment_due_day ?? undefined,
    rent_includes: rentIncludes,
    parking_spaces: lease.num_vehicles ?? undefined,
    security_deposit: lease.security_deposit ?? undefined,
    pet_deposit: lease.pet_deposit ?? undefined,
    additional_terms: lease.terms ?? undefined,
  }

  // Pick the province from the property; the engine fills the official form if
  // registered, else generates the generic fallback.
  const provinceCode = (property?.province ?? "").toString().toUpperCase()

  let filled: Uint8Array
  let formLabel = "lease agreement"
  try {
    const result = await generateLeaseForm(provinceCode, data)
    filled = result.bytes
    formLabel = result.formLabel
  } catch (err) {
    console.error("[generate-rtb1] fill failed:", err)
    return NextResponse.json({ error: "Could not generate the agreement" }, { status: 500 })
  }

  // Upload to storage and record it as a document on the lease.
  const fileName = `${formLabel}${lease.tenant_name ? ` - ${lease.tenant_name}` : ""}.pdf`
  const filePath = `${lease.id}/${Date.now()}-rtb1.pdf`
  const { error: uploadErr } = await supabase.storage
    .from("documents")
    .upload(filePath, filled, { contentType: "application/pdf", upsert: false })
  if (uploadErr) {
    console.error("[generate-rtb1] upload failed:", uploadErr.message)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { error: docErr } = await supabase.from("documents").insert({
    lease_id: lease.id,
    property_id: lease.property_id,
    uploaded_by: user.id,
    document_type: "lease",
    file_url: filePath,
    file_name: fileName,
    file_size: filled.length,
  })
  if (docErr) {
    console.error("[generate-rtb1] documents insert failed:", docErr.message)
    return NextResponse.json({ error: docErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, fileName })
}
