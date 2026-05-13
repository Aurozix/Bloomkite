'use client'

import {
  CalculatorIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

// Bloomkite home page — brand voice per docs/branding/brand.md §4 (Authoritative,
// Plain, Considered). Anti-hype. The headline is the recommended tagline from
// the brand file (§1, tagline B).
export default function Home() {
  return (
    <div className="w-full">
      {/* Hero — Forest substrate, Paper text, single saffron point of accent */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-4 overflow-hidden bg-forest-700 text-paper">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 30% 20%, rgba(29,158,117,0.18) 0%, transparent 55%), linear-gradient(135deg, #0B3D2E 0%, #0F6E56 60%, #062520 100%)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center py-24">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-saffron-300 mb-8">
            <span className="h-1 w-1 rounded-full bg-saffron-400" />
            Verified advisor marketplace
          </span>

          <h1 className="font-serif text-4xl md:text-6xl font-medium leading-[1.08] tracking-tight text-paper mb-6">
            Find an advisor on{' '}
            <em className="text-saffron-400 not-italic" style={{ fontStyle: 'italic' }}>
              merit
            </em>
            , not memory.
          </h1>

          <p className="text-lg md:text-xl text-forest-200 max-w-2xl mx-auto leading-relaxed mb-12">
            Bloomkite is a verified marketplace of SEBI-registered investment advisors,
            CFPs, and CAs for India and the NRI diaspora. Every advisor is credentialed
            before they appear on the platform. You see the result on every profile.
          </p>

          <div className="flex justify-center">
            <a
              href="/advisors"
              className="px-6 py-3 rounded-bk-md font-semibold transition-colors bg-forest-400 hover:bg-forest-500 text-paper"
            >
              Browse verified advisors
            </a>
          </div>
        </div>
      </section>

      {/* The promise — three principles from the brand file */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400 mb-3">
              What you can expect
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-forest-700 leading-tight tracking-tight">
              Verified advisors. Honest choices.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PromiseCard icon={ShieldCheckIcon} title="Credentials verified">
              Every advisor passes a documented credentialing review before they appear.
              SEBI registration, CFP, CA — verified, not claimed.
            </PromiseCard>
            <PromiseCard icon={CalculatorIcon} title="15 calculators">
              From goal planning to insurance to EMI. Built for Indian financial
              realities — INR, GST, NRI tax, repatriation.
            </PromiseCard>
            <PromiseCard icon={ArrowsRightLeftIcon} title="Compare side-by-side">
              Share a plan with multiple advisors. See their recommendations next to
              each other. Choose the one that fits.
            </PromiseCard>
            <PromiseCard icon={AcademicCapIcon} title="Read and ask">
              Long-form articles from verified advisors. Open Q&amp;A forum. Learn
              before you talk.
            </PromiseCard>
          </div>
        </div>
      </section>

      {/* Pricing — Forest pricing column, single saffron point on the premium tier */}
      <section className="py-24 px-4 bg-paper">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400 mb-3">
              Pricing
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-forest-700 leading-tight tracking-tight mb-3">
              Pay only when you need more.
            </h2>
            <p className="text-ink-600">
              The basics are free. Pay only if you want every calculator and direct
              advisor consultations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PlanCard
              name="Free"
              price="₹0"
              cadence="/month"
              features={[
                '5 basic calculators',
                'Read articles',
                'Follow 1 advisor',
                'Community Q&A',
              ]}
              cta="Get started"
              ctaHref="/auth/signin"
              variant="default"
            />
            <PlanCard
              name="Silver"
              price="₹299"
              cadence="/month"
              features={[
                'All 15 calculators',
                'Unlimited plan sharing',
                'Priority 24h response',
              ]}
              cta="Subscribe"
              ctaHref="/subscriptions"
              variant="featured"
            />
            <PlanCard
              name="Gold"
              price="₹999"
              cadence="/month"
              features={[
                'Everything in Silver',
                '1 free consultation/month',
                'Personalised recommendations',
              ]}
              cta="Subscribe"
              ctaHref="/subscriptions"
              variant="premium"
            />
          </div>
        </div>
      </section>

      {/* CTA — closing, Forest. */}
      <section className="py-20 px-4 bg-forest-700 text-paper">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium leading-tight tracking-tight mb-4">
            Ready to choose an advisor on merit?
          </h2>
          <p className="text-forest-200 mb-8">
            We don&apos;t give financial advice. We connect you with advisors who do.
            The decision, and the responsibility, stays with you and your advisor.
          </p>
          <a
            href="/advisors"
            className="inline-block px-6 py-3 rounded-bk-md font-semibold transition-colors bg-forest-400 hover:bg-forest-500 text-paper"
          >
            Browse verified advisors
          </a>
        </div>
      </section>
    </div>
  )
}

function PromiseCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-6">
      <Icon className="h-9 w-9 text-forest-500 mb-4" />
      <h3 className="font-serif text-lg font-medium text-forest-700 mb-2">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{children}</p>
    </div>
  )
}

function PlanCard({
  name,
  price,
  cadence,
  features,
  cta,
  ctaHref,
  variant,
}: {
  name: string
  price: string
  cadence: string
  features: string[]
  cta: string
  ctaHref: string
  variant: 'default' | 'featured' | 'premium'
}) {
  const ring =
    variant === 'featured'
      ? 'ring-2 ring-forest-400 md:scale-[1.03]'
      : variant === 'premium'
      ? 'ring-1 ring-saffron-300'
      : ''
  const priceColor =
    variant === 'premium' ? 'text-saffron-700' : 'text-forest-700'

  return (
    <div className={`card p-8 relative ${ring}`}>
      {variant === 'featured' && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest-400 text-paper text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          Most popular
        </span>
      )}
      {variant === 'premium' && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-saffron-400 text-saffron-900 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
          Premium
        </span>
      )}
      <h3 className="font-serif text-2xl font-medium text-forest-700 mb-2">{name}</h3>
      <p className="mb-6">
        <span className={`font-data text-4xl font-medium ${priceColor}`}>{price}</span>
        <span className="text-ink-400 text-sm">{cadence}</span>
      </p>
      <ul className="space-y-2 mb-8 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-ink-900">
            <span className="text-forest-400 mt-0.5">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`block w-full text-center py-3 rounded-bk-md font-semibold transition-colors ${
          variant === 'featured'
            ? 'bg-forest-400 hover:bg-forest-500 text-paper'
            : 'border border-ink-200 hover:bg-forest-50 text-forest-700'
        }`}
      >
        {cta}
      </a>
    </div>
  )
}
