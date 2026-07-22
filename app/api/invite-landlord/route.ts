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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

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

    // 3. Send the invite. Creates the auth user and emails a magic link;
    //    the profile trigger reads role from the metadata at creation.
    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://homesuitemanager.com"
    }/auth/callback`

    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: { role: "landlord" },
      }
    )

    if (inviteError) {
      // Friendly message if the address already has an account
      if (/already.*(registered|exists)/i.test(inviteError.message)) {
        return NextResponse.json(
          { error: "That email already has an account" },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite" },
      { status: 500 }
    )
  }
}
