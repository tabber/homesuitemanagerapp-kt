import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FROM = "HomeSuite <team@homesuitemanager.com>"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const promoNote = typeof body.note === "string" ? body.note.trim() : ""

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 })
    }

    // 1. Authenticate the caller
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Verify the caller is an admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite landlords" },
        { status: 403 }
      )
    }

    // 3. Don't invite someone who already has an account
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "That email already has an account" },
        { status: 409 }
      )
    }

    // 4. Email an invitation to subscribe. Accounts are only ever created by
    //    the Stripe webhook, so every landlord follows the same path.
    const site =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.homesuitemanager.com"
    const checkoutUrl = `${site}/api/stripe/checkout`

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json(
        { error: "Email is not configured" },
        { status: 500 }
      )
    }

    const html = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px;">
        <h2 style="color:#1B3A6B; font-weight:500;">You've been invited to HomeSuite</h2>
        <p style="color:#2C3A30; line-height:1.6;">
          HomeSuite gives self-managing landlords everything a property manager does —
          leases, rent tracking, maintenance and tenant messaging — for $79.99/month.
        </p>
        ${
          promoNote
            ? `<p style="color:#2C3A30; line-height:1.6;"><strong>${promoNote}</strong></p>`
            : ""
        }
        <p style="color:#2C3A30; line-height:1.6;">
          Start with a 7-day free trial. You can cancel any time before it ends.
        </p>
        <p style="margin:28px 0;">
          <a href="${checkoutUrl}"
             style="background:#5BC8AF; color:#fff; padding:12px 24px; border-radius:8px;
                    text-decoration:none; font-weight:500;">
            Start your free trial
          </a>
        </p>
        <p style="color:#6B8C7D; font-size:13px; line-height:1.6;">
          Questions? Just reply to this email.
        </p>
      </div>
    `

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: "You've been invited to HomeSuite",
        html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error("Invite email failed:", detail)
      return NextResponse.json(
        { error: "Could not send the invitation email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 500 }
    )
  }
}
