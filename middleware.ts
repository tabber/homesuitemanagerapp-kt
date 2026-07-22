import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail closed: if auth is not configured, do not serve the app.
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse("Service unavailable", { status: 503 })
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes — no auth required
  const publicRoutes = ["/", "/login", "/signup", "/signup-success", "/pricing", "/forgot-password", "/reset-password"]

  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith("/auth"),
  )

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && !isPublicRoute) {
    // Get user role from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status, trial_end_date")
      .eq("id", user.id)
      .single()

    const role = profile?.role
    const path = request.nextUrl.pathname

    // Subscription gate for landlords: trialing/active always pass;
    // legacy/comped "trial" passes until trial_end_date.
    if (path.startsWith("/landlord") && role === "landlord") {
      const status = profile?.subscription_status ?? "trial"
      const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null
      const trialValid = status === "trial" && trialEnd !== null && trialEnd > new Date()
      const allowed = status === "trialing" || status === "active" || trialValid
      if (!allowed) {
        return NextResponse.redirect(new URL("/pricing?expired=1", request.url))
      }
    }

    // Role-based routing enforcement
    if (path.startsWith("/landlord") && role !== "landlord") {
      if (role === "tenant") return NextResponse.redirect(new URL("/tenant", request.url))
      if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url))
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (path.startsWith("/tenant") && role !== "tenant") {
      if (role === "landlord") return NextResponse.redirect(new URL("/landlord", request.url))
      if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url))
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (path.startsWith("/admin") && role !== "admin") {
      if (role === "landlord") return NextResponse.redirect(new URL("/landlord", request.url))
      if (role === "tenant") return NextResponse.redirect(new URL("/tenant", request.url))
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect logged in users away from auth pages
  if (user && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const role = profile?.role
    if (role === "landlord") return NextResponse.redirect(new URL("/landlord", request.url))
    if (role === "tenant") return NextResponse.redirect(new URL("/tenant", request.url))
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
