import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { leaseId } = body

    if (!leaseId) {
      return NextResponse.json({ error: "Missing leaseId" }, { status: 400 })
    }

    // 1. Authenticate the caller and confirm they are the landlord on this lease
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: lease, error: leaseError } = await supabaseAdmin
      .from("leases")
      .select("id, landlord_id, tenant_email, tenant_name, invitation_sent_at")
      .eq("id", leaseId)
      .maybeSingle()

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 })
    }

    if (lease.landlord_id !== user.id) {
      return NextResponse.json(
        { error: "You are not the landlord on this lease" },
        { status: 403 }
      )
    }

    if (!lease.tenant_email) {
      return NextResponse.json(
        { error: "This lease has no tenant email to invite" },
        { status: 400 }
      )
    }

    const email = lease.tenant_email.trim().toLowerCase()
const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.homesuitemanager.com"}/auth/callback`

    // 2. Check whether an auth user already exists for this email.
    //    If they do, we don't re-invite (they can just log in and accept);
    //    we still record that an invitation was attempted.
    // Check for an existing account via profiles (indexed lookup) rather than
    // scanning every auth user.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    let alreadyExists = !!existingProfile

    if (!alreadyExists) {
      // Invite the tenant. This creates an auth user and emails them a link.
      const { error: inviteError } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            role: "tenant",
            invited_name: lease.tenant_name ?? null,
            lease_id: lease.id,
          },
        })

      if (inviteError) {
        // An account may exist in auth without a profile row; treat that as
        // "already registered" rather than an error.
        if (/already.*(registered|exists)/i.test(inviteError.message)) {
          alreadyExists = true
        } else {
          return NextResponse.json({ error: inviteError.message }, { status: 500 })
        }
      }
    }

    // 4. Record that the invitation was sent
    await supabaseAdmin
      .from("leases")
      .update({ invitation_sent_at: new Date().toISOString() })
      .eq("id", lease.id)

    return NextResponse.json({
      success: true,
      alreadyExisted: alreadyExists,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to invite tenant" },
      { status: 500 }
    )
  }
}
