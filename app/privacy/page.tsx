import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — HomeSuite Manager",
  description: "How HomeSuite Manager collects, uses, and protects personal information.",
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

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-teal hover:underline inline-block mb-8"
        >
          ← Back to HomeSuite
        </Link>

        <h1 className="text-3xl sm:text-4xl font-medium text-navy mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-muted mb-10">
          Last updated: [DATE]
        </p>

        <div className="space-y-2">
          <Section number="1" title="Who we are">
            <p>
              HomeSuite Manager (&ldquo;HomeSuite&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
              is property management software operated by{" "}
              <strong>[YOUR FULL LEGAL NAME]</strong>, a sole proprietorship based in
              British Columbia, Canada.
            </p>
            <p>
              <strong>Contact for privacy matters:</strong>
              <br />
              [YOUR NAME], Privacy Officer
              <br />
              [YOUR EMAIL]
              <br />
              [YOUR BUSINESS ADDRESS]
            </p>
            <p>
              We are subject to Canada&apos;s <em>Personal Information Protection and
              Electronic Documents Act</em> (PIPEDA) and British Columbia&apos;s{" "}
              <em>Personal Information Protection Act</em> (PIPA).
            </p>
          </Section>

          <Section number="2" title="Two kinds of users — and why it matters">
            <p>
              HomeSuite has two types of users, and our privacy obligations differ
              for each.
            </p>
            <p>
              <strong>Landlords</strong> are our customers. They create an account, pay
              a subscription, and decide what information to record about their
              properties and tenants. For landlord information, we are the
              organization responsible for that data.
            </p>
            <p>
              <strong>Tenants</strong> are invited into HomeSuite by their landlord.
              Tenants do not sign up on their own and are not our paying customers.
              For tenant information, we act on the landlord&apos;s behalf — the
              landlord decides what tenant information is collected and why; we
              store and process it according to their instructions and this policy.
            </p>
            <p>
              If you are a tenant with questions about why your landlord collects
              certain information, or you want your information corrected or
              deleted, please contact your landlord first. We will assist them in
              responding to you.
            </p>
          </Section>

          <Section number="3" title="Information we collect">
            <p className="font-medium text-navy">From landlords</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Account information: name, email address, phone number, business name</li>
              <li>
                Billing information: processed by Stripe. We do not store your full
                credit card number.
              </li>
              <li>
                Property information: addresses, unit details, rent amounts, photos
                and descriptions
              </li>
              <li>
                Business records: lease terms, payment records, maintenance
                requests, uploaded documents, notes, contractor contact details
              </li>
            </ul>

            <p className="font-medium text-navy pt-2">
              From tenants (collected at the landlord&apos;s direction)
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Identity and contact: name, email address, phone number</li>
              <li>Emergency contact information (if provided)</li>
              <li>
                Tenancy information: lease terms, unit, rent amount, move-in and
                move-out dates, deposit amounts
              </li>
              <li>
                Payment records: amounts, dates, and methods reported or recorded
                for rent and utilities
              </li>
              <li>Communications: messages exchanged with the landlord</li>
              <li>Maintenance requests: descriptions and details you submit</li>
              <li>Documents: files uploaded by you or shared with you</li>
            </ul>

            <p className="font-medium text-navy pt-2">Collected automatically</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Authentication data: login timestamps, session information</li>
              <li>Technical data: IP address, browser type, device type, pages accessed</li>
              <li>Usage analytics: aggregate usage patterns via Vercel Analytics</li>
            </ul>

            <p>
              We do <strong>not</strong> collect: government identification numbers,
              credit scores, background check results, banking credentials, or
              biometric data.
            </p>
          </Section>

          <Section number="4" title="Why we collect it, and your consent">
            <p>We collect personal information to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Create and secure user accounts</li>
              <li>Provide the tenancy management features landlords subscribe to</li>
              <li>Enable communication between landlords and their tenants</li>
              <li>Process subscription payments</li>
              <li>Send transactional email (invitations, password resets, notifications)</li>
              <li>Maintain records landlords are required or choose to keep</li>
              <li>Diagnose problems, prevent abuse, and improve the service</li>
            </ul>
            <p>
              <strong>Consent.</strong> Landlords consent when they create an account
              and accept our Terms of Service. Tenants consent when they accept an
              invitation and activate their account. Landlords are responsible for
              ensuring they have a lawful basis for entering tenant information into
              HomeSuite, and for informing tenants that HomeSuite is used to manage
              their tenancy.
            </p>
            <p>
              You may withdraw consent at any time, subject to legal and contractual
              restrictions, by contacting us — though doing so may mean we can no
              longer provide the service.
            </p>
          </Section>

          <Section number="5" title="Service providers and where data is stored">
            <p>
              We use the following third parties to operate HomeSuite. Each has
              access only to what it needs to perform its function.
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>
                <strong>Supabase</strong> — database, authentication, file storage
                ([CONFIRM YOUR REGION])
              </li>
              <li>
                <strong>Vercel</strong> — application hosting and analytics (global
                edge network)
              </li>
              <li>
                <strong>Stripe</strong> — subscription payment processing (United
                States)
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery (United States)
              </li>
            </ul>
            <p>
              <strong>Cross-border storage.</strong> Some of our providers store or
              process data outside Canada, including in the United States. While
              your information is in another country, it may be accessible to that
              country&apos;s courts, law enforcement, and national security
              authorities under that country&apos;s laws. By using HomeSuite, you
              acknowledge this transfer.
            </p>
            <p>
              We do not sell personal information. We do not share it with
              advertisers. We do not use your data to train machine learning models.
            </p>
          </Section>

          <Section number="6" title="How we protect information">
            <ul className="list-disc pl-6 space-y-1.5">
              <li>All data is encrypted in transit (HTTPS/TLS) and at rest</li>
              <li>
                Access is restricted by row-level security rules — landlords can
                only reach their own records; tenants can only reach their own
                tenancy
              </li>
              <li>
                Documents are stored privately and served through expiring signed
                links
              </li>
              <li>
                Payment card details are handled by Stripe and never touch our
                servers
              </li>
              <li>
                Passwords are stored as cryptographic hashes, never in readable form
              </li>
            </ul>
            <p>
              No system is perfectly secure. If a breach creates a real risk of
              significant harm, we will notify affected individuals and the Office
              of the Privacy Commissioner of Canada as required by law.
            </p>
          </Section>

          <Section number="7" title="How long we keep information">
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Active landlord accounts: while the subscription is active</li>
              <li>
                Cancelled landlord accounts: [CHOOSE: e.g. 90 days] after
                cancellation, then deleted
              </li>
              <li>
                Tenant records: retained by the landlord&apos;s instruction; deleted
                with the landlord&apos;s account
              </li>
              <li>
                Financial records: [CHOOSE: e.g. 7 years] where required for tax
                purposes
              </li>
              <li>
                Ended tenancies: retained so landlords keep required tenancy records
              </li>
              <li>Backups: purged on our providers&apos; standard cycles</li>
            </ul>
          </Section>

          <Section number="8" title="Your rights">
            <p>Under PIPEDA and BC PIPA you may:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Access the personal information we hold about you</li>
              <li>Correct information that is inaccurate or incomplete</li>
              <li>Withdraw consent (subject to legal and contractual limits)</li>
              <li>Request deletion of your information</li>
              <li>Complain to us, and escalate to a regulator if unsatisfied</li>
            </ul>
            <p>
              To exercise any of these, email <strong>[YOUR EMAIL]</strong>. We will
              respond within 30 days as required by law. We may need to verify your
              identity first.
            </p>
            <p>
              <strong>Tenants:</strong> because we process your information on your
              landlord&apos;s behalf, please direct access and deletion requests to
              your landlord where possible. If you cannot reach them, contact us and
              we will help.
            </p>
            <p>
              <strong>Escalation:</strong>
              <br />
              Office of the Privacy Commissioner of Canada — priv.gc.ca — 1-800-282-1376
              <br />
              Office of the Information and Privacy Commissioner for BC — oipc.bc.ca
            </p>
          </Section>

          <Section number="9" title="Cookies and tracking">
            <p>We use only what the service needs to function:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Essential cookies — keep you logged in and secure your session</li>
              <li>
                Analytics — Vercel Analytics collects aggregate, non-identifying
                usage data
              </li>
            </ul>
            <p>We do not use advertising cookies or third-party trackers.</p>
          </Section>

          <Section number="10" title="Children">
            <p>
              HomeSuite is not intended for anyone under 19. We do not knowingly
              collect information from children. If you believe a child&apos;s
              information has been entered into HomeSuite, contact us and we will
              remove it.
            </p>
          </Section>

          <Section number="11" title="Changes to this policy">
            <p>
              We may update this policy as the service evolves. Material changes
              will be communicated by email or in-app notice at least 30 days before
              taking effect. The &ldquo;Last updated&rdquo; date above always reflects
              the current version.
            </p>
          </Section>

          <Section number="12" title="Contact">
            <p>
              Questions, requests, or complaints:
            </p>
            <p>
              <strong>[YOUR NAME]</strong>, Privacy Officer
              <br />
              <strong>[YOUR EMAIL]</strong>
              <br />
              [YOUR MAILING ADDRESS]
            </p>
            <p>We respond to all privacy inquiries within 30 days.</p>
            <p className="pt-4">
              See also our{" "}
              <Link href="/terms" className="text-teal hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}
