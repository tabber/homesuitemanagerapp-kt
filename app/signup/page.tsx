"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, User, Home } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type RoleType = "landlord" | "tenant"

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

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<RoleType>("landlord")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    router.push(`/signup-success?email=${encodeURIComponent(email)}`)
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
            <h1 className="text-2xl font-medium text-navy mb-2">Create your account</h1>
            <p className="text-sm text-text-muted mb-6">
              Start your 7-day free trial. No credit card required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName" className="text-text-primary">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="mt-1 border-sage focus:ring-teal"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-text-primary">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="mt-1 border-sage focus:ring-teal"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-text-primary">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 border-sage focus:ring-teal"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-text-primary">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 border-sage focus:ring-teal"
                />
                <p className="text-xs text-text-muted mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <Label className="text-text-primary mb-2 block">I am a...</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("landlord")}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-colors text-left",
                      role === "landlord"
                        ? "border-teal bg-teal/5"
                        : "border-sage hover:border-sage-light"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        role === "landlord" ? "bg-teal/10" : "bg-sage/30"
                      )}
                    >
                      <User className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Landlord</p>
                      <p className="text-xs text-text-muted">I manage properties</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("tenant")}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-colors text-left",
                      role === "tenant"
                        ? "border-teal bg-teal/5"
                        : "border-sage hover:border-sage-light"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        role === "tenant" ? "bg-teal/10" : "bg-sage/30"
                      )}
                    >
                      <Home className="h-5 w-5 text-navy" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">Tenant</p>
                      <p className="text-xs text-text-muted">I rent a property</p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-teal hover:bg-teal-dark text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-sm text-center text-text-muted mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-teal hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
