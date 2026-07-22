import { NextResponse } from "next/server"

// HomeSuite Essential — $79.99 CAD/mo, early adopter pricing
const PRICE_ID = "price_1TgfBhIRkg3kRhhvykREGt5D"
const TRIAL_DAYS = 7

export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://homesuitemanager.com"
  const key = process.env.STRIPE_SECRET_KEY

  if (!key) {
    return NextResponse.redirect(`${site}/pricing?error=config`)
  }

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": PRICE_ID,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": String(TRIAL_DAYS),
    success_url: `${site}/signup-success?from=checkout`,
    cancel_url: `${site}/pricing`,
    allow_promotion_codes: "true",
  })

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  const session = await res.json()

  if (!res.ok || !session.url) {
    console.error("Stripe checkout session failed:", session.error?.message)
    return NextResponse.redirect(`${site}/pricing?error=checkout`)
  }

  return NextResponse.redirect(session.url, { status: 303 })
}
