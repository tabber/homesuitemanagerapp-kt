import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth and let the request through.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
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
  const publicRoutes = ["/", "/login", "/signup", "/signup-success", "/pricing", "/forgot-password". "/reset-password".]

  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith("/auth"),
  )

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && !isPublicRoute) {
    // Get user role from profiles
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const role = profile?.role
    const path = request.nextUrl.pathname

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
