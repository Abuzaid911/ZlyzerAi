import React, { useState } from "react";
import { Link } from "react-router-dom";
// import { motion } from "framer-motion"; // optional subtle animations

/* Brand */
// Removed unused constant
const MINT = "#2ce695";

/** Test page for user guidance through Zlyzer */
export default function GuidedTestPage() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [agreed, setAgreed] = useState(true);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setStep(2);
    setTimeout(() => setStep(3), 900);
    setTimeout(() => setStep(4), 1800);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
      <Header />

      {/* Container */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-white/60">
          <Link to="/" className="hover:text-white">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Guided Tour</span>
        </nav>

        {/* Title + Intro */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Get results in minutes with{" "}
            <span className="bg-gradient-to-r from-[#2ce695] via-[#18ccfc] to-[#6344f5] bg-clip-text text-transparent">
              Zlyzer’s Guided Tour
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/80">
            Follow these steps to see how agencies analyze TikTok, Instagram, Facebook, X, and YouTube content.
            No risk—this page uses a safe sandbox flow for demo purposes.
          </p>
        </section>

        {/* Progress */}
        <ProgressDots active={step} className="mt-6" />

        {/* Try Panel */}
        <TryPanel
          url={url}
          setUrl={setUrl}
          onSubmit={onSubmit}
          agreed={agreed}
          setAgreed={setAgreed}
          step={step}
        />

        {/* Steps Grid */}
        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <StepCard
            index={1}
            title="Overview: What you’ll do"
            active={step === 1}
            bullets={[
              "Paste a TikTok, Instagram, Facebook, X, or YouTube link",
              "Run AI analysis (hooks, emotion, trend clusters)",
              "Review insights and export a brief",
            ]}
          />
          <StepCard
            index={2}
            title="Analyze: Paste a link"
            active={step === 2}
            bullets={[
              "Zlyzer tags hooks, CTAs, captions, and sound",
              "Detects emotion peaks and drop-offs by timestamp",
              "Surfaces trends and creator patterns to reuse",
            ]}
          />
          <StepCard
            index={3}
            title="Insights: What you’ll see"
            active={step === 3}
            bullets={[
              "Audience Radar, Creator Console, Trend Translator",
              "Clip-by-clip retention and sentiment signals",
              "Actionable recommendations mapped to outcomes",
            ]}
          />
          <StepCard
            index={4}
            title="Export: Share with your team"
            active={step === 4}
            bullets={[
              "1-click brief export (deck or doc)",
              "Copy/paste assets into reviews or client updates",
              "Save to workspace for future comparisons",
            ]}
          />
        </section>

        {/* Tips */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <FeatureCallout
            label="Agency-ready"
            title="Built for multi-platform workflows"
            body="Compare performance across TikTok, Instagram, Facebook, X, and YouTube—and make decisions with one unified console."
          />
          <FeatureCallout
            label="Actionable by design"
            title="Insights → Decisions → Results"
            body="Each finding is tied to a practical move—what to reuse, where to tighten the edit, and when to post."
          />
          <FeatureCallout
            label="Trust & security"
            title="Private by default"
            body="Only your team can see your analyses. You can delete any run at any time from the dashboard."
          />
        </div>

        {/* Shortcuts + FAQ */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <KeyboardShortcuts />
          <FAQ />
        </div>
      </div>

      {/* Sticky Footer CTA */}
      <StickyFooterCTA />
    </main>
  );
}

/* ───────────────────────────── UI: Header ───────────────────────────── */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#132e53]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: MINT }} />
          Zlyzer
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#tour" className="hover:text-white">Tour</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link to="/video-analysis" className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 hover:border-white/30">
            Open Analyzer
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────── UI: Progress ───────────────────────────── */

function ProgressDots({ active, className = "" }: { active: 1|2|3|4; className?: string }) {
  const items = [1,2,3,4] as const;
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {items.map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-all ${
            active >= i ? "bg-[#2ce695]" : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── UI: Try Panel ───────────────────────────── */

function TryPanel({
  url, setUrl, onSubmit, agreed, setAgreed, step
}: {
  url: string;
  setUrl: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  step: 1|2|3|4;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr,460px]">
        {/* Left copy */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Step {step} of 4</p>
          <h2 className="mt-1 text-2xl font-semibold">Test it right here</h2>
          <p className="mt-2 text-white/80">
            Paste a TikTok, Instagram, Facebook, X, or YouTube URL. This page simulates the workflow end-to-end.
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-white/75 list-disc list-inside">
            <li>We’ll show you how the analyzer behaves</li>
            <li>No data is saved in this demo flow</li>
            <li>Use the real analyzer anytime from the top menu</li>
          </ul>
        </div>

        {/* Right form */}
        <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <label htmlFor="demo-url" className="text-xs uppercase tracking-[0.25em] text-white/50">
            Paste social link
          </label>
          <input
            id="demo-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@creator/video/..."
            className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-white placeholder-white/40 outline-none focus:border-[#2ce695]/70"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-transparent"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              I understand this is a demo flow.
            </label>
            <button
              type="submit"
              disabled={!agreed}
              className="rounded-xl bg-[#2ce695] px-4 py-2 text-sm font-semibold text-[#0b1b14] shadow-[0_10px_30px_rgba(44,230,149,0.35)] transition hover:brightness-110 disabled:opacity-60"
            >
              Run Demo
            </button>
          </div>
          {/* fake status */}
          <p className="mt-3 text-xs text-white/60">
            {step === 1 && "Waiting for a link…"}
            {step === 2 && "Analyzing… tagging hooks and trends"}
            {step === 3 && "Generating insights…"}
            {step === 4 && "Done! Explore the steps below."}
          </p>
        </form>
      </div>
    </section>
  );
}

/* ───────────────────────────── UI: Step Card ───────────────────────────── */

function StepCard({
  index, title, bullets, active
}: {
  index: number;
  title: string;
  bullets: string[];
  active?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 transition ${
        active ? "border-[#2ce695]/50 bg-white/[.06]" : "border-white/10 bg-white/[.04]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-white/60">Step {index}</div>
        <span className={`h-2 w-2 rounded-full ${active ? "bg-[#2ce695]" : "bg-white/20"}`} />
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[#2ce695]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {index === 3 && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MiniViz title="Audience Radar" />
          <MiniViz title="Creator Console" />
          <MiniViz title="Trend Translator" />
        </div>
      )}
    </section>
  );
}

/* ───────────────────────────── UI: Feature Callout ───────────────────────────── */

function FeatureCallout({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60">{label}</div>
      <h4 className="mt-1 text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-white/80">{body}</p>
    </div>
  );
}

/* ───────────────────────────── UI: Keyboard Shortcuts ───────────────────────────── */

function KeyboardShortcuts() {
  const items = [
    ["⌘/Ctrl + V", "Paste a social URL"],
    ["⌘/Ctrl + Enter", "Start analysis"],
    ["1 / 2 / 3", "Switch visualization"],
    ["Shift + S", "Save to workspace"],
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <h3 className="text-lg font-semibold">Quick shortcuts</h3>
      <ul className="mt-3 grid gap-2 text-sm text-white/80">
        {items.map(([k, d]) => (
          <li key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <span>{d}</span>
            <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-white/90">{k}</kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── UI: FAQ ───────────────────────────── */

function FAQ() {
  const faqs = [
    ["Does the demo save data?", "No. This page simulates the workflow without saving any input."],
    ["What links are supported?", "TikTok, Instagram, Facebook, X, and YouTube posts or profiles."],
    ["Where do I see full results?", "Use the main analyzer from the top menu for complete, exportable insights."],
  ];
  return (
    <section id="faq" className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
      <h3 className="text-lg font-semibold">FAQ</h3>
      <div className="mt-3 divide-y divide-white/10">
        {faqs.map(([q, a]) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-white/90">
              <span>{q}</span>
              <span className="text-white/60 transition group-open:rotate-180">⌄</span>
            </summary>
            <p className="pb-3 text-white/80">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────── UI: Sticky CTA ───────────────────────────── */

function StickyFooterCTA() {
  return (
    <div className="sticky bottom-0 mt-10 border-t border-white/10 bg-[#0f223e]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="text-sm text-white/80">
          Ready to run a real analysis?
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/video-analysis"
            className="rounded-xl bg-[#2ce695] px-4 py-2 text-sm font-semibold text-[#0b1b14] shadow-[0_10px_30px_rgba(44,230,149,0.35)] transition hover:brightness-110"
          >
            Open Analyzer
          </Link>
          <a
            href="#"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:border-white/30"
          >
            View Docs
          </a>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Mini Visuals ───────────────────────────── */

function MiniViz({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2 text-xs text-white/60">{title}</div>
      <svg viewBox="0 0 300 120" className="w-full">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2ce695" />
            <stop offset="60%" stopColor="#18ccfc" />
            <stop offset="100%" stopColor="#6344f5" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" rx="12" fill="#0c1220" />
        {/* grid */}
        <g opacity=".18" stroke="#fff">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={"v"+i} x1={i * 30} x2={i * 30} y1={0} y2={120} strokeWidth=".5" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={"h"+i} y1={i * 24} y2={i * 24} x1={0} x2={300} strokeWidth=".5" />
          ))}
        </g>
        {/* wave */}
        <path
          d="M10,80 C50,30 80,110 120,70 C160,30 200,110 240,70 C260,55 285,70 295,60"
          fill="none"
          stroke="url(#g)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
