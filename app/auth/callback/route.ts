import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const supabase = await createClient()

  let sessionError = null

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    sessionError = error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    sessionError = error
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
  }

  if (sessionError) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // Password reset and new-user invites both go to set a password
  if (type === "recovery" || type === "invite" || type === "signup") {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // Otherwise route by role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role
  if (role === "tenant") return NextResponse.redirect(`${origin}/tenant`)
  if (role === "landlord") return NextResponse.redirect(`${origin}/landlord`)
  if (role === "admin") return NextResponse.redirect(`${origin}/admin`)

  return NextResponse.redirect(`${origin}/login`)
}
