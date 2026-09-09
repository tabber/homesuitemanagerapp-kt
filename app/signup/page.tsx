import { redirect } from "next/navigation"

// Public signups are closed. Landlord accounts are created through
// Stripe Checkout; tenants join by landlord invitation.
export default function SignupPage() {
  redirect("/pricing")
}  
