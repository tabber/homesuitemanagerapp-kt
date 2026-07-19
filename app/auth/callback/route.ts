<<<<<<< HEAD
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
=======
import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
>>>>>>> 0b9ec521c18a64d7f7dabee53395d6fa458c8f0a

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

<<<<<<< HEAD
  // Use the project's server client, which manages session cookies via
  // next/headers. In a Route Handler any cookies it sets during
  // exchangeCodeForSession/verifyOtp are automatically written onto the
  // redirect response, so the user stays logged in.
  const supabase = await createClient()

  let verified = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    verified = !error
  } else if (token_hash && type) {
=======
  const supabase = await createClient()

  let sessionError = null

  if (token_hash && type) {
>>>>>>> 0b9ec521c18a64d7f7dabee53395d6fa458c8f0a
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
<<<<<<< HEAD
    verified = !error
  }

  if (!verified) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // Password recovery and freshly invited/signed-up users must set a password.
  if (type === "recovery" || type === "invite" || type === "signup") {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  // Otherwise route based on the user's role.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role
    if (role === "tenant") return NextResponse.redirect(`${origin}/tenant/lease/accept`)
    if (role === "landlord") return NextResponse.redirect(`${origin}/landlord`)
    if (role === "admin") return NextResponse.redirect(`${origin}/admin`)
=======
    sessionError = error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    sessionError = error
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_token`)
>>>>>>> 0b9ec521c18a64d7f7dabee53395d6fa458c8f0a
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
