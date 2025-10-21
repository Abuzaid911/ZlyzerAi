// pages/Pricing.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  name: string;
  description: string;
  price: { monthly: number | null; yearly: number | null };
  cta: string;
  ctaHref: string;
  ctaExternal?: boolean;
  highlight?: boolean;
  features: string[];
  note?: string;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    description:
      "Try Zlyzer with core features. Ideal for creators testing “chat with video” and auto-metadata.",
    price: { monthly: 0, yearly: 0 },
    cta: "Start for free",
    ctaHref: "/video-analysis",
    features: [
      "10 video analyses / month",
      "Chat with your video (basic)",
      "Export TXT/CSV",
    ],
    note: "Best for quick experiments and solo creators just starting.",
  },
  {
    name: "Creator",
    description:
      "Everything you need to scale content: deeper insights, bulk runs, and rich exports.",
    price: { monthly: 29, yearly: 290 }, // save 2 months on yearly
    cta: "Upgrade to Creator",
    ctaHref: "/dashboard",
    highlight: true,
    features: [
      "300 video analyses / month",
      "Chat with video (unlimited Q&A)",
      "Auto titles, short & long summaries",
      "Full timestamped transcript + chapters",
      "JSON/CSV exports & shareable reports",
      "Priority email support",
      "Custom prompt templates",
    ],
    note: "Most popular for creators and small teams shipping weekly.",
  },
  {
    name: "Enterprise",
    description:
      "Multi-client workspaces, white-label exports, and integrations to automate reporting.",
    price: { monthly: 120, yearly: 1000 }, // save 2 months on yearly
    cta: "Talk to sales",
    ctaHref: "mailto:hello@zlyzer.com?subject=Zlyzer%20Agency%20Plan",
    ctaExternal: true,
    features: [
      "Unlimited video analyses",
      "Customized AI models & metadata schemas",
      "White-label dashboards & exports",
      "Webhooks & advanced integrations",
      "API access (usage-metered)",
      "Database exports",
    ],
    note: "Perfect for agencies managing multiple brands at scale.",
  },
];

const FAQS = [
  {
    q: "What makes Zlyzer different?",
    a: "You can literally chat with any video to ask questions, and Zlyzer auto-generates structured metadata (titles, summaries, descriptions, timestamped transcripts) ready for your CMS, reports, or API workflows.",
  },
  {
    q: "How do monthly vs yearly prices work?",
    a: "Yearly billing gives you 2 months free (pay for 10, use for 12). Usage quotas reset monthly. You can switch billing at any time.",
  },
  {
    q: "Can I switch or cancel plans?",
    a: "Yes — upgrade, downgrade, or cancel anytime. Changes apply immediately and are prorated automatically.",
  },
  {
    q: "Do you support teams and clients?",
    a: "Agency and Enterprise include client workspaces, roles/permissions, white-label exports, and advanced integrations.",
  },
  {
    q: "What sources can Zlyzer analyze?",
    a: "TikTok is supported today. Instagram Reels and YouTube Shorts are next. For B2B, we support direct video uploads/URLs via API.",
  },
  {
    q: "Is there a trial for paid tiers?",
    a: "Creator and Agency include a 14-day trial. Cancel anytime in your dashboard before it ends.",
  },
  {
    q: "Do you offer usage-based or custom pricing?",
    a: "Yes. For high volume or API-only use cases, we provide usage-metered quotes on Agency/Enterprise.",
  },
];

/* ------------------------------ Utils ------------------------------ */

const formatMoney = (n: number) => `$${n.toLocaleString()}`;
const isExternalHref = (href: string) =>
  href.startsWith("http") || href.startsWith("mailto:");

function CTAButton({
  href,
  children,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const classes = clsx(
    "mt-8 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition",
    highlight
      ? "bg-[#2ce695] text-[#0b1b14] hover:brightness-110"
      : "border border-white/20 text-white hover:border-white/40"
  );
  return isExternalHref(href) ? (
    <a href={href} className={classes}>
      {children}
    </a>
  ) : (
    <Link to={href} className={classes}>
      {children}
    </Link>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------- Components ----------------------------- */

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Billing cycle"
      className="mt-10 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
    >
      {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
        const active = value === cycle;
        return (
          <button
            key={cycle}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(cycle)}
            className={clsx(
              "px-4 py-2 rounded-xl transition font-semibold flex items-center gap-2",
              active ? "bg-[#2ce695] text-[#0b1b14]" : "text-white/70 hover:bg-white/10"
            )}
          >
            {cycle === "monthly" ? "Monthly" : "Yearly"}
            {cycle === "yearly" && (
              <Badge className="bg-[#0b1b14]/40 text-white">Save 2 months</Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-white/80">
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2ce695]/20 text-[#2ce695]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3.5 w-3.5">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span>{text}</span>
    </li>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: BillingCycle }) {
  const isYearly = billing === "yearly";
  const price = plan.price[billing];

  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-3xl border border-white/10 bg-white/[.03] p-8 backdrop-blur-lg shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-2",
        plan.highlight && "border-[#2ce695]/60 bg-[#132e53]/90"
      )}
    >
      {plan.highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2ce695] text-[#0b1b14] shadow-lg">
          Most popular
        </Badge>
      )}

      <div className="flex-1">
        <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
        <p className="mt-3 text-white/70 text-sm leading-relaxed">{plan.description}</p>

        <div className="mt-6 flex items-baseline gap-2">
          {price === null ? (
            <span className="text-4xl font-bold text-white">Custom</span>
          ) : (
            <>
              <span className="text-4xl font-bold text-white">{formatMoney(price)}</span>
              <span className="text-white/60 text-sm">/ {isYearly ? "year" : "month"}</span>
            </>
          )}
        </div>

        <CTAButton href={plan.ctaHref} highlight={plan.highlight}>
          {plan.cta}
        </CTAButton>

        <ul className="mt-8 space-y-3 text-left">
          {plan.features.map((f) => (
            <FeatureItem key={f} text={f} />
          ))}
        </ul>
      </div>

      {plan.note && <p className="mt-6 text-xs text-white/55 italic">{plan.note}</p>}

      <p className="mt-6 text-xs text-white/50">
        Includes access to the Zlyzer dashboard, analysis history, and upcoming AI enhancements.
      </p>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[.03] p-6 text-left backdrop-blur-sm">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <h3 className="text-lg font-semibold text-white">{q}</h3>
        <span
          className={clsx(
            "text-white/60 transition-transform",
            open ? "rotate-45" : ""
          )}
          aria-hidden
        >
          +
        </span>
      </button>
      <p
        className={clsx(
          "mt-2 text-white/70 text-sm sm:text-base leading-relaxed",
          open ? "block" : "hidden"
        )}
      >
        {a}
      </p>
    </article>
  );
}

/* ------------------------------- Page ------------------------------- */

export default function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const plans = useMemo(() => PLANS, []);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
      {/* Header */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 text-center">
        <Badge className="border border-white/10 bg-white/5 text-white/70 tracking-[0.2em] uppercase">
          Pricing
        </Badge>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
          Choose a plan that grows with your pipeline
        </h1>

        <p className="mt-4 text-white/70 text-base sm:text-lg max-w-3xl mx-auto">
          All plans include our AI engine to{" "}
          <span className="text-white">chat with any video</span> and{" "}
          <span className="text-white">
            auto-generate titles, summaries, descriptions, and timestamped transcripts
          </span>
          . Scale features, quotas, and integrations as you grow.
        </p>

        <BillingToggle value={billing} onChange={setBilling} />
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 flex flex-col items-center">
        <div className="grid gap-10 md:gap-12 w-full max-w-5xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>

        <div className="mt-16 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[.04] p-10 text-left backdrop-blur-md text-center">
          <h2 className="text-2xl font-semibold mb-3">Need a custom workflow or API-only pricing?</h2>
          <p className="text-white/70 text-sm sm:text-base mb-6">
            We help agencies, brands, and platforms with usage-based quotes, custom metadata schemas,
            private models, and compliance reviews.
          </p>
          <a
            href="mailto:hello@zlyzer.com?subject=Zlyzer%20Custom%20Pricing"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            Contact sales
          </a>
        </div>
      </section>


      {/* FAQs */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold text-center">Common questions</h2>
        <p className="mt-2 text-center text-white/60 max-w-2xl mx-auto">
          Everything you need to know before inviting your team.
        </p>
        <div className="mt-10 grid gap-6">
          {FAQS.map((item) => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </section>
    </main>
  );
}
