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
const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "https://homesuitemanager.com"}/auth/callback`

    // 2. Check whether an auth user already exists for this email.
    //    If they do, we don't re-invite (they can just log in and accept);
    //    we still record that an invitation was attempted.
    let alreadyExists = false
    try {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
      alreadyExists = !!existing?.users?.find(
        (u) => u.email?.toLowerCase() === email
      )
    } catch {
      // If the lookup fails, fall through and attempt the invite
    }

    if (!alreadyExists) {
      // 3. Invite the tenant. This creates an auth user and emails them a link.
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
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
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
