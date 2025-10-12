// pages/Pricing.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type BillingCycle = 'monthly' | 'yearly';

interface Plan {
  name: string;
  description: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  cta: string;
  ctaHref: string;
  ctaExternal?: boolean;
  highlight?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    description: 'Perfect for creators exploring TikTok insights for the first time.',
    price: { monthly: 0, yearly: 0 },
    cta: 'Start for free',
    ctaHref: '/video-analysis',
    features: [
      '10 video analyses per month',
      'Basic engagement metrics',
      'Hashtag + caption suggestions',
      'Community support',
    ],
  },
  {
    name: 'Creator',
    description: 'Level up your content strategy with detailed analytics and automation.',
    price: { monthly: 39, yearly: 390 },
    cta: 'Upgrade to Creator',
    ctaHref: '/dashboard',
    highlight: true,
    features: [
      '100 video analyses per month',
      'Audience sentiment breakdowns',
      'Campaign workspaces',
      'Priority email support',
      'Custom prompt templates',
    ],
  },
  {
    name: 'Agency',
    description: 'Collaborate with teams, automate workflows, and report to clients effortlessly.',
    price: { monthly: 129, yearly: 1290 },
    cta: 'Talk to sales',
    ctaHref: 'mailto:hello@zlyzer.com',
    ctaExternal: true,
    features: [
      'Unlimited video analyses',
      'White-label dashboards & exports',
      'Dedicated success manager',
      'Slack & webhook integrations',
      'SAML SSO + granular permissions',
    ],
  },
];

const FAQS = [
  {
    q: 'Can I switch plans any time?',
    a: 'Yes — upgrade, downgrade, or cancel whenever you need. Changes apply immediately and we prorate automatically.',
  },
  {
    q: 'Do you offer team accounts?',
    a: 'The Agency plan includes multiple seats, shared dashboards, and client workspaces. Contact us for custom seat bundles.',
  },
  {
    q: 'What sources can Zlyzer analyze?',
    a: 'We currently focus on TikTok videos and profiles. Instagram Reels and YouTube Shorts support are on the roadmap.',
  },
  {
    q: 'Is there a trial for paid tiers?',
    a: 'Creator and Agency tiers include a 14-day trial. You can cancel before it ends with a single click inside your dashboard.',
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const plans = useMemo(() => PLANS, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Pricing
        </span>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Pick the plan that accelerates your growth
        </h1>
        <p className="mt-4 text-white/70 text-base sm:text-lg max-w-3xl mx-auto">
          Every plan includes our AI-powered video analysis engine, refreshed dashboards, and proactive insights. Scale up when your content pipeline does.
        </p>

        <div className="mt-10 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={clsx(
                'px-4 py-2 rounded-xl transition font-semibold flex items-center gap-2',
                billing === cycle
                  ? 'bg-[#2ce695] text-[#0b1b14]'
                  : 'text-white/70 hover:bg-white/10'
              )}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className="inline-flex items-center rounded-full bg-[#0b1b14]/40 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Save 2 months
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[.04] p-8 sm:p-10 text-left backdrop-blur-md">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Need a custom setup?</h2>
              <p className="mt-2 text-white/70 text-sm sm:text-base">
                We help agencies, brands, and enterprise teams with usage-based pricing, custom integrations, and compliance reviews.
              </p>
            </div>
            <a
              href="mailto:hello@zlyzer.com"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Contact sales
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold text-center">Common questions</h2>
        <p className="mt-2 text-center text-white/60 max-w-2xl mx-auto">
          Everything you need to know before inviting your team.
        </p>
        <div className="mt-10 grid gap-6">
          {FAQS.map(({ q, a }) => (
            <article
              key={q}
              className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-left backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-white">{q}</h3>
              <p className="mt-2 text-white/70 text-sm sm:text-base leading-relaxed">{a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: BillingCycle }) {
  const isYearly = billing === 'yearly';
  const price = plan.price[billing];
  const secondaryPrice = isYearly && plan.price.monthly ? plan.price.monthly : null;
  const isExternal = plan.ctaExternal || plan.ctaHref.startsWith('http') || plan.ctaHref.startsWith('mailto:');

  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-3xl border border-white/10 bg-white/[.03] p-8 backdrop-blur-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-2',
        plan.highlight && 'border-[#2ce695]/60 bg-[#132e53]/90'
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-[#2ce695] px-4 py-1 text-xs font-semibold text-[#0b1b14] shadow-lg">
          Most popular
        </span>
      )}
      <div className="flex-1">
        <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
        <p className="mt-3 text-white/70 text-sm leading-relaxed">{plan.description}</p>

        <div className="mt-6 flex items-baseline gap-2">
          {price === null ? (
            <span className="text-4xl font-bold text-white">Custom</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-white">
                ${price.toLocaleString()}
              </span>
              <span className="text-white/60 text-sm">
                / {isYearly ? 'year' : 'month'}
              </span>
            </>
          )}
        </div>
        {secondaryPrice && (
          <p className="mt-1 text-xs text-white/60">
            Equivalent to ${secondaryPrice.toLocaleString()} billed monthly
          </p>
        )}

        {isExternal ? (
          <a
            href={plan.ctaHref}
            className={clsx(
              'mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition',
              plan.highlight
                ? 'bg-[#2ce695] text-[#0b1b14] hover:brightness-110'
                : 'border border-white/20 text-white hover:border-white/40'
            )}
          >
            {plan.cta}
          </a>
        ) : (
          <Link
            to={plan.ctaHref}
            className={clsx(
              'mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition',
              plan.highlight
                ? 'bg-[#2ce695] text-[#0b1b14] hover:brightness-110'
                : 'border border-white/20 text-white hover:border-white/40'
            )}
          >
            {plan.cta}
          </Link>
        )}

        <ul className="mt-8 space-y-3 text-left">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
              <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2ce695]/20 text-[#2ce695]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-xs text-white/50">
        Includes access to the Zlyzer dashboard, analysis history, and upcoming AI enhancements.
      </p>
    </div>
  );
}
