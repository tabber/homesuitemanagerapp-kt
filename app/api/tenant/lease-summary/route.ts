import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // 1. Authenticate
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Find this tenant's lease: either already linked, or pending and
    //    addressed to their email. Admin client bypasses RLS, which can't
    //    see a pending lease that has no tenant_id yet.
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select(
        `
        id,
        status,
        start_date,
        end_date,
        monthly_rent,
        security_deposit,
        payment_due_day,
        tenant_name,
        tenant_email,
        tenant_phone,
        tenant_id,
        landlord_id,
        landlord_name,
        landlord_email,
        landlord_phone,
        property_id,
        unit_id,
        pets_allowed,
        pet_details,
        num_vehicles,
        vehicle_details,
        parking_details,
        smoking_allowed,
        utilities_included,
        additional_tenants,
        additional_occupants,
        terms,
        notes,
        etransfer_email,
        created_at
      `
      )
      .or(
        `tenant_id.eq.${user.id},and(status.eq.pending,tenant_email.eq.${user.email})`
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (leaseError) {
      return NextResponse.json({ error: leaseError.message }, { status: 500 })
    }

    if (!lease) {
      return NextResponse.json({ lease: null })
    }

    // 3. Fetch the property (admin client — a pending tenant has no RLS access yet)
    let property = null
    if (lease.property_id) {
      const { data } = await supabaseAdmin
        .from("properties")
        .select("id, name, address, city, province, postal_code, property_type, images")
        .eq("id", lease.property_id)
        .maybeSingle()
      property = data
    }

    // 4. Fetch the unit, if this lease is for one
    let unit = null
    if (lease.unit_id) {
      const { data } = await supabaseAdmin
        .from("units")
        .select("id, unit_number, floor, bedrooms, bathrooms, square_feet")
        .eq("id", lease.unit_id)
        .maybeSingle()
      unit = data
    }

    // 5. Fetch the landlord profile, falling back to the lease's text fields
    let landlord = null
    if (lease.landlord_id) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, first_name, last_name, email, phone, company_name")
        .eq("id", lease.landlord_id)
        .maybeSingle()

      if (data) {
        landlord = {
          id: data.id,
          name:
            [data.first_name, data.last_name].filter(Boolean).join(" ") ||
            lease.landlord_name ||
            "Your landlord",
          email: data.email ?? lease.landlord_email,
          phone: data.phone ?? lease.landlord_phone,
          company_name: data.company_name,
        }
      }
    }

    if (!landlord) {
      landlord = {
        id: lease.landlord_id,
        name: lease.landlord_name ?? "Your landlord",
        email: lease.landlord_email,
        phone: lease.landlord_phone,
        company_name: null,
      }
    }

    return NextResponse.json({
      lease: {
        ...lease,
        property,
        unit,
        landlord,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load lease" },
      { status: 500 }
    )
  }
}
