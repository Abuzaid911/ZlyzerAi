"use client";

import React, { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeamPath {
  path: string;
  gradientConfig: {
    initial: { x1: string; x2: string; y1: string; y2: string };
    animate: {
      x1: string | string[];
      x2: string | string[];
      y1: string | string[];
      y2: string | string[];
    };
    transition?: {
      duration?: number;
      repeat?: number;
      repeatType?: "loop" | "mirror" | "reverse";
      ease?: string;
      repeatDelay?: number;
      delay?: number;
    };
  };
  connectionPoints?: Array<{ cx: number; cy: number; r: number }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  beams: BeamPath[];

  /** The logical drawing size for your paths (use the coordinate space your paths were authored in). */
  viewBox?: string; // e.g. "0 0 900 450"

  /** Container sizing is controlled by CSS; SVG will scale inside. Defaults keep it responsive. */
  baseColor?: string;
  accentColor?: string;
  gradientColors?: { start: string; middle: string; end: string };

  /** Stroke widths (optional) */
  baseStrokeWidth?: number; // dim line beneath gradient
  glowStrokeWidth?: number; // gradient stroke on top
}

export const PulseBeams = ({
  children,
  className,
  background,
  beams,
  viewBox = "0 0 858 434", // matches your original width/height unless you pass another
  baseColor = "#1f2937", // slate-800 fallback
  accentColor = "#334155", // slate-700/600 fallback
  gradientColors,
  baseStrokeWidth = 1,
  glowStrokeWidth = 2,
}: PulseBeamsProps) => {
  return (
    <div
      className={cn(
        // Let the parent decide size; this container just fills available space.
        "relative w-full h-full overflow-hidden antialiased",
        className
      )}
    >
      {/* Optional background layer (e.g. gradients, noise) */}
      {background}

      {/* Beams SVG (non-interactive, under overlays) */}
      <div className="absolute inset-0">
        <SVGs
          beams={beams}
          viewBox={viewBox}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
          baseStrokeWidth={baseStrokeWidth}
          glowStrokeWidth={glowStrokeWidth}
        />
      </div>

      {/* Overlay content (buttons, badges, etc.) */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

type SVGsProps = {
  beams: BeamPath[];
  viewBox: string;
  baseColor: string;
  accentColor: string;
  gradientColors?: { start: string; middle: string; end: string };
  baseStrokeWidth: number;
  glowStrokeWidth: number;
};

const SVGs: React.FC<SVGsProps> = ({
  beams,
  viewBox,
  baseColor,
  accentColor,
  gradientColors,
  baseStrokeWidth,
  glowStrokeWidth,
}) => {
  // unique prefix so gradient ids don't collide when multiple PulseBeams mount
  const uid = useId();

  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full flex-shrink-0 pointer-events-none select-none"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Paths + connection points */}
      {beams.map((beam, index) => (
        <React.Fragment key={index}>
          {/* Base line */}
          <path d={beam.path} stroke={baseColor} strokeWidth={baseStrokeWidth} />

          {/* Glow gradient stroke */}
          <path
            d={beam.path}
            stroke={`url(#${uid}-grad-${index})`}
            strokeWidth={glowStrokeWidth}
            strokeLinecap="round"
          />

          {/* Optional connection nodes */}
          {beam.connectionPoints?.map((p, i) => (
            <circle
              key={`${index}-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={baseColor}
              stroke={accentColor}
            />
          ))}
        </React.Fragment>
      ))}

      {/* Animated gradient defs */}
      <defs>
        {beams.map((beam, index) => (
          <motion.linearGradient
            key={index}
            id={`${uid}-grad-${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate}
            transition={beam.gradientConfig.transition}
          >
            <GradientStops colors={gradientColors} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
};

const GradientStops: React.FC<{
  colors?: { start: string; middle: string; end: string };
}> = ({
  colors = {
    start: "#18CCFC",
    middle: "#6344F5",
    end: "#AE48FF",
  },
}) => (
  <>
    <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
    <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
    <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
    <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
  </>
);
