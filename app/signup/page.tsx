import { redirect } from "next/navigation"

// Public signups are closed. Landlord accounts are created through
// Stripe Checkout; tenants join by landlord invitation.
export default function SignupPage() {
  redirect("/pricing")
}  const handleSubmit = async (e: React.FormEvent) => {
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
