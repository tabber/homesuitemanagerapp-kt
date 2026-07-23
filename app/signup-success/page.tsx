"use client"

import Link from "next/link"
import { Building2, CheckCircle } from "lucide-react"
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

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-sage/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-[0.5px] border-sage">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>

            <h1 className="text-2xl font-medium text-navy mb-4">
              Payment successful — welcome to HomeSuite
            </h1>

            <div className="text-sm text-text-muted text-left space-y-3 mb-6">
              <p>
                <span className="font-medium text-navy">First time here?</span>{" "}
                Check your inbox for an email from HomeSuite with a link to set
                your password. It usually arrives within a minute.
              </p>
              <p>
                <span className="font-medium text-navy">
                  Already had an account?
                </span>{" "}
                {"You're"} reactivated — no email needed. Just sign in with your
                existing password.
              </p>
            </div>

            <Button asChild className="w-full bg-teal hover:bg-teal-dark text-white mb-4">
              <Link href="/login">Sign In</Link>
            </Button>

            <p className="text-xs text-text-muted">
              No email after a few minutes? Check spam, or contact{" "}
              <a
                className="text-teal hover:underline"
                href="mailto:team@homesuitemanager.com"
              >
                team@homesuitemanager.com
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
