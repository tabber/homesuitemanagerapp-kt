"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Building2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
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

function SignupSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || "your email"

  return (
    <Card className="w-full max-w-md border-[0.5px] border-sage">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-navy" />
        </div>

        <h1 className="text-2xl font-medium text-navy mb-2">Check your email</h1>
        <p className="text-sm text-text-muted mb-2">
          {"We've"} sent a confirmation link to:
        </p>
        <p className="text-sm font-medium text-navy mb-6">{email}</p>
        <p className="text-sm text-text-muted mb-6">
          Click the link in your email to activate your account.
        </p>

        <Button
          variant="outline"
          className="w-full border-navy/20 text-navy hover:bg-navy/5 mb-4"
        >
          Resend Confirmation Email
        </Button>

        <Link
          href="/login"
          className="text-sm text-teal hover:underline"
        >
          Back to login
        </Link>
      </CardContent>
    </Card>
  )
}

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <SignupSuccessContent />
        </Suspense>
      </main>
    </div>
  )
}
