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

    // Always read the lease fresh — this is what makes "fix the email, then
    // resend" work correctly, since we never trust a stale email passed in
    // from the client.
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

    // 2. Check for an existing account, and — critically — whether it was
    //    ever actually confirmed. A profile row existing is NOT the same as
    //    a real, usable account: it can exist for someone who was invited
    //    once and never completed sign-up.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    let alreadyExists = false

    if (existingProfile) {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(
        existingProfile.id
      )
      alreadyExists = !!authUserData?.user?.email_confirmed_at
    }

    if (!alreadyExists) {
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo,
          data: {
            role: "tenant",
            invited_name: lease.tenant_name ?? null,
            lease_id: lease.id,
          },
        }
      )
      if (inviteError) {
        // Supabase refuses to re-invite an email that already has an
        // auth.users row, even if it was never confirmed. In that case,
        // generate a fresh link ourselves instead of failing outright.
        if (/already.*(registered|exists)/i.test(inviteError.message)) {
          const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email,
              options: { redirectTo },
            })
          if (linkError) {
            return NextResponse.json({ error: linkError.message }, { status: 500 })
          }
          // TODO: send linkData.properties.action_link via your Resend
          // transactional email function, using your invite template.
          alreadyExists = false
        } else {
          return NextResponse.json({ error: inviteError.message }, { status: 500 })
        }
      }
    }

    // 3. Record that an invitation attempt was made
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
