import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateWelcomeMessage(tenantName: string, propertyName: string): string {
  return `Welcome to ${propertyName}!

Dear ${tenantName},

Congratulations on your new home! Your lease is now active.

Getting started:
- View your lease details anytime in the My Home section
- Report any maintenance issues through the Maintenance tab
- Keep your contact information up to date in your profile

Rent details and payment instructions are available in your portal.

Feel free to reach out anytime through Messages if you have questions.

Welcome aboard!`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { leaseId } = body

    if (!leaseId) {
      return NextResponse.json({ error: "Missing leaseId" }, { status: 400 })
    }

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify the user is a tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.role !== "tenant") {
      return NextResponse.json(
        { error: "Only tenants can accept leases" },
        { status: 403 }
      )
    }

    // 3. Look up the lease with the admin client (RLS can't see an unlinked pending lease)
    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select(
        `id, tenant_email, tenant_name, status, tenant_id, landlord_id, property_id, unit_id,
         property:properties(name)`
      )
      .eq("id", leaseId)
      .maybeSingle()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 })
    }

    // 4. Authorize: the lease must either already be linked to this user,
    //    or be pending with a tenant_email matching this user's email.
    const emailMatches =
      lease.tenant_email &&
      user.email &&
      lease.tenant_email.trim().toLowerCase() === user.email.trim().toLowerCase()

    const alreadyLinked = lease.tenant_id === user.id

    if (!alreadyLinked && !emailMatches) {
      return NextResponse.json(
        { error: "This lease is not addressed to your account" },
        { status: 403 }
      )
    }

    if (lease.status === "active") {
      return NextResponse.json({ success: true, message: "Lease already active" })
    }

    // 5. Link the tenant and activate the lease
    const { error: updateError } = await supabaseAdmin
      .from("leases")
      .update({
        tenant_id: user.id,
        status: "active",
        tenant_signed_at: new Date().toISOString(),
      })
      .eq("id", leaseId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Mark the unit occupied and link the tenant (if this lease has a unit)
    if (lease.unit_id) {
      await supabaseAdmin
        .from("units")
        .update({ status: "occupied", tenant_id: user.id })
        .eq("id", lease.unit_id)
    }

    // 7. Best-effort welcome message from the landlord (non-blocking)
    try {
      const propertyName =
        (lease.property as any)?.name ?? "your new home"
      const tenantName =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        lease.tenant_name ||
        "there"

      if (lease.landlord_id) {
        await supabaseAdmin.from("messages").insert({
          sender_id: lease.landlord_id,
          recipient_id: user.id,
          lease_id: lease.id,
          subject: `Welcome to ${propertyName}`,
          content: generateWelcomeMessage(tenantName, propertyName),
        })
      }
    } catch {
      // Don't fail activation if the welcome message can't be sent
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to activate lease" },
      { status: 500 }
    )
  }
}
