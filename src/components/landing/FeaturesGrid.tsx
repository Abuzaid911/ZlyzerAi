// Features grid showcasing core capabilities
import { motion } from 'framer-motion';
import { Video, Users, Target, Sparkles, FileText, Zap } from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'AI Video Analysis',
    description: 'Upload any TikTok video. Get instant insights on hooks, pacing, sentiment, and viral indicators. Know what works before you create.',
    gradient: 'from-[#2ce695] to-[#18CCFC]',
  },
  {
    icon: Users,
    title: 'Profile Deep-Dive',
    description: 'Analyze any creator\'s entire strategy. Uncover content themes, posting patterns, audience sentiment, and growth tactics.',
    gradient: 'from-[#18CCFC] to-[#6344F5]',
  },
  {
    icon: Target,
    title: 'Competitor Intelligence',
    description: 'Track what\'s working for competitors. Identify their winning formulas, content gaps you can exploit, and emerging trends.',
    gradient: 'from-[#6344F5] to-[#2ce695]',
  },
  {
    icon: Sparkles,
    title: 'Opportunity Scanner',
    description: 'AI spots untapped opportunities in your niche. Get alerted to rising hooks, underutilized formats, and whitespace strategies.',
    gradient: 'from-[#2ce695] to-[#6344F5]',
  },
  {
    icon: Zap,
    title: 'Custom Analysis Prompts',
    description: 'Ask AI anything. "Focus on retention hooks" or "Analyze for brand safety" — tailor insights to your exact needs.',
    gradient: 'from-[#18CCFC] to-[#2ce695]',
  },
  {
    icon: FileText,
    title: 'Export & Report',
    description: 'Generate client-ready reports. Export as PDF, JSON, or shareable links. Perfect for agencies and teams.',
    gradient: 'from-[#6344F5] to-[#18CCFC]',
  },
];

export default function FeaturesGrid() {
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
              Your TikTok Intelligence Arsenal
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything you need to decode, analyze, and dominate TikTok — powered by cutting-edge AI
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                {/* Icon with gradient background */}
                <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-[2px] mb-4`}>
                  <div className="w-full h-full rounded-[10px] bg-[#132e53] flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2ce695] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect gradient */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

