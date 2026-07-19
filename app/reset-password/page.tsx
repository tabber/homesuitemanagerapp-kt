"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      <span className="text-xl font-medium text-navy">HomeSuite</span>
    </Link>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Confirm a valid session exists (established by /auth/callback)
  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setHasSession(!!user)
    }
    check()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      const message = "Password must be at least 8 characters."
      setError(message)
      toast.error(message)
      return
    }

    if (password !== confirmPassword) {
      const message = "Passwords do not match."
      setError(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    // Guard: must have a valid session to set a password
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const message = "Your link has expired. Please request a new one."
      setError(message)
      toast.error(message)
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      toast.error(updateError.message)
      setIsLoading(false)
      return
    }

<<<<<<< HEAD
    // The session was established at the callback, so the update applied to the
    // correct user and they remain logged in. Route them by role.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let destination = "/login"
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = profile?.role
      if (role === "tenant") destination = "/tenant/lease/accept"
      else if (role === "landlord") destination = "/landlord"
      else if (role === "admin") destination = "/admin"
    }

    toast.success("Your password has been set.")
    router.push(destination)
=======
    toast.success("Password set successfully.")

    // Route by role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role
    if (role === "tenant") {
      router.push("/tenant/lease/accept")
    } else if (role === "landlord") {
      router.push("/landlord")
    } else if (role === "admin") {
      router.push("/admin")
    } else {
      router.push("/login")
    }
>>>>>>> 0b9ec521c18a64d7f7dabee53395d6fa458c8f0a
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-[0.5px] border-sage">
          <CardContent className="p-6">
            <h1 className="text-2xl font-medium text-navy mb-2">Set your password</h1>
            <p className="text-sm text-text-muted mb-6">
              Choose a password for your account.
            </p>

            {hasSession === false && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your link is invalid or has expired. Please request a new one.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-text-primary">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 border-sage focus:ring-teal"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-text-primary">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 border-sage focus:ring-teal"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-teal hover:bg-teal-dark text-white"
                disabled={isLoading || hasSession === false}
              >
                {isLoading ? "Saving..." : "Set Password"}
              </Button>
            </form>

            <p className="text-sm text-center text-text-muted mt-6">
              <Link href="/login" className="text-teal hover:underline">
                Back to login
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
