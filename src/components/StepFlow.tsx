// components/StepFlow.tsx
import * as React from "react";
import clsx from "clsx";

type Step = {
  step: number;
  eyebrow?: string;
  title: string;
  copy: string;
  img?: string;           // path to sketch/illustration (optional)
  lottie?: string;        // Lottie animation URL (optional)
  alt: string;
};

const STEPS: Step[] = [
  {
    step: 1,
    eyebrow: "STEP 1",
    title: "We analyze every signal in your video.",
    copy:
      "Hooks, transcript, audio, sentiment, and retention. We transform raw content into structured insights.",
    lottie: "https://lottie.host/c602c9b0-95aa-46da-9ff5-83256f947e30/LxAUUHGn2j.lottie",
    alt: "Video analysis module animation",
  },
  {
    step: 2,
    eyebrow: "STEP 2",
    title: "We enrich the profile with AI.",
    copy:
      "We map findings to your identity and audience to recommend positioning, hashtags, and timing.",
    lottie: "https://lottie.host/68fb6df9-5742-4a29-a610-b04cb1c3df19/eWeQAPNGVL.lottie",
    alt: "Profile enrichment animation",
  },
  {
    step: 3,
    eyebrow: "STEP 3",
    title: "We deliver an exportable report & dashboard.",
    copy:
      "Share, export, or plug into your workflow. Keep the conveyor running as you iterate and grow.",
    lottie: "https://lottie.host/0cc39fd4-baca-47c6-bfdc-d30d416c6ca2/oYfwSJmyDb.lottie",
    alt: "Delivery & export animation",
  },
];

export default function StepFlow({
  className,
}: {
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "relative w-full overflow-hidden",
        "py-16 md:py-24",
        className
      )}
    >
      {/* diagonal pipeline in the back */}
      <PipelineBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            How Zlyzer moves your data from{" "}
            <span className="text-[#2ce695]">Analyze</span> to{" "}
            <span className="text-[#2ce695]">Grow</span>.
          </h2>
        </header>

        <ol className="space-y-10 md:space-y-16">
          {STEPS.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <li
                key={s.step}
                className={clsx(
                  "grid items-center gap-6 md:gap-10",
                  "md:grid-cols-2"
                )}
              >
                {/* Image/Animation frame */}
                <div
                  className={clsx(
                    "relative",
                    reverse ? "md:order-2" : "md:order-1"
                  )}
                >
                  <SketchFrame img={s.img} lottie={s.lottie} alt={s.alt} />
                </div>

                {/* Text card */}
                <div
                  className={clsx(
                    "md:max-w-[520px]",
                    reverse ? "md:order-1" : "md:order-2"
                  )}
                >
                  <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-[11px] font-semibold tracking-wider text-white/80">
                    {s.eyebrow ?? `STEP ${s.step}`}
                  </div>
                  <h3 className="mt-3 text-2xl md:text-3xl font-bold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-white/75 leading-relaxed">{s.copy}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* --------------------- Sketch frame --------------------- */

function SketchFrame({
  img,
  lottie,
  alt,
}: {
  img?: string;
  lottie?: string;
  alt: string;
}) {
  return (
    <figure className="group relative">
      <div className="rounded-xl border border-[#2ce695] bg-black/20 overflow-hidden flex items-center justify-center min-h-[300px]">
        {lottie ? (
          // Lottie animation using React.createElement to avoid TS errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          React.createElement('dotlottie-wc' as any, {
            src: lottie,
            autoplay: true,
            loop: true,
            style: { width: '300px', height: '300px' }
          })
        ) : img ? (
          // Static image fallback
          <img
            src={img}
            alt={alt}
            className="block w-full h-full object-cover"
          />
        ) : (
          // Placeholder if neither is provided
          <div className="text-white/40 text-sm">No media</div>
        )}
      </div>
    </figure>
  );
}

/* --------------------- Pipeline background --------------------- */

function PipelineBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 w-full h-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id="pipe" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2ce695" />
          <stop offset="100%" stopColor="#42d0e8" />
        </linearGradient>
      </defs>

      {/* soft lines that cut across the layout diagonally */}
      <g opacity=".18" stroke="url(#pipe)" strokeWidth="20" fill="none">
        <path d="M-200 700 L 900 180 L 1800 -80" />
        <path d="M-200 760 L 940 240 L 1800 -20" opacity=".9" />
        <path d="M-200 820 L 980 300 L 1800 40" opacity=".8" />
      </g>

      {/* subtle inner highlight track */}
      <g opacity=".12" stroke="#ffffff" strokeWidth="6" fill="none">
        <path d="M-200 760 L 940 240 L 1800 -20" />
      </g>
    </svg>
  );
}
