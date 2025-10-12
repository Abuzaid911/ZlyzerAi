// components/ScrollFadeSection.tsx
"use client";

import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** How far the section travels on exit (px) */
  translate?: number;        // default 60
  /** Where the fade starts/ends in viewport */
  start?: string;            // default "top 70%"
  end?: string;              // default "bottom 30%"
  /** Respect reduced motion */
  respectReducedMotion?: boolean; // default true
};

export default function ScrollFadeSection({
  children,
  className,
  translate = 60,
  start = "top 70%",
  end = "bottom 30%",
  respectReducedMotion = true,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return; // no animation for reduced-motion users
    }

    const ctx = gsap.context(() => {
      // As the section scrolls through the viewport, fade from 1 -> 0 and move down a bit.
      gsap.fromTo(
        el,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: translate,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start,
            end,
            scrub: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [translate, start, end, respectReducedMotion]);

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
