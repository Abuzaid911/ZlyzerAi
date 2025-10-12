// Use case tabs for different user personas
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Briefcase, Sparkles, TrendingUp } from 'lucide-react';

const useCases = [
  {
    id: 'agencies',
    label: 'For Agencies',
    icon: Briefcase,
    title: 'Land & Retain More Clients',
    benefits: [
      'Pre-pitch intelligence: Analyze potential clients\' current content',
      'Campaign planning: Decode what works in their niche',
      'Client reporting: Auto-generate insight-rich performance reports',
      'ROI proof: Show data-backed recommendations that convert',
    ],
    stat: '40%',
    statLabel: 'Increase in client retention',
    gradient: 'from-[#2ce695] to-[#18CCFC]',
  },
  {
    id: 'creators',
    label: 'For Creators',
    icon: Sparkles,
    title: 'Create Smarter, Not Harder',
    benefits: [
      'Content ideation: See what hooks are working in your category',
      'Pre-publish checks: Analyze drafts before posting',
      'Competitor tracking: Learn from successful creators in your space',
      'Trend timing: Know when to jump on trends (before saturation)',
    ],
    stat: '3.2x',
    statLabel: 'Average engagement boost',
    gradient: 'from-[#18CCFC] to-[#6344F5]',
  },
  {
    id: 'brands',
    label: 'For Brands',
    icon: TrendingUp,
    title: 'Make Informed Marketing Decisions',
    benefits: [
      'Influencer vetting: Analyze potential partners\' content quality',
      'Market research: Understand what resonates with your audience',
      'Campaign optimization: Test concepts before production',
      'Competitive monitoring: Track brand mentions and sentiment',
    ],
    stat: '67%',
    statLabel: 'Reduction in content waste',
    gradient: 'from-[#6344F5] to-[#2ce695]',
  },
];

export default function UseCaseTabs() {
  const [activeTab, setActiveTab] = useState('agencies');
  const activeUseCase = useCases.find((uc) => uc.id === activeTab) || useCases[0];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Built for How You Actually Work
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Whether you're an agency, creator, or brand — Zlyzer adapts to your workflow
          </p>
        </motion.div>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {useCases.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setActiveTab(useCase.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                ${
                  activeTab === useCase.id
                    ? 'bg-white/10 border-2 border-[#2ce695] text-[#2ce695]'
                    : 'bg-white/[0.02] border border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white'
                }
              `}
            >
              <useCase.icon className="w-5 h-5" />
              {useCase.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 md:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                {activeUseCase.title}
              </h3>

              <ul className="space-y-4">
                {activeUseCase.benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#2ce695]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-white/80">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Right: Stat showcase */}
            <div className="relative">
              <div className={`relative rounded-2xl bg-gradient-to-br ${activeUseCase.gradient} p-[2px]`}>
                <div className="rounded-2xl bg-[#132e53] p-12 text-center">
                  <motion.div
                    key={`${activeTab}-stat`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <activeUseCase.icon className="w-16 h-16 mx-auto mb-6 text-[#2ce695]" />
                    <p className={`text-6xl md:text-7xl font-extrabold bg-gradient-to-r ${activeUseCase.gradient} bg-clip-text text-transparent mb-4`}>
                      {activeUseCase.stat}
                    </p>
                    <p className="text-xl text-white/80">
                      {activeUseCase.statLabel}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#2ce695]/10 blur-2xl"
              />
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-[#18CCFC]/10 blur-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

