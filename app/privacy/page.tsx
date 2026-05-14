import type { Metadata } from 'next'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { canonicalUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Bloomkite collects, uses, retains, and safeguards your personal and financial data.',
  alternates: { canonical: canonicalUrl('/privacy') },
}

// Skeleton Privacy Policy — DRAFT, awaiting legal review. Structure covers
// the BRD §13 data classifications, retention windows, third-party processor
// list, and the right-to-delete flow at /settings. Counsel must finalise the
// regulatory references (DPDP Act 2023 in particular) before launch.

const LAST_REVIEWED = '2026-05-13'

export default function PrivacyPolicyPage() {
  return (
    <PageShell bucket="reading" surface="functional">
      <DraftBanner />

      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle={`Last reviewed: ${LAST_REVIEWED}. How Bloomkite collects, uses, retains, and safeguards your data.`}
      />

      <Section title="What we collect">
        <p>We collect three categories of data:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <strong>Account data</strong> — email, name, phone number, date of birth (used to enforce
            the 18+ requirement), and (for advisors) credential documents.
          </li>
          <li>
            <strong>Financial planning data</strong> — inputs you supply to our calculators (income,
            expenses, goals). Used to compute results and, when you choose to share, made visible to
            the specific advisors you select.
          </li>
          <li>
            <strong>Optional KYC data</strong> — PAN (mandatory for premium tier), Aadhaar (optional)
            per BRD §12.4. Stored as SHA-256 hashes; only the last four digits of each ID are kept
            in plain form for support-style verification.
          </li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account balances or holdings</strong> — Bloomkite is an advisor-discovery
            platform, not a portfolio tracker. We capture which financial products you hold, never
            how much you have in each (BRD §8.5 data minimisation).
          </li>
          <li>
            <strong>Bank credentials, brokerage logins, or payment-card numbers</strong> — payment
            processing happens entirely on Razorpay's PCI-DSS-certified infrastructure.
          </li>
        </ul>
      </Section>

      <Section title="How we use your data">
        <ul className="list-disc pl-6 space-y-2">
          <li>To operate the Platform — authentication, profiles, calculators, plan-sharing.</li>
          <li>To process subscriptions and generate invoices (via Razorpay).</li>
          <li>To send transactional emails (verification, reset, payment receipts) via Resend.</li>
          <li>
            To moderate content and investigate abuse — admin actions are recorded in an
            append-only audit log.
          </li>
        </ul>
        <p className="mt-3">
          We do not sell your data. We do not show third-party advertising on the Platform.
        </p>
      </Section>

      <Section title="Who can see what">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>You</strong> see all your own data and any feedback advisors leave on plans you
            shared with them.
          </li>
          <li>
            <strong>Advisors</strong> see only the plans you explicitly shared with them, and only
            the comments they themselves wrote — never another advisor's feedback (BRD §8.5).
          </li>
          <li>
            <strong>Admins</strong> can see operational data for compliance and moderation; every
            admin action is logged.
          </li>
          <li>
            <strong>The public</strong> sees only what you publish — articles, forum questions, your
            ratings of advisors. Your financial planning data is never public.
          </li>
        </ul>
      </Section>

      <Section title="Third-party processors">
        <p>We use the following third parties to operate the Platform. Each is bound by a data-processing agreement:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <strong>Razorpay</strong> — payments, subscription billing, invoicing.
            PCI-DSS-certified. Transmits payment data only.
          </li>
          <li>
            <strong>Resend</strong> — transactional emails (verification, password reset, payment
            confirmation). Receives email addresses + email content only.
          </li>
          <li>
            <strong>Supabase Storage</strong> — file uploads (advisor credential documents, article
            featured images). Files are private by default; signed URLs grant time-limited access.
          </li>
          <li>
            <strong>Google OAuth</strong> — optional sign-in. Receives only the OAuth scopes you
            authorise (typically email + profile).
          </li>
        </ul>
      </Section>

      <Section title="Data retention (BRD §13.3)">
        <p>We retain your data only as long as needed:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Active account data</strong> — for as long as your account exists.</li>
          <li>
            <strong>Deleted account data</strong> — a minimal residual is kept for 7 years post-
            deletion to satisfy tax and audit obligations (invoices, subscription records, audit log
            entries linking to you as actor).
          </li>
          <li><strong>Audit logs</strong> — 2 years.</li>
          <li><strong>Forum / chat content</strong> — 90 days after the originating thread closes.</li>
          <li><strong>OTP / verification codes</strong> — 24 hours from issue.</li>
          <li><strong>Failed login attempts</strong> — 30 days for fraud detection.</li>
        </ul>
      </Section>

      <Section title="Your rights (BRD §13.3 right-to-delete)">
        <p>You may at any time:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>
            <strong>Access</strong> your data — visible in your dashboard, profile, and saved plans.
          </li>
          <li>
            <strong>Correct</strong> your data — via your profile pages.
          </li>
          <li>
            <strong>Delete</strong> your account — submit a request from{' '}
            <a href="/settings" className="text-forest-700 underline">/settings</a>. An admin will
            review and process within 30 days. Tax-relevant rows are retained per the 7-year window
            described above.
          </li>
          <li>
            <strong>Withdraw consent</strong> for non-essential cookies via the cookie banner /
            settings.
          </li>
        </ul>
      </Section>

      <Section title="Security">
        <p>
          Passwords are bcrypt-hashed; OTPs are SHA-256-hashed. KYC IDs (PAN, Aadhaar) are stored as
          SHA-256 hashes plus the last four digits in plain form. All data in transit is TLS-encrypted.
          Database access is restricted to the application service role.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Bloomkite does not knowingly collect data from anyone under 18. The 18+ check at sign-up
          enforces this; if you believe a minor's data has been collected, contact us immediately
          via the support form.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          Material changes will be communicated by email and an in-app notice. The "Last reviewed"
          date at the top of this page reflects the most recent revision.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions or to exercise the rights above, use the{' '}
          <a href="/support" className="text-forest-700 underline">support form</a> with category
          "Privacy". For account deletion specifically, use the dedicated flow at{' '}
          <a href="/settings" className="text-forest-700 underline">/settings</a>.
        </p>
      </Section>
    </PageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 text-ink-700 leading-relaxed">
      <h2 className="font-serif text-2xl font-medium text-forest-700 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function DraftBanner() {
  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 mb-8">
      <p className="text-sm font-semibold text-amber-900 mb-1">
        DRAFT — pending legal review
      </p>
      <p className="text-sm text-amber-800">
        This Privacy Policy skeleton was generated from BRD §13 requirements. The final text — and
        the specific DPDP Act 2023 references it must include — must be reviewed and signed off by
        qualified Indian legal counsel before launch. Do not rely on this draft as final policy.
      </p>
    </div>
  )
}
