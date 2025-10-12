// FAQ section with expandable accordion
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How accurate is the AI?',
    answer:
      "Very accurate — our models consistently match real-world results with a very high accuracy. And because we’re always training on fresh TikTok data, the insights only get sharper over time.",
  },
  {
    question: 'What TikTok data do you analyze?',
    answer:
      "Everything that matters. We break down the video itself (visuals, sounds, captions), track engagement like likes and shares, study the creator’s profile, scan comments for sentiment, and even look at posting patterns — all to give you a complete picture of why content performs.",
  },
  {
    question: 'Can I analyze private or competitor videos?',
    answer:
      "Yes — as long as the video or profile is public. Private content stays private unless you have access. And of course, we fully respect TikTok’s terms of service.",
  },
  {
    question: 'Do you offer partnerships?',
    answer:
      "Yes — we love partnering with agencies, platforms, and growth teams. Through our partnership program, you can ship fully customized video analysis reports directly to your clients, created by our expert team under your brand. It’s a powerful way to expand your service offering without building analytics tools yourself.",
  },
  {
    question: 'Do you offer white-label for agencies?',
    answer:
      "Absolutely. On our Agency plan and above, you can use your own branding, domain, and client portal. It’s perfect if you want to offer TikTok analytics as part of your own service.",
  },
  {
    question: 'What counts as one analysis?',
    answer:
      "One analysis equals one full breakdown of a single video. Drafts don’t count toward your limit, and re-analyzing the same video is free.",
  },
  {
    question: 'Can I share analyses with my team?',
    answer:
      "Yes! The Professional plan includes 2 team seats, and the Agency plan includes 5. Need more? Enterprise plans offer unlimited seats — everyone gets full access to insights and exports.",
  },
  {
    question: 'How fast is the analysis?',
    answer:
      "Super fast. Most single-video analyses are ready in 15–30 seconds. Even deep profile scans with hundreds of videos finish in a few minutes — all processed in real time.",
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

