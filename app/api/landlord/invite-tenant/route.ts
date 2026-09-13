import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Created per-request so the module can be evaluated at build time
// (Next.js collects page data before runtime env vars are guaranteed).
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured")
  }
  return createAdminClient(url, key)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = getAdminClient()
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

    // Send the email VIA SUPABASE (which delivers through your configured SMTP
    // pairing). We don't call Resend's API directly — that required a key in
    // Vercel that isn't set. Supabase's own senders send seamlessly through SMTP.
    if (alreadyExists) {
      // Existing, confirmed account: send a password-reset/recovery email so they
      // can sign in and reach this new lease. The callback routes recovery →
      // /reset-password.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (resetError) {
        console.error("[invite-tenant] resetPasswordForEmail failed:", resetError.message)
        return NextResponse.json({ error: resetError.message }, { status: 500 })
      }
    } else {
      // New (or invited-but-never-confirmed) email: send the invite. Supabase
      // sends this through SMTP using its "Invite user" template.
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          role: "tenant",
          invited_name: lease.tenant_name ?? null,
          lease_id: lease.id,
        },
      })

      if (inviteError) {
        // If the user already exists in auth but wasn't confirmed, invite is
        // refused — fall back to a password-reset email so they can still get in.
        if (/already.*(registered|exists)/i.test(inviteError.message)) {
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          })
          if (resetError) {
            console.error("[invite-tenant] fallback reset failed:", resetError.message)
            return NextResponse.json({ error: resetError.message }, { status: 500 })
          }
        } else {
          console.error("[invite-tenant] inviteUserByEmail failed:", inviteError.message)
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
