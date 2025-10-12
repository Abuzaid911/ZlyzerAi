// components/TikTokAnalyzeSection.tsx
import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";

const isTikTokUrl = (value: string) => {
  // accepts https://www.tiktok.com/... or tiktok:// and profile/video formats
  const re =
    /^(https?:\/\/)?(www\.)?tiktok\.com\/(@[A-Za-z0-9._-]+|.+\/video\/\d+)(\/|\?.*)?$/i;
  return re.test(value.trim());
};

const DEFAULT_GLOW_COLOR = '44, 230, 149'; // #2ce695

export default function TikTokAnalyzeSection() {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const isHoveredRef = useRef(false);

  // Particle animation functions
  const createParticle = (x: number, y: number) => {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(${DEFAULT_GLOW_COLOR}, 1);
      box-shadow: 0 0 6px rgba(${DEFAULT_GLOW_COLOR}, 0.6);
      pointer-events: none;
      z-index: 100;
      left: ${x}px;
      top: ${y}px;
    `;
    return particle;
  };

  const animateParticles = () => {
    if (!sectionRef.current || !isHoveredRef.current) return;

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        if (!isHoveredRef.current || !sectionRef.current) return;

        const rect = sectionRef.current.getBoundingClientRect();
        const particle = createParticle(
          Math.random() * rect.width,
          Math.random() * rect.height
        );
        
        sectionRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(particle, 
          { scale: 0, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(particle, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, i * 100);
    }
  };

  const clearParticles = () => {
    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  };

  // Mouse interaction effects
  useEffect(() => {
    if (!sectionRef.current) return;

    const element = sectionRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
      
      gsap.to(element, {
        y: -5,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearParticles();
      
      gsap.to(element, {
        y: 0,
        x: 0,
        rotateX: 0,
        rotateY: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      const magnetX = (x - centerX) * 0.02;
      const magnetY = (y - centerY) * 0.02;

      gsap.to(element, {
        rotateX,
        rotateY,
        x: magnetX,
        y: magnetY - 5,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: 1000
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      clearParticles();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!isTikTokUrl(url)) {
      setErr("Please paste a valid TikTok video or profile URL.");
      return;
    }

    try {
      setLoading(true);
      
      // Simulate analysis for demo purposes
      // In a real app, you would call your backend API here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful analysis result
      setResult({
        success: true,
        message: "Analysis complete! TikTok URL processed successfully.",
        url: url,
        insights: {
          engagement: "High engagement detected",
          sentiment: "Positive sentiment analysis",
          hashtags: ["#viral", "#trending", "#creative"]
        }
      });
      
      setUrl(""); // Clear the input
    } catch (e: any) {
      setErr(e.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          .tiktok-section {
            --glow-x: 50%;
            --glow-y: 50%;
            --glow-intensity: 0;
            --glow-radius: 200px;
            --glow-color: ${DEFAULT_GLOW_COLOR};
            --background-dark: #191e29;
            --background-dark-alt: #132e53;
            --border-color: rgba(44, 230, 149, 0.25);
            --shadow-deep: 0 8px 25px rgba(0, 0, 0, 0.25), 0 0 30px rgba(19, 46, 83, 0.25);
          }

          .tiktok-section::after {
            content: '';
            position: absolute;
            inset: 0;
            padding: 2px;
            background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
              rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
              rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 30%,
              transparent 60%);
            border-radius: inherit;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: subtract;
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 1;
          }

          .tiktok-section:hover::after {
            opacity: 1;
          }

          .tiktok-section:hover {
            box-shadow: 
              0 4px 20px rgba(19, 46, 83, 0.35),
              0 0 30px rgba(var(--glow-color), 0.22);
          }

          .particle::before {
            content: '';
            position: absolute;
            top: -2px; left: -2px; right: -2px; bottom: -2px;
            background: rgba(var(--glow-color), 0.2);
            border-radius: 50%;
            z-index: -1;
          }

          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          .results-card {
            background: linear-gradient(135deg, 
              rgba(44, 230, 149, 0.1) 0%, 
              rgba(25, 30, 41, 0.8) 50%, 
              rgba(19, 46, 83, 0.6) 100%);
            border: 1px solid rgba(44, 230, 149, 0.3);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(44, 230, 149, 0.1);
          }
        `}
      </style>

      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Enhanced ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-16 blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(70% 80% at 60% 40%, rgba(44,230,149,.35), transparent 70%)",
          }}
        />

        <div 
          ref={sectionRef}
          className="tiktok-section relative overflow-hidden rounded-[20px] border border-solid backdrop-blur-md p-6 sm:p-8 transition-all duration-300 ease-in-out"
          style={{
            backgroundColor: 'var(--background-dark)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-deep)',
            '--glow-x': '50%',
            '--glow-y': '50%',
            '--glow-intensity': '0',
            '--glow-radius': '200px'
          } as React.CSSProperties}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 mb-3">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2ce695]" />
                TikTok Analysis Engine
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Analyze TikTok Content
              </h2>
              <p className="text-white/70 text-sm max-w-2xl">
                Paste any TikTok video or profile URL. Our AI will extract emotions, engagement patterns, 
                hashtag performance, audio insights, and comprehensive analytics.
              </p>
            </div>
          </div>

          <form 
            ref={formRef}
            onSubmit={onSubmit} 
            className="flex flex-col sm:flex-row gap-3 relative z-10"
          >
            <label htmlFor="tiktok-url" className="sr-only">
              TikTok URL
            </label>
            <input
              id="tiktok-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@creator/video/1234567890"
              className="
                flex-1 rounded-xl bg-white/5 border border-white/15
                px-4 py-4 text-white placeholder-white/40 outline-none
                focus:border-[#2ce695]/60 focus:bg-white/10 transition-all
                backdrop-blur-sm
              "
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="
                inline-flex items-center justify-center rounded-xl
                px-6 py-4 font-semibold text-[#0b1b14]
                bg-[#2ce695] hover:brightness-110 hover:shadow-[0_0_20px_rgba(44,230,149,0.4)]
                active:scale-[.98] transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                relative overflow-hidden
              "
              onClick={(e) => {
                if (!loading) {
                  // Add click ripple effect
                  const button = e.currentTarget;
                  const rect = button.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  const ripple = document.createElement('div');
                  ripple.style.cssText = `
                    position: absolute;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    left: ${x - 50}px;
                    top: ${y - 50}px;
                    pointer-events: none;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                  `;
                  
                  button.appendChild(ripple);
                  setTimeout(() => ripple.remove(), 600);
                }
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing…
                </>
              ) : (
                "Analyze Now"
              )}
            </button>
          </form>

          {/* helper + error */}
          <div className="mt-4 flex flex-col gap-2 relative z-10">
            <p className="text-xs text-white/50">
              Example: <span className="text-white/70">https://www.tiktok.com/@brand/video/1234567890</span>
            </p>
            {err && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 backdrop-blur-sm">
                <p className="text-sm text-red-300/90 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {err}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Results display */}
          {result && (
            <div className="mt-6 p-6 rounded-xl results-card backdrop-blur-md relative overflow-hidden">
              {/* Success header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-[#2ce695]/20 flex items-center justify-center">
                  <svg className="h-4 w-4 text-[#2ce695]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Analysis Complete!</h3>
                  <p className="text-sm text-white/70">{result.message}</p>
                </div>
              </div>

              {/* Insights grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#2ce695]"></div>
                    <p className="text-xs text-white/60 font-medium">ENGAGEMENT</p>
                  </div>
                  <p className="text-sm text-white font-medium">{result.insights.engagement}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#2ce695]"></div>
                    <p className="text-xs text-white/60 font-medium">SENTIMENT</p>
                  </div>
                  <p className="text-sm text-white font-medium">{result.insights.sentiment}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#2ce695]"></div>
                    <p className="text-xs text-white/60 font-medium">HASHTAGS</p>
                  </div>
                  <p className="text-sm text-white font-medium">{result.insights.hashtags.join(", ")}</p>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => setResult(null)}
                className="w-full p-3 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
              >
                Analyze Another URL
              </button>

              {/* Decorative particles */}
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#2ce695] opacity-60 animate-pulse"></div>
              <div className="absolute bottom-4 left-4 h-1 w-1 rounded-full bg-[#2ce695] opacity-40 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}