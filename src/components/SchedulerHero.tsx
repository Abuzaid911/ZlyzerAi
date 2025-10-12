import * as React from "react";
import { Link } from "react-router-dom";
// @ts-expect-error - LogoLoop is a JSX component
import LogoLoop from './LogoLoop';
import { SiTiktok, SiInstagram, SiFacebook, SiX, SiYoutube } from 'react-icons/si';

/** Brand tokens */
const NAVY = "#132e53";

/** Social media platforms Zlyzer supports */
const socialLogos = [
  { node: <SiTiktok />, title: "TikTok", href: "https://tiktok.com" },
  { node: <SiInstagram />, title: "Instagram", href: "https://instagram.com" },
  { node: <SiFacebook />, title: "Facebook", href: "https://facebook.com" },
  { node: <SiX />, title: "X (Twitter)", href: "https://x.com" },
  { node: <SiYoutube />, title: "YouTube", href: "https://youtube.com" },
];

export default function ZlyzerAgencyHero() {
  return (
      
    <section
    
      aria-label="Zlyzer AI video intelligence hero"
      className="relative overflow-hidden text-white"
    >
      {/* Background: deep navy + soft mint stripes + vignette */}
      <div className="absolute inset-0 -z-20" style={{ background: NAVY }} />
      <div className="absolute inset-0 -z-10 opacity-[0.45]">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(44,230,149,0.10)_15%,transparent_30%,transparent_55%,rgba(24,204,252,0.10)_70%,transparent_85%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1000px_400px_at_70%_10%,rgba(99,68,245,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_30%_90%,rgba(44,230,149,0.20),transparent_60%)]" />
        {/* vignette to keep text legible */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_120%,rgba(0,0,0,0.35),transparent_60%)]" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:px-8 lg:grid-cols-[1.05fr,0.95fr] lg:gap-14 lg:py-24">
        {/* Copy — centered on all screens */}
        <div className="text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
            Trusted by digital agencies
          </p>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            Level up Your Agency with{" "}
            <span className="bg-gradient-to-r from-[#2ce695] via-[#ffffff] to-[#f8f8f8] bg-clip-text text-transparent">
              AI-Driven Video Insights
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            Analyze every frame, sound, and trend across TikTok, Instagram, Facebook, X, and YouTube.
            Zlyzer turns raw content into actionable guidance that lifts engagement and growth.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/video-analysis"
              className="inline-flex items-center justify-center rounded-xl bg-[#2ce695] px-6 py-3 text-sm font-semibold text-[#0b1b14] shadow-[0_14px_40px_rgba(44,230,149,0.35)] transition hover:brightness-110 active:scale-[.99]"
            >
              Start Free Analysis
            </Link>
            <a
              href="mailto:zlyzerai@gmail.com?subject=Zlyzer%20—%20Ask%20any%20Question"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-[#2ce695]/50"
            >
              Contact Us
            </a>
          </div>

          {/* Credibility row */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-white/70">
            <span>Preferred by</span>
            <div className="flex items-center gap-3">
              <Badge>Agency OS</Badge>
              <Badge>CreatorHouse</Badge>
              <Badge>Northwind</Badge>
            </div>
          </div>
        </div>

        {/* Visual */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl backdrop-blur flex items-center justify-center min-h-[420px] md:min-h-[520px]">
            {/* Lottie animation using React.createElement to avoid TS errors */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {React.createElement('dotlottie-wc' as any, {
              src: "https://lottie.host/12c6b7f2-27b4-4d59-954e-433cc9f04cc3/E2dQQyE33f.lottie",
              autoplay: true,
              loop: true,
              style: { width: '100%', height: '420px' }
            })}
            <div className="pointer-events-none absolute -bottom-8 left-1/2 h-36 w-3/4 -translate-x-1/2 rounded-full blur-2xl" />
          </div>


          {/* Social platforms carousel */}
          <div className="mt-8 h-16 relative overflow-hidden opacity-50">
            <LogoLoop
              logos={socialLogos}
              speed={40}
              direction="left"
              logoHeight={40}
              gap={256}
              pauseOnHover
              scaleOnHover
              fadeOut
              fadeOutColor={NAVY}
              ariaLabel="Supported social media platforms"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- UI atoms ---------- */

function Badge({ children }: React.PropsWithChildren) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-white/85">
      {children}
    </span>
  );
}
