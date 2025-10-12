// components/Footer.tsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-40 mt-24 border-t border-white/10 bg-[#132e53]/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
            <Link to="/" className="flex items-center">
              <img src="/logo.svg" alt="Zlyzer" className="w-16 h-12" />
            </Link>
            <p className="text-xs text-white/50 text-center sm:text-left">
              © {new Date().getFullYear()} Zlyzer. All rights reserved.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-5">
            {/* LinkedIn */}
            <a
              href="https://linkedin.com/company/zlyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#2ce695] transition-colors"
              aria-label="LinkedIn"
            >
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>

            {/* Gmail */}
            <a
              href="mailto:zlyzerai@gmail.com?subject=Zlyzer%20—%20Contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-[#2ce695] transition-colors"
              aria-label="Email Zlyzer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M12 13.065L2 6.5V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.5l-10 6.565z" />
                <path d="M22 5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v.217l10 6.565 10-6.565V5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Subtle accent line */}
      <div
        className="h-[1px] w-full opacity-30"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #2ce695 50%, transparent 100%)",
        }}
      />
    </footer>
  );
}
