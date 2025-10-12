// components/HeroZlyzer.tsx
import React, { useState } from "react";

export default function HeroZlyzer() {
  const [mode, setMode] = useState<"analyze" | "demo">("analyze");

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* LEFT: Copy + CTA */}
        <div className="lg:col-span-5 xl:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="inline-block h-2 w-2 rounded-full bg-[#2ce695]" />
            Built for agencies & creators
          </div>

          <h1 className="mt-4 text-4xl sm:text-5xl xl:text-[64px] xl:leading-[1.05] font-extrabold leading-tight text-white">
            Analyze every{" "}
            <span className="relative text-[#2ce695]">
              video
              <span aria-hidden className="absolute left-0 right-0 -bottom-1 h-[10px] rounded-full bg-[#2ce695]/25 blur-[2px]" />
            </span>.{" "}
            Grow every{" "}
            <span className="relative text-[#2ce695]">
              post
              <span aria-hidden className="absolute left-0 right-0 -bottom-1 h-[10px] rounded-full bg-[#2ce695]/25 blur-[2px]" />
            </span>.
          </h1>

          <p className="mt-5 text-lg text-white/75 max-w-xl">
            Zlyzer turns TikTok profiles & videos into actionable insights:
            emotions, engagement, hashtags, audio, and performance — all in one
            dashboard powered by AI.
          </p>

          {/* CTA Switcher */}
          <div className="mt-6 w-full max-w-xl">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
              <button
                onClick={() => setMode("analyze")}
                className={`px-3 py-2 rounded-lg transition ${
                  mode === "analyze"
                    ? "bg-[#2ce695] text-[#0b1b14]"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                Analyze URL
              </button>
              <button
                onClick={() => setMode("demo")}
                className={`px-3 py-2 rounded-lg transition ${
                  mode === "demo"
                    ? "bg-[#2ce695] text-[#0b1b14]"
                    : "text-white/80 hover:bg-white/5"
                }`}
              >
                Book a demo
              </button>
            </div>

            {mode === "analyze" ? (
              <form className="mt-3 flex items-stretch gap-3" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="videoUrl" className="sr-only">
                  TikTok video or profile URL
                </label>
                <input
                  id="videoUrl"
                  type="url"
                  required
                  placeholder="Paste TikTok video or @username URL"
                  className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-3.5 text-white placeholder-white/40 outline-none focus:border-[#2ce695]/60"
                />
                <button
                  type="submit"
                  className="rounded-xl px-5 py-3.5 font-semibold text-[#0b1b14] bg-[#2ce695] hover:brightness-110 active:scale-[.99] transition"
                >
                  Analyze
                </button>
              </form>
            ) : (
              <form className="mt-3 flex items-stretch gap-3" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="email" className="sr-only">
                  Work email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Enter work email"
                  className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-3.5 text-white placeholder-white/40 outline-none focus:border-[#2ce695]/60"
                />
                <button
                  type="submit"
                  className="rounded-xl px-5 py-3.5 font-semibold text-[#0b1b14] bg-[#2ce695] hover:brightness-110 active:scale-[.99] transition"
                >
                  Request demo
                </button>
              </form>
            )}
          </div>

          {/* Quick bullets */}
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl text-sm text-white/80">
            {["Emotion & sentiment", "Engagement & retention", "Hashtags & trends"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[#2ce695]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT: Bigger, blended illustration */}
        <div className="lg:col-span-7 xl:col-span-7 relative">
          <div className="relative mx-auto w-full max-w-[800px]">
            {/* Ambient neon glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-24 blur-3xl opacity-60"
              style={{
                background:
                  "radial-gradient(70% 80% at 70% 40%, rgba(44,230,149,.45), transparent 70%)",
              }}
            />
            {/* Fade edges with gradient mask */}
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-3xl">
               <img
                 src="/Her.png"
                 alt="Futuristic Zlyzer dashboard illustration"
                 className="w-full h-full object-cover border-amber-50"
               />
              {/* subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-l from-[#132e53]/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}