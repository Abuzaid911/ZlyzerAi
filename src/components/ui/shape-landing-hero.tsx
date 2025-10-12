"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Floating soft “glass” ribbons */
function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-[#2ce695]/15",
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/15",
            "shadow-[0_8px_32px_0_rgba(44,230,149,0.15)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(44,230,149,0.15),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

function HeroGeometric({
  badge = "Built for agencies & creators",
  title1 = "Analyze every",
  title2 = "Grow every",
  children,
}: {
  badge?: string;
  title1?: string;
  title2?: string;
  children?: ReactNode;
}) {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] },
    }),
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#132e53] text-white">
      {/* base gradient to #191e29 */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_20%,rgba(44,230,149,0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] opacity-90" />

      {/* floating shapes (brand colors) */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.25}
          width={620}
          height={140}
          rotate={12}
          gradient="from-[#2ce695]/18"
          className="left-[-8%] md:left-[-2%] top-[16%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.45}
          width={520}
          height={120}
          rotate={-14}
          gradient="from-[#132e53]/35"
          className="right-[-6%] md:right-[0%] top-[70%] md:top-[74%]"
        />
        <ElegantShape
          delay={0.4}
          width={320}
          height={80}
          rotate={-8}
          gradient="from-[#2ce695]/12"
          className="left-[6%] md:left-[10%] bottom-[6%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={220}
          height={60}
          rotate={20}
          gradient="from-[#191e29]/40"
          className="right-[14%] md:right-[20%] top-[10%] md:top-[14%]"
        />
        <ElegantShape
          delay={0.7}
          width={160}
          height={44}
          rotate={-24}
          gradient="from-[#2ce695]/14"
          className="left-[20%] md:left-[26%] top-[6%] md:top-[10%]"
        />
      </div>

      {/* content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 md:mb-12"
          >
            <Circle className="h-2 w-2 text-[#2ce695] fill-[#2ce695]" />
            <span className="text-sm text-white/70 tracking-wide">{badge}</span>
          </motion.div>

          {/* headline */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold mb-6 md:mb-8 tracking-tight leading-[1.05]">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/85">
                {title1} <span className="text-[#2ce695] relative">profile</span>.
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/85">
                {title2} <span className="text-[#2ce695] relative">post</span>.
              </span>
            </h1>
          </motion.div>

          {/* subcopy */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-white/70 mb-8 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
              Zlyzer turns TikTok profiles & videos into actionable insights:
              emotions, engagement, hashtags, audio, and performance — all in one
              AI-powered dashboard.
            </p>
          </motion.div>

          {children && (
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-6 flex justify-center"
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>

      {/* vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#132e53] via-transparent to-[#132e53]/70 pointer-events-none" />
    </div>
  );
}

export { HeroGeometric };
