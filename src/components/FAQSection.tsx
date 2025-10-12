// FAQ section with expandable accordion
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How accurate is the AI?',
    answer: 'Our analysis model has a 92% accuracy rate, validated against actual video performance across 2M+ videos. We continuously train our AI on new data to improve accuracy.',
  },
  {
    question: 'What TikTok data do you analyze?',
    answer: 'We analyze video content (visual, audio, captions), engagement metrics, creator profiles, comments sentiment, and posting patterns. Our AI processes multiple data points to provide comprehensive insights.',
  },
  {
    question: 'Can I analyze private or competitor videos?',
    answer: 'Any public TikTok video or profile is analyzable. Private accounts require their permission. We respect TikTok\'s terms of service and only analyze publicly available content.',
  },
  {
    question: 'Is there a contract?',
    answer: 'No. All plans are month-to-month. Cancel anytime with no questions asked. We believe in earning your business every month, not locking you in.',
  },
  {
    question: 'Do you offer white-label for agencies?',
    answer: 'Yes, on the Agency plan and above. Custom branding, domain, and client portals are available. Perfect for agencies who want to offer TikTok analysis as their own service.',
  },
  {
    question: 'What counts as one analysis?',
    answer: 'One analysis = one video OR one profile deep-dive. Partial analyses (saving drafts) don\'t count against your limit. Re-analyzing the same video also doesn\'t count.',
  },
  {
    question: 'Can I share analyses with my team?',
    answer: 'Professional plan includes 2 team members. Agency plan includes 5 team members, with unlimited seats available for Enterprise. All team members get full access to analyses and exports.',
  },
  {
    question: 'How fast is the analysis?',
    answer: 'Most analyses complete in 15-30 seconds. Complex profile analyses with hundreds of videos may take up to 2 minutes. We process requests in real-time, not batch jobs.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Questions? We've Got Answers
            </span>
          </h2>
          <p className="text-lg text-white/60">
            Everything you need to know about Zlyzer
          </p>
        </motion.div>

        {/* FAQ accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white pr-8">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-[#2ce695]" />
                    ) : (
                      <Plus className="w-5 h-5 text-white/60" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-white/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-white/60 mb-4">Still have questions?</p>
          <a
            href="mailto:zlyzerai@gmail.com?subject=Zlyzer%20—%20Ask%20any%20Question"
            className="inline-flex items-center gap-2 text-[#2ce695] hover:text-[#7affd0] font-semibold transition-colors"
          >
            Get in touch with our team
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

