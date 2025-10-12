// Testimonials section with user reviews
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Fitness Creator',
    followers: '1.2M followers',
    image: '👩‍💼',
    content: 'Zlyzer showed me the exact hook patterns my audience responds to. My first video using those insights hit 2M views. This is a game-changer for creators who want to be strategic.',
    rating: 5,
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Agency Owner',
    company: 'Digital Velocity',
    image: '👨‍💼',
    content: 'We analyzed 500+ competitor videos in one weekend. Would\'ve taken us 3 months manually. Zlyzer paid for itself in the first week. Our client pitches are now data-backed and confident.',
    rating: 5,
  },
  {
    name: 'Emily Watson',
    role: 'Brand Manager',
    company: 'TechFlow Inc',
    image: '👩',
    content: 'Before Zlyzer: hoping influencers delivered. After: vetting their content strategy upfront. Our campaign ROI doubled. The insights are incredibly detailed and actionable.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
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
              Join 15,000+ Creators Who've Cracked TikTok
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Real results from real users who stopped guessing and started winning
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-[#2ce695]/30 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#2ce695] text-[#2ce695]" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-white/80 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2ce695] to-[#18CCFC] flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-white/60">
                      {testimonial.role}
                      {testimonial.followers && ` • ${testimonial.followers}`}
                      {testimonial.company && ` @ ${testimonial.company}`}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center items-center gap-8 mt-16"
        >
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
            <Star className="w-5 h-5 fill-[#2ce695] text-[#2ce695]" />
            <span className="font-semibold text-white">4.9/5</span>
            <span className="text-white/60">on G2</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
            <Star className="w-5 h-5 fill-[#2ce695] text-[#2ce695]" />
            <span className="font-semibold text-white">4.8/5</span>
            <span className="text-white/60">on Capterra</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-semibold text-[#2ce695]">#2 Product of the Day</span>
            <span className="text-white/60">on ProductHunt</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

