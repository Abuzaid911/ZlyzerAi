// Pricing section with three tiers
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Starter',
    price: '0',
    period: 'forever',
    description: 'Perfect for trying out Zlyzer',
    features: [
      '5 video analyses/month',
      '2 profile analyses/month',
      'Basic insights',
      'Standard support',
    ],
    cta: 'Start Free',
    ctaLink: '/video-analysis',
    popular: false,
    gradient: 'from-white/10 to-white/5',
  },
  {
    name: 'Professional',
    price: '49',
    period: 'month',
    description: 'For serious creators & small agencies',
    features: [
      '100 video analyses/month',
      '20 profile analyses/month',
      'Advanced insights + opportunities',
      'Custom analysis prompts',
      'Export reports (PDF/JSON)',
      'Priority support',
    ],
    cta: 'Start 14-Day Trial',
    ctaLink: '/video-analysis',
    popular: true,
    gradient: 'from-[#2ce695]/20 to-[#18CCFC]/20',
  },
  {
    name: 'Agency',
    price: '199',
    period: 'month',
    description: 'For teams & established agencies',
    features: [
      'Unlimited video analyses',
      'Unlimited profile analyses',
      'AI-powered competitive tracking',
      'White-label reports',
      'Team collaboration (5 seats)',
      'API access',
      'Dedicated account manager',
    ],
    cta: 'Book Demo',
    ctaLink: '/video-analysis',
    popular: false,
    gradient: 'from-[#6344F5]/20 to-[#2ce695]/20',
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Start Analyzing in 60 Seconds
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2ce695] to-[#18CCFC] text-[#0b1b14] text-sm font-bold">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`
                  relative h-full rounded-2xl border p-8 transition-all duration-300
                  ${
                    plan.popular
                      ? 'border-[#2ce695]/50 bg-gradient-to-br from-[#2ce695]/10 to-[#18CCFC]/10 scale-105 shadow-[0_20px_60px_rgba(44,230,149,0.2)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }
                `}
              >
                {/* Plan name */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-white/60">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-white/60">/{plan.period}</span>
                  </div>
                </div>

                {/* CTA button */}
                <Link
                  to={plan.ctaLink}
                  className={`
                    block w-full py-3 px-6 rounded-xl font-semibold text-center transition-all mb-8
                    ${
                      plan.popular
                        ? 'bg-[#2ce695] text-[#0b1b14] hover:bg-[#7affd0] hover:shadow-[0_0_30px_rgba(44,230,149,0.4)]'
                        : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                    }
                  `}
                >
                  {plan.cta}
                </Link>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2ce695]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-[#2ce695]" />
                      </div>
                      <span className="text-sm text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12 text-sm text-white/50"
        >
          <p>All plans include: 14-day money-back guarantee • Cancel anytime • No hidden fees</p>
          <p className="mt-2">
            Need more?{' '}
            <Link to="/video-analysis" className="text-[#2ce695] hover:text-[#7affd0]">
              Enterprise solutions available →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

