import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import crypto from "node:crypto"

// Lazily created on first use so the module can be evaluated at build time
// (Next.js collects page data before runtime env vars are guaranteed).
// Kept as a module-level accessor because many helpers below reference it.
let adminClient: ReturnType<typeof createAdminClient<any>> | null = null
function getAdminClient() {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Supabase admin credentials are not configured")
  }
  // Typed as <any> schema: this route doesn't use generated DB types, so without
  // this the query builder infers `never` for every row and column.
  adminClient = createAdminClient<any>(url, key)
  return adminClient
}
const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient<any>>, {
  get(_target, prop) {
    const client = getAdminClient()
    const value = Reflect.get(client, prop)
    return typeof value === "function" ? value.bind(client) : value
  },
})

const FROM = "HomeSuite <team@homesuitemanager.com>"

// --- Stripe signature verification (no SDK needed) ---
function verifyStripeSignature(payload: string, header: string, secret: string) {
  let timestamp = ""
  let signature = ""

  for (const item of header.split(",")) {
    const [key, value] = item.trim().split("=")
    if (key === "t") timestamp = value
    if (key === "v1") signature = value // Grabs the target signature
  }

  if (!timestamp || !signature) return false

  // Reject events older than 5 minutes (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
  Buffer.from(expected, "hex"),
  Buffer.from(signature, "hex")
    )
  } catch {
    return false
  }
}
// --- Admin notification via Resend REST (no SDK needed) ---
async function emailAdmin(subject: string, html: string) {
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) return
    const { data: admin } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle()
    if (!admin?.email) return
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: admin.email, subject, html }),
    })
  } catch (e) {
    console.error("Admin email failed:", e)
  }
}

async function stripeApi(
  path: string,
  params?: Record<string, string>,
  method: "POST" | "DELETE" = "POST"
) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  })
  return res.json()
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""
  {
    const parts = Object.fromEntries(
      signature.split(",").map((p) => p.split("=") as [string, string])
    )
    const ts = parts["t"]
    const v1 = parts["v1"]
    const expected = ts
      ? crypto.createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex")
      : "NO_TIMESTAMP"
    console.error("WEBHOOK DEBUG", {
      payloadLength: payload.length,
      sigHeaderPresent: signature.length > 0,
      timestamp: ts,
      ageSeconds: ts ? Math.round(Date.now() / 1000 - Number(ts)) : null,
      v1Received: v1?.substring(0, 16),
      v1Expected: expected.substring(0, 16),
      match: v1 === expected,
      secretLen: secret.length,
            secretTail: secret.slice(-6),
      hasWhitespace: /\s/.test(secret),
    })
  }
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(payload)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const email: string | undefined =
          session.customer_details?.email ?? session.customer_email
        const stripeCustomerId: string = session.customer
        const stripeSubscriptionId: string = session.subscription

        if (!email) break

        const existingUserId = await findUserIdByEmail(email)
        let userId = existingUserId

        if (!userId) {
          // New landlord: create the account and send the set-password invite.
          const { data: invited, error } =
            await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${
                process.env.NEXT_PUBLIC_SITE_URL || "https://homesuitemanager.com"
              }/auth/callback`,
              data: { role: "landlord" },
            })
          if (error) {
            console.error("Invite after checkout failed:", error.message)
            break
          }
          userId = invited.user?.id ?? null
        }

        if (!userId) break

        let status = "trialing"

        if (existingUserId) {
          // Returning account: no second free trial — start billing now.
          const ended = await stripeApi(`subscriptions/${stripeSubscriptionId}`, {
            trial_end: "now",
          })
          if (ended?.status) status = ended.status

          // Cancel any previous, different subscription so only one bills.
          const { data: prev } = await supabaseAdmin
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", userId)
            .neq("stripe_subscription_id", stripeSubscriptionId)
            .maybeSingle()
          if (prev?.stripe_subscription_id) {
            await stripeApi(`subscriptions/${prev.stripe_subscription_id}`, undefined, "DELETE")
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled", updated_at: new Date().toISOString() })
              .eq("stripe_subscription_id", prev.stripe_subscription_id)
          }
        }

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_customer_id: stripeCustomerId,
          })
          .eq("id", userId)

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan_name: "essential",
            status,
          },
          { onConflict: "stripe_subscription_id" }
        )

        await emailAdmin(
          existingUserId ? "HomeSuite reactivation" : "New HomeSuite signup",
          existingUserId
            ? `<p><strong>${email}</strong> resubscribed — billing started immediately (no repeat trial).</p>`
            : `<p><strong>${email}</strong> just started a trial via Stripe Checkout.</p>`
        )
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object
        const status: string = sub.status // trialing | active | past_due | canceled | ...
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        const { data: row } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle()

        await supabaseAdmin
          .from("subscriptions")
          .update({ status, current_period_end: periodEnd, updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id)

        if (row?.user_id) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: status })
            .eq("id", row.user_id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object

        const { data: row } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle()

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id)

        let email = "unknown"
        if (row?.user_id) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "canceled" })
            .eq("id", row.user_id)
          const { data: p } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("id", row.user_id)
            .maybeSingle()
          email = p?.email ?? email
        }

        await emailAdmin(
          "HomeSuite cancellation",
          `<p><strong>${email}</strong> canceled their subscription.</p>`
        )
        break
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err)
    // Return 200 anyway so Stripe doesn't retry forever on our internal bugs;
    // errors are logged for follow-up.
  }

  return NextResponse.json({ received: true })
}
