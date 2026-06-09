"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSuccess(true)
    setIsLoading(false)
    router.push("/reset-password")
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
            {isSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h1 className="text-2xl font-medium text-navy mb-2">Check your email</h1>
                <p className="text-sm text-text-muted mb-6">
                  {"We've"} sent a password reset link to {email}
                </p>
                <Link
                  href="/login"
                  className="text-sm text-teal hover:underline"
                >
                  Back to login
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-medium text-navy mb-2">Reset your password</h1>
                <p className="text-sm text-text-muted mb-6">
                  Enter your email and {"we'll"} send you a reset link.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <Button
                    type="submit"
                    className="w-full bg-teal hover:bg-teal-dark text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>

                <p className="text-sm text-center text-text-muted mt-6">
                  <Link href="/login" className="text-teal hover:underline">
                    Back to login
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
