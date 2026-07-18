"use client"

import { useState } from "react"
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
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      toast.error(updateError.message)
      setIsLoading(false)
      return
    }

     toast.success("Password set successfully.")
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
      const role = profile?.role
      if (role === "tenant") { router.push("/tenant/lease/accept"); return }
      if (role === "landlord") { router.push("/landlord"); return }
      if (role === "admin") { router.push("/admin"); return }
    }
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-[0.5px] border-sage">
          <CardContent className="p-6">
            <h1 className="text-2xl font-medium text-navy mb-2">Reset your password</h1>
            <p className="text-sm text-text-muted mb-6">
              Enter a new password for your account.
            </p>

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
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
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
