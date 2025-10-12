// components/AnalysisFlow.tsx
import React from "react";
import clsx from "clsx";

const Accent = "#2ce695";     // brand green
const Dark  = "#132e53";      // primary bg
const Dark2 = "#191e29";      // alt bg

export default function AnalysisFlow({
  className,
}: { className?: string }) {
  return (
    <section
      className={clsx(
        "relative w-full min-h-screen overflow-hidden",
        "flex items-center justify-center",
        "px-6 md:px-10 lg:px-16",
        className
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(19,46,83,.92), rgba(25,30,41,.96))",
      }}
    >
      {/* diagonal conduit */}
      <Ribbon />

      <div className="relative z-10 grid w-full max-w-7xl gap-8 lg:gap-12 items-start
                      grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr_minmax(240px,300px)]">
        {/* Left: Video Analysis */}
        <VideoAnalysisCard />

        {/* Middle: Narrative + Profile Processing */}
        <div className="space-y-6">
          <p className="text-white/85 text-lg md:text-xl leading-relaxed">
            We analyze <span className="text-white font-semibold">every single detail</span> of your video — hooks,
            transcript, audio, and more — then stream that intelligence into your
            profile to optimize growth.
          </p>

          <ProfileProcessing />
          <div className="text-sm text-white/60">
            Results are presented in a shareable dashboard with an{" "}
            <span className="text-white/90">exportable report</span>.
          </div>
        </div>

        {/* Right: Identity Dashboard */}
        <IdentityDashboard />
      </div>
    </section>
  );
}

/* -------------------- Subcomponents -------------------- */

function VideoAnalysisCard() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md p-4 sm:p-5
                 shadow-[0_12px_40px_rgba(0,0,0,.35)]"
    >
      <div className="mb-2 text-sm font-medium tracking-wide text-white/70">
        Video analysis
      </div>

      <PanelLine label="Hook" />
      <PanelLine label="Transcript…" />
      <div className="relative my-3 h-32 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center">
        {/* play icon */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill={Accent}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <PanelLine label="Audio" />
      <PanelLine label="Summary…" />
    </div>
  );
}

function PanelLine({ label }: { label: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <span className="text-white/80 text-sm">{label}</span>
        <span className="h-1 w-24 rounded bg-white/10" />
      </div>
      <div className="mt-2 h-[6px] rounded bg-white/[.08]" />
    </div>
  );
}

function ProfileProcessing() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md p-4 sm:p-5">
      <div className="text-base font-medium text-white/80 mb-2">
        Profile analysis
      </div>
      <div className="text-xs text-white/60 mb-3">Processing</div>
      <div className="h-3 rounded-full bg-white/[.08] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: "76%",
            background:
              "linear-gradient(90deg, rgba(44,230,149,1) 0%, rgba(44,230,149,.35) 100%)",
            boxShadow: "0 0 12px rgba(44,230,149,.45)",
          }}
        />
      </div>
    </div>
  );
}

function IdentityDashboard() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md p-4 sm:p-5
                 shadow-[0_12px_40px_rgba(0,0,0,.35)]"
    >
      <div className="mb-2 text-sm font-medium tracking-wide text-white/70">
        Identity
      </div>
      <div className="mb-4 text-lg font-semibold text-white">Dashboard</div>

      {/* simple cards */}
      <div className="space-y-3">
        <DashRow label="Audience match" value="92%" />
        <DashRow label="Style consistency" value="87%" />
        <DashRow label="Brand keywords" value="12" />
        <DashRow label="Retention risk" value="Low" tone="good" />
      </div>

      <div className="mt-4 h-28 rounded-xl border border-white/10 bg-black/20 flex items-center justify-center">
        <span className="text-white/60 text-sm">Identity preview</span>
      </div>
    </div>
  );
}

function DashRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  const color =
    tone === "good" ? Accent : tone === "warn" ? "#ffb020" : "white";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/75">{label}</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/* -------------------- Ribbon (Analyze / Optimize / Grow) -------------------- */

function Ribbon() {
  return (
    <svg
      className="absolute inset-0 w-[160%] h-[160%] -z-10"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      style={{
        transform: "rotate(-18deg) translateX(-10%) translateY(-6%)",
        transformOrigin: "50% 50%",
        opacity: 0.95,
      }}
      aria-hidden
    >
      <defs>
        <linearGradient id="z-ribbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={Accent} />
          <stop offset="100%" stopColor="#42d0e8" />
        </linearGradient>
        <style>{`
          .r-stroke{ stroke:url(#z-ribbon); fill:none; stroke-linecap:round; stroke-linejoin:round; }
        `}</style>
      </defs>

      {/* main conduits */}
      <path d="M-120 820 L 980 300" className="r-stroke" strokeWidth={40} />
      <path d="M-80 880 L 1020 360" className="r-stroke" strokeWidth={40} opacity={0.9} />
      <path d="M-40 940 L 1060 420" className="r-stroke" strokeWidth={40} opacity={0.85} />

      {/* small inner white track */}
      <path d="M-80 880 L 1020 360" stroke="white" strokeOpacity=".22" strokeWidth="14" fill="none" />

      {/* arrow knot */}
      <g transform="translate(1040,340) rotate(6)">
        <path d="M0 0 L70 -40 L180 -15 L110 25 Z" fill="url(#z-ribbon)" />
        <path d="M110 25 L180 -15 L250 10 L180 50 Z" fill="url(#z-ribbon)" />
      </g>

      {/* labels along the path */}
      <text x="420" y="520" transform="rotate(-15 420 520)" fill="#0f172a" fontSize="40" fontWeight={700}>
        Analyze
      </text>
      <text x="640" y="450" transform="rotate(-15 640 450)" fill="#0f172a" fontSize="36" fontWeight={700}>
        Optimize
      </text>
      <text x="880" y="380" transform="rotate(-15 880 380)" fill="#0f172a" fontSize="40" fontWeight={800}>
        Grow
      </text>
    </svg>
  );
}
