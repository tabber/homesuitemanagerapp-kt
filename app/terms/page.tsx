import Link from "next/link"

export const metadata = {
  title: "Terms of Service — HomeSuite Manager",
  description: "The terms governing your use of HomeSuite Manager.",
}

function Section({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium text-navy pt-4">
        {number}. {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-navy/80">
        {children}
      </div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-teal hover:underline inline-block mb-8"
        >
          ← Back to HomeSuite
        </Link>

        <h1 className="text-3xl sm:text-4xl font-medium text-navy mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-text-muted mb-10">
          Last updated: 08.23.2026
        </p>

        <div className="space-y-2">
          <Section number="1" title="Agreement">
            <p>
              These Terms govern your use of HomeSuite Manager (&ldquo;HomeSuite&rdquo;,
              &ldquo;the Service&rdquo;), operated by <strong> Tabitha Lewis </strong>,
              a sole proprietorship in British Columbia, Canada (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
            </p>
            <p>
              By creating an account, accepting an invitation, or using the
              Service, you agree to these Terms. If you do not agree, do not use
              the Service.
            </p>
          </Section>

          <Section number="2" title="What HomeSuite is — and is not">
            <p>
              HomeSuite is <strong>software that helps landlords organize and manage
              rental properties</strong>. It provides tools for recording leases,
              tracking rent payments, managing maintenance requests, storing
              documents, and communicating with tenants.
            </p>
            <p className="font-medium text-navy">HomeSuite is not:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>A law firm, and does not provide legal advice</li>
              <li>
                A property management company, and does not manage properties on
                your behalf
              </li>
              <li>An accountant or tax advisor</li>
              <li>
                A payment processor for rent — HomeSuite <strong>records</strong> rent
                payments; it does not collect or transmit rent money between
                tenants and landlords
              </li>
              <li>
                A guarantor of compliance with the <em>Residential Tenancy Act</em> or
                any other law
              </li>
            </ul>
            <p>
              <strong>You are responsible for your own legal compliance.</strong> Tenancy
              law differs by province and changes over time. Any forms, templates,
              guidance, deadlines, or references to tenancy rules in HomeSuite are
              provided for convenience only and may be incomplete or out of date.
              Always confirm requirements with your provincial tenancy authority or
              a lawyer.
            </p>
          </Section>

          <Section number="3" title="Accounts">
            <p>
              <strong>Landlord accounts.</strong> Landlord accounts are created through
              paid subscription only. You must be at least 19 and legally able to
              enter contracts. You are responsible for the accuracy of your account
              information, for keeping your password secure, and for all activity
              under your account.
            </p>
            <p>
              <strong>Tenant accounts.</strong> Tenants do not sign up directly. A
              landlord invites a tenant by email, and the tenant activates an
              account to view their tenancy, report payments, submit maintenance
              requests, and message their landlord. Tenant accounts are free.
            </p>
            <p>
              <strong>Account sharing.</strong> Do not share login credentials. Each
              person who needs access should have their own account.
            </p>
          </Section>

          <Section number="4" title="Subscription, billing, and cancellation">
            <p>
              <strong>Price.</strong> $79.99 CAD per month, subject to the
              plan you select.
            </p>
            <p>
              <strong>Trial.</strong> New subscriptions include a 7-day
              trial. You will not be charged until the trial ends. Cancel before it
              ends and you pay nothing.
            </p>
            <p>
              <strong>Billing.</strong> Subscriptions renew automatically each month
              until cancelled. Payment is processed by Stripe; by subscribing you
              also agree to Stripe&apos;s terms. We do not store your full card
              details.
            </p>
            <p>
              <strong>Price changes.</strong> We may change pricing with at least 30
              days&apos; notice by email. Continuing after the change takes effect
              means you accept the new price.
            </p>
            <p>
              <strong>Cancellation.</strong> Cancel at any time from your account
              settings or by contacting us. Cancellation takes effect at the end of
              your current billing period. You keep access until then.
            </p>
            <p>
              <strong>Refunds.</strong> Monthly fees are non-refundable except where
              required by law or at our discretion. We do not provide partial
              refunds for unused time.
            </p>
            <p>
              <strong>Failed payment.</strong> If payment fails, we may suspend access
              after notifying you. Repeated failure may result in account
              termination.
            </p>
          </Section>

          <Section number="5" title="Your data and content">
            <p>
              <strong>You own your data.</strong> Property records, lease information,
              documents, messages, and tenant records you enter remain yours.
            </p>
            <p>
              <strong>You grant us permission</strong> to store, process, transmit, and
              display that content solely to operate the Service for you.
            </p>
            <p className="font-medium text-navy">
              Your responsibilities as a landlord. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Having a lawful basis to collect and record tenant information</li>
              <li>Informing tenants that you use HomeSuite to manage their tenancy</li>
              <li>The accuracy of information you enter</li>
              <li>Complying with privacy law regarding your tenants&apos; information</li>
              <li>
                Keeping independent copies of records you are legally required to
                retain
              </li>
            </ul>
            <p>
              <strong>Our role.</strong> For tenant information, we act on your
              instructions as your service provider. We do not use tenant data for
              our own purposes, sell it, or share it with advertisers.
            </p>
            <p>
              <strong>Data export.</strong> You may request an export of your data at
              any time. On account closure, we retain data as described in our{" "}
              <Link href="/privacy" className="text-teal hover:underline">
                Privacy Policy
              </Link>
              , then delete it.
            </p>
          </Section>

          <Section number="6" title="Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use HomeSuite for any unlawful purpose</li>
              <li>Enter information about individuals without a lawful basis</li>
              <li>
                Discriminate against tenants or applicants in violation of human
                rights law
              </li>
              <li>Harass, threaten, or abuse other users through the Service</li>
              <li>
                Upload malware, attempt to breach security, or access other
                users&apos; data
              </li>
              <li>Reverse engineer, scrape, or resell the Service</li>
              <li>Circumvent usage limits or billing</li>
              <li>Use the Service to store data unrelated to property management</li>
            </ul>
            <p>
              We may suspend or terminate accounts that violate these rules, with or
              without notice depending on severity.
            </p>
          </Section>

          <Section number="7" title="Service availability">
            <p>
              We aim for high availability but do not guarantee uninterrupted
              service. The Service may be unavailable due to maintenance, provider
              outages, or circumstances beyond our control.
            </p>
            <p>
              We may modify, add, or remove features. We will give reasonable notice
              of changes that materially reduce functionality you rely on.
            </p>
            <p>
              HomeSuite depends on third-party providers (Supabase, Vercel, Stripe,
              Resend). We are not responsible for their outages or failures.
            </p>
          </Section>

          <Section number="8" title="Disclaimers">
            <p className="uppercase text-sm tracking-wide">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
              without warranties of any kind, express or implied, including
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
            <p>
              We do not warrant that the Service will be error-free, that data will
              never be lost, or that it will meet your specific requirements.{" "}
              <strong>Maintain your own backups of critical records.</strong>
            </p>
          </Section>

          <Section number="9" title="Limitation of liability">
            <p className="uppercase text-sm tracking-wide">
              To the maximum extent permitted by law:
            </p>
            <p>
              We are <strong>not liable</strong> for indirect, incidental, special,
              consequential, or punitive damages, including lost profits, lost
              rental income, lost data, or business interruption.
            </p>
            <p>
              <strong>Our total liability</strong> for any claim arising from these
              Terms or the Service is limited to the amount you paid us in the
              twelve (12) months before the claim arose.
            </p>
            <p>
              We are not liable for: disputes between landlords and tenants;
              decisions you make using information in the Service; your failure to
              comply with tenancy or privacy law; or losses caused by third-party
              providers.
            </p>
            <p>
              Some jurisdictions do not allow certain limitations; where that
              applies, these limits apply to the fullest extent permitted.
            </p>
          </Section>

          <Section number="10" title="Indemnity">
            <p>
              You agree to indemnify and hold us harmless from claims, damages, and
              reasonable legal costs arising from: your use of the Service; your
              violation of these Terms; your violation of any law, including tenancy
              and privacy law; or disputes between you and your tenants.
            </p>
          </Section>

          <Section number="11" title="Termination">
            <p>
              <strong>By you.</strong> Cancel at any time; access continues to the end
              of the billing period.
            </p>
            <p>
              <strong>By us.</strong> We may suspend or terminate your account for
              breach of these Terms, non-payment, unlawful use, or conduct that
              harms other users or the Service. Where practical we will give notice
              and an opportunity to correct the problem.
            </p>
            <p>
              <strong>On termination.</strong> Your access ends and data is retained
              then deleted per our Privacy Policy. Export anything you need before
              cancelling.
            </p>
          </Section>

          <Section number="12" title="Governing law and disputes">
            <p>
              These Terms are governed by the laws of British Columbia and the
              applicable laws of Canada. Disputes are subject to the exclusive
              jurisdiction of the courts of British Columbia.
            </p>
            <p>
              Before filing a claim, contact us at <strong>team@homesuitemanager.com </strong> — most
              issues can be resolved directly.
            </p>
          </Section>

          <Section number="13" title="Changes to these Terms">
            <p>
              We may update these Terms. Material changes will be communicated by
              email or in-app notice at least 30 days before taking effect.
              Continuing to use the Service after that means you accept the revised
              Terms.
            </p>
          </Section>

          <Section number="14" title="General">
            <p>
              <strong>Entire agreement.</strong> These Terms and the Privacy Policy are
              the complete agreement between us regarding the Service.
            </p>
            <p>
              <strong>Severability.</strong> If any provision is unenforceable, the rest
              remain in effect.
            </p>
            <p>
              <strong>No waiver.</strong> Failure to enforce a provision is not a waiver
              of it.
            </p>
            <p>
              <strong>Assignment.</strong> You may not transfer your account without our
              consent. We may assign these Terms in connection with a sale or
              reorganization of the business.
            </p>
          </Section>

          <Section number="15" title="Contact">
            <p>
              <strong> Homesuite Manager </strong>
              <br />
              <strong>team@homesuitemanager.com </strong>
              <br />
              Victoria
              <br />
              British Columbia, Canada
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}
