import type { Metadata } from 'next'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'

export const metadata: Metadata = {
  title: 'Terms of Service — Bloomkite',
  description:
    'Terms of Service for Bloomkite, the verified financial advisor marketplace.',
}

// Skeleton ToS — DRAFT, awaiting legal review per BRD §12.5 pre-launch
// checklist. Section structure aligns with industry-standard SaaS/marketplace
// templates (Razorpay, Zerodha, BankBazaar references). Replace each section
// body with counsel-reviewed copy before launch; until then, the DRAFT banner
// at top makes the status unambiguous to anyone landing on the page.

const LAST_REVIEWED = '2026-05-13'

export default function TermsOfServicePage() {
  return (
    <PageShell bucket="reading" surface="functional">
      <DraftBanner kind="Terms of Service" />

      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        subtitle={`Last reviewed: ${LAST_REVIEWED}. By accessing or using Bloomkite, you agree to these Terms.`}
      />

      <Section number="1" title="Acceptance of Terms">
        <p>
          By creating an account, accessing, or using Bloomkite (the "Platform"), you acknowledge that
          you have read, understood, and agreed to be bound by these Terms of Service and our{' '}
          <a href="/privacy" className="text-forest-700 underline">Privacy Policy</a>.
          If you do not agree, you must not use the Platform.
        </p>
      </Section>

      <Section number="2" title="Eligibility">
        <p>
          You must be at least 18 years of age to use Bloomkite (BRD §8.1). By signing up, you
          represent that you meet this age requirement and that the contact information you provide
          is accurate.
        </p>
      </Section>

      <Section number="3" title="Account Responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials, for
          all activities that occur under your account, and for promptly notifying us of any
          unauthorised access. We may suspend or terminate accounts that violate these Terms or
          applicable law.
        </p>
      </Section>

      <Section number="4" title="Nature of Services">
        <p>
          Bloomkite is a <strong>marketplace and information platform</strong>. We connect investors
          with financial advisors and provide planning calculators and educational content. We are
          NOT a registered investment advisor, broker, or insurance agent.
        </p>
        <p className="mt-3">
          All content on the Platform — including calculator outputs, articles, and forum responses
          — is <strong>educational in nature and does not constitute personalised financial,
          investment, tax, or legal advice</strong>. You should consult a qualified, licensed
          professional before acting on any information found on Bloomkite.
        </p>
      </Section>

      <Section number="5" title="Advisor Listings & Verification">
        <p>
          Advisors on the Platform self-declare their credentials. While we apply a verification
          workflow (BRD §5.1), we do not guarantee the ongoing accuracy of advisor claims and
          recommend you independently verify any credential before engaging an advisor.
        </p>
      </Section>

      <Section number="6" title="User Conduct">
        <ul className="list-disc pl-6 space-y-2">
          <li>You will not post unlawful, misleading, defamatory, or infringing content.</li>
          <li>
            You will not post specific stock recommendations or guaranteed-return claims (SEBI
            regulatory constraint per BRD §12.2).
          </li>
          <li>You will not impersonate other users or misrepresent your professional credentials.</li>
          <li>You will not use the Platform for spam, phishing, or unauthorised commercial solicitation.</li>
        </ul>
      </Section>

      <Section number="7" title="Subscriptions, Billing & Refunds">
        <p>
          Premium features require an active subscription. Billing occurs through our payment
          processor (Razorpay). Subscriptions auto-renew unless cancelled. Pre-paid subscriptions are
          non-refundable except in the limited circumstances described in our refund policy.
        </p>
        <p className="mt-3 text-ink-500 italic">
          Detailed refund and proration mechanics: pending counsel review. Until finalised, contact
          support for case-by-case resolution.
        </p>
      </Section>

      <Section number="8" title="Intellectual Property">
        <p>
          You retain ownership of content you publish (articles, comments, forum posts). By posting,
          you grant Bloomkite a non-exclusive, royalty-free, worldwide licence to host, display, and
          distribute that content on the Platform. Bloomkite's name, logo, and software are owned by
          Bloomkite.
        </p>
      </Section>

      <Section number="9" title="Disclaimers & Limitation of Liability">
        <p>
          The Platform is provided "as is" and "as available." To the maximum extent permitted by
          applicable law, Bloomkite disclaims all warranties — express or implied — including
          merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        <p className="mt-3">
          Bloomkite is not liable for investment losses, advisor errors or omissions, or for the
          consequences of decisions you make based on Platform content. Our aggregate liability is
          limited to the amounts paid to Bloomkite by you in the twelve months preceding the claim.
        </p>
      </Section>

      <Section number="10" title="Termination">
        <p>
          You may close your account at any time via{' '}
          <a href="/settings" className="text-forest-700 underline">/settings</a>. We may suspend or
          terminate accounts that violate these Terms. Some data is retained after termination for
          legal and audit purposes — see the{' '}
          <a href="/privacy" className="text-forest-700 underline">Privacy Policy</a> §Data
          Retention.
        </p>
      </Section>

      <Section number="11" title="Governing Law & Dispute Resolution">
        <p>
          These Terms are governed by the laws of India. Disputes will be subject to the exclusive
          jurisdiction of the courts at <span className="text-ink-500 italic">[city — pending counsel]</span>.
          Investor grievances may also be raised through our support channel below.
        </p>
      </Section>

      <Section number="12" title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be communicated via
          email and an in-app notice. Continued use after changes take effect constitutes acceptance.
        </p>
      </Section>

      <Section number="13" title="Contact">
        <p>
          Questions or grievances? Reach us via the{' '}
          <a href="/support" className="text-forest-700 underline">support form</a>. For
          time-sensitive issues, email <span className="font-data">support@bloomkite.app</span>{' '}
          <span className="text-ink-500 italic">[address pending; placeholder]</span>.
        </p>
      </Section>
    </PageShell>
  )
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
    <section className="mb-8 text-ink-700 leading-relaxed">
      <h2 className="font-serif text-2xl font-medium text-forest-700 mb-3">
        {number}. {title}
      </h2>
      {children}
    </section>
  )
}

function DraftBanner({ kind }: { kind: string }) {
  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 mb-8">
      <p className="text-sm font-semibold text-amber-900 mb-1">
        DRAFT — pending legal review
      </p>
      <p className="text-sm text-amber-800">
        This {kind} skeleton was generated from BRD requirements and industry templates. The final
        text must be reviewed and signed off by qualified Indian legal counsel before launch (BRD
        §12.5). Do not rely on this draft as final policy.
      </p>
    </div>
  )
}
