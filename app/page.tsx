'use client'

import {
  CalculatorIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10" style={{ background: 'var(--hero-gradient)' }}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10 -z-10"></div>

        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="mb-8 inline-block">
            <span className="text-sm font-semibold bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/30">
              ✨ Your Financial Journey Starts Here
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Smart Planning,<br />
            <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
              Better Future
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Connect with trusted financial advisors, access powerful calculators, and achieve your financial goals with confidence
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/signin" className="btn-primary text-lg">
              Get Started Free
            </a>
            <a href="#features" className="btn-secondary text-lg">
              Learn More
            </a>
          </div>

          <p className="text-white/70 mt-8 text-sm">
            Join 10,000+ Indians planning their financial future
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Why Bloomkite?</h2>
            <p className="text-xl text-gray-600">Everything you need for smart financial planning</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-8 hover:shadow-xl">
              <CalculatorIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">15 Calculators</h3>
              <p className="text-gray-600">
                Plan for goals, analyze cash flow, calculate insurance, and invest smartly
              </p>
            </div>

            <div className="card p-8 hover:shadow-xl">
              <ShieldCheckIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Verified Advisors</h3>
              <p className="text-gray-600">
                Connect with certified financial professionals you can trust
              </p>
            </div>

            <div className="card p-8 hover:shadow-xl">
              <ArrowsRightLeftIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Share & Compare</h3>
              <p className="text-gray-600">
                Get personalized advice and compare recommendations easily
              </p>
            </div>

            <div className="card p-8 hover:shadow-xl">
              <AcademicCapIcon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Learn & Grow</h3>
              <p className="text-gray-600">
                Access expert articles and grow your financial knowledge
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-4xl font-bold text-blue-600 mb-6">₹0<span className="text-lg text-gray-600">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>5 Basic Calculators</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Read Articles</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Follow 1 Advisor</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Community Q&A</span>
                </li>
              </ul>
              <button className="btn-outline w-full">Get Started</button>
            </div>

            {/* Silver - Featured */}
            <div className="card p-8 ring-2 ring-blue-600 relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Silver</h3>
              <p className="text-4xl font-bold text-blue-600 mb-6">₹299<span className="text-lg text-gray-600">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>All 15 Calculators</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Unlimited Plan Sharing</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Priority 24h Response</span>
                </li>
              </ul>
              <button className="btn-primary w-full">Start Now</button>
            </div>

            {/* Gold */}
            <div className="card p-8">
              <h3 className="text-2xl font-bold mb-2">Gold</h3>
              <p className="text-4xl font-bold text-blue-600 mb-6">₹999<span className="text-lg text-gray-600">/month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Silver + Everything</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>1 Free Consultation/Month</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Personalized Recommendations</span>
                </li>
              </ul>
              <button className="btn-outline w-full">Upgrade</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 text-white" style={{ background: 'var(--hero-gradient)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to Plan Your Future?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of Indians who are taking control of their finances
          </p>
          <a href="/auth/signin" className="btn-primary inline-block text-lg">
            Start Your Journey Now
          </a>
        </div>
      </section>
    </div>
  )
}
