// Landing page hero section with interactive demo
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#132e53] via-[#1a2744] to-[#191e29]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#2ce695]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#18CCFC]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2ce695]/10 border border-[#2ce695]/30 mb-6"
            >
              <Sparkles className="w-4 h-4 text-[#2ce695]" />
              <span className="text-sm font-medium text-[#2ce695]">AI-Powered TikTok Intelligence</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Decode Any
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#2ce695] via-[#c5c6c7] to-[#ffffff] bg-clip-text text-transparent">
                TikTok Strategy
              </span>
              <br />
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl">
              AI-powered video analysis for agencies, creators, and brands who refuse to guess. 
              Get instant insights on hooks, sentiment, viral patterns, and competitor strategies.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                to="/video-analysis"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2ce695] text-[#0b1b14] rounded-xl font-semibold text-lg transition-all hover:bg-[#7affd0] hover:shadow-[0_0_40px_rgba(44,230,149,0.4)] hover:scale-105"
              >
                Analyze Your First Video — Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold text-lg transition-all hover:bg-white/10 hover:border-white/20">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>2.1M+ videos analyzed</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ce695]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>15,000+ users worldwide</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

