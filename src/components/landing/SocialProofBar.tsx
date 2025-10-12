// Social proof bar with logos and metrics
import { motion } from 'framer-motion';

export default function SocialProofBar() {
  return (
    <section className="py-12 border-y border-white/10 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm uppercase tracking-wider text-white/50 mb-8">
            Trusted by 15,000+ creators & agencies worldwide
          </p>
          
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2ce695] to-[#18CCFC] bg-clip-text text-transparent">
                2.1M+
              </p>
              <p className="text-sm text-white/60 mt-1">Videos Analyzed</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#18CCFC] to-[#6344F5] bg-clip-text text-transparent">
                15K+
              </p>
              <p className="text-sm text-white/60 mt-1">Active Users</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#6344F5] to-[#2ce695] bg-clip-text text-transparent">
                94%
              </p>
              <p className="text-sm text-white/60 mt-1">Success Rate</p>
            </div>
            
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2ce695] to-[#6344F5] bg-clip-text text-transparent">
                3.2x
              </p>
              <p className="text-sm text-white/60 mt-1">Avg. Engagement Boost</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

