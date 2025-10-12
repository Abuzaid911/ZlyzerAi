// Final CTA section to convert remaining visitors
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2ce695]/5 to-transparent" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/4 w-96 h-96" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2ce695]/10 border border-[#2ce695]/30">
            <Sparkles className="w-4 h-4 text-[#2ce695]" />
            <span className="text-sm font-medium text-[#2ce695]">Ready to Stop Guessing?</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Your Competitive Edge
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#2ce695] via-[#c7c8c9] to-[#ffffff] bg-clip-text text-transparent">
              Starts Here
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join 15,000+ creators and agencies who've decoded TikTok with AI-powered intelligence
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              to="/video-analysis"
              className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#2ce695] text-[#0b1b14] rounded-xl font-bold text-lg transition-all hover:bg-[#7affd0] hover:shadow-[0_0_40px_rgba(44,230,149,0.5)] hover:scale-105"
            >
              Analyze Your First Video — Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50 pt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Takes just a few seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Instant access</span>
            </div>
          </div>

          {/* Live counter */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-sm pt-4"
          >
            <span className="text-[#2ce695] font-semibold">2,000+</span> analyses requested this month. Start yours today.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

