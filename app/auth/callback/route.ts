import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/"

  // Use the shared server client — it reads/writes auth cookies correctly.
  const supabase = await createClient()

  const routeByRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.redirect(`${origin}/login`)

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, profile_completed")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role

    // Invited tenants: send them to review/accept their lease.
    if (role === "tenant") {
      return NextResponse.redirect(`${origin}/tenant/lease/accept`)
    }
    if (role === "landlord") return NextResponse.redirect(`${origin}/landlord`)
    if (role === "admin") return NextResponse.redirect(`${origin}/admin`)

    // No role yet (e.g. a brand-new invited user) — send to accept,
    // which will guide them; falls back to portal after activation.
    return NextResponse.redirect(`${origin}/tenant/lease/accept`)
  }

  // Email links (invite, signup confirmation, recovery)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      // invite / signup / magiclink → route by role (session cookies are set)
      return await routeByRole()
    }
  }

  // Code exchange (OAuth, some magic links)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return await routeByRole()
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
