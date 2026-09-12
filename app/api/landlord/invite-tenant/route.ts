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

    // Generate a link to email the tenant. Three cases:
    //  - brand-new email → invite link
    //  - email exists but Supabase refuses invite → recovery link
    //  - email already confirmed (existing account) → recovery link, so they can
    //    sign in and reach this new lease. (Previously this case sent NOTHING,
    //    which looked like success but delivered no email.)
    let actionLink: string | null = null

    if (alreadyExists) {
      const { data: recoveryData, error: recoveryError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo },
        })
      if (recoveryError) {
        return NextResponse.json({ error: recoveryError.message }, { status: 500 })
      }
      actionLink = recoveryData?.properties?.action_link ?? null
    } else {
      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "invite",
          email,
          options: {
            redirectTo,
            data: {
              role: "tenant",
              invited_name: lease.tenant_name ?? null,
              lease_id: lease.id,
            },
          },
        })

      if (linkError) {
        // If the user already exists in auth, Supabase refuses an invite link
        // — fall back to a recovery link so they can still get in.
        if (/already.*(registered|exists)/i.test(linkError.message)) {
          const { data: magicData, error: magicError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email,
              options: { redirectTo },
            })
          if (magicError) {
            return NextResponse.json({ error: magicError.message }, { status: 500 })
          }
          actionLink = magicData?.properties?.action_link ?? null
        } else {
          return NextResponse.json({ error: linkError.message }, { status: 500 })
        }
      } else {
        actionLink = linkData?.properties?.action_link ?? null
      }
    }

    // Send the invitation email via Resend (same provider/domain as the
    // landlord invite flow). Only sends when we actually have a link.
    if (actionLink) {
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return NextResponse.json(
          { error: "Email is not configured. Add RESEND_API_KEY." },
          { status: 500 }
        )
      }

      const greetingName = lease.tenant_name ? lease.tenant_name.split(" ")[0] : "there"
      const html = `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px;">
          <h2 style="color:#1B3A6B; font-weight:500;">You've been invited to your tenant portal</h2>
          <p style="color:#2C3A30; line-height:1.6;">
            Hi ${greetingName}, your landlord has set up your lease on HomeSuite.
            Accept your invitation to view your lease, make payments, and send
            maintenance requests.
          </p>
          <p style="margin:28px 0;">
            <a href="${actionLink}"
               style="background:#5BC8AF; color:#fff; padding:12px 24px; border-radius:8px;
                      text-decoration:none; font-weight:500;">
              Accept your invitation
            </a>
          </p>
          <p style="color:#6B8C7D; font-size:13px; line-height:1.6;">
            If you weren't expecting this, you can safely ignore this email.
          </p>
        </div>
      `

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "HomeSuite <team@homesuitemanager.com>",
          to: email,
          subject: "You've been invited to your HomeSuite tenant portal",
          html,
        }),
      })

      if (!emailRes.ok) {
        const detail = await emailRes.text()
        console.error("Tenant invite email failed:", detail)
        return NextResponse.json(
          { error: "Could not send the invitation email" },
          { status: 500 }
        )
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
