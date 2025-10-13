// components/Navbar.tsx
import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { supabase } from "../lib/supabaseClient";
import { useAuthBootstrap } from "../hooks/useAuthBootstrap";
import { useAuthSession } from "../hooks/useAuthSession";
import { useToast } from "./Toast";
import { buildRedirectPath, clearPostAuthRedirect, savePostAuthRedirect } from "../utils/authRedirect";

const NAV_LINKS = [
  { label: "Overview", href: "#hero" },
  { label: "How it works", href: "#step-flow" },
  { label: "FAQ", href: "#faq" },
];

// ✱ helper: get hash ('' if none)
const getHash = (path: string) => (path.includes("#") ? path.slice(path.indexOf("#")) : "");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(0); // ✱ keyboard nav
  const reduceMotion = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    []
  );

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownItemsRef = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]); // ✱
  const location = useLocation();
  const dropdownMenuId = useId(); // ✱ a11y
  const toast = useToast();
  const bootstrapErrorRef = useRef<string | null>(null);

  // Use the new auth session hook - single source of truth
  const { user, isSignedIn, authReady } = useAuthSession();

  // Auto-signup after login
  const { error: bootstrapError } = useAuthBootstrap();

  useEffect(() => {
    if (bootstrapError) {
      if (bootstrapErrorRef.current !== bootstrapError) {
        bootstrapErrorRef.current = bootstrapError;
        toast.error('We could not register you with the backend. Some features may be unavailable right now.');
      }
    } else {
      bootstrapErrorRef.current = null;
    }
  }, [bootstrapError, toast]);

  // Clean up OAuth hash after authentication
  useEffect(() => {
    const hash = window.location.hash;
    // If user is authenticated and there's an OAuth hash, clean it up
    if (isSignedIn && hash && hash.includes('access_token')) {
      // Remove the hash from the URL without triggering a page reload
      const urlWithoutHash = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', urlWithoutHash);
    }
  }, [isSignedIn]);

  // Close mobile drawer & dropdown on route change
  useEffect(() => {
    setOpen(false);
    setShowDropdown(false);
  }, [location.pathname, location.search, location.hash]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✱ Click outside & Esc for dropdown (pointerdown supports touch)
  useEffect(() => {
    if (!showDropdown) return;
    const onClick = (e: PointerEvent) => {
      const t = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(t) &&
        dropdownBtnRef.current &&
        !dropdownBtnRef.current.contains(t)
      ) {
        setShowDropdown(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
      // ✱ cycle with Arrow keys
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        if (!dropdownItemsRef.current.length) return;
        if (e.key === "Home") setDropdownIndex(0);
        else if (e.key === "End") setDropdownIndex(dropdownItemsRef.current.length - 1);
        else if (e.key === "ArrowDown") setDropdownIndex((i) => Math.min(i + 1, dropdownItemsRef.current.length - 1));
        else if (e.key === "ArrowUp") setDropdownIndex((i) => Math.max(i - 1, 0));
      }
    };
    document.addEventListener("pointerdown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showDropdown]);

  // ✱ Move focus as dropdownIndex changes
  useEffect(() => {
    if (!showDropdown) return;
    const el = dropdownItemsRef.current[dropdownIndex];
    el?.focus();
  }, [dropdownIndex, showDropdown]);

  // Sign in with Google using PKCE flow
  const handleSignIn = async () => {
    try {
      // Store the current path for redirect after auth
      savePostAuthRedirect(buildRedirectPath(location));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          // Always use explicit callback URL, never window.location.href
          redirectTo: `${window.location.origin}/auth/callback`,
          // Request PKCE flow for better security
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  // Sign out with reliable cleanup
  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      
      console.log('🔓 Signing out...');
      
      // Clear all session-related storage BEFORE sign out
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.startsWith("signed_up_") || 
          key.startsWith("auth_")
        ) {
          sessionStorage.removeItem(key);
        }
      });
      clearPostAuthRedirect();
      
      // Clear any analysis history from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("zlyzer-")) {
          localStorage.removeItem(key);
        }
      });
      
      // Sign out from Supabase (this triggers onAuthStateChange)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
        throw error;
      }
      
      // Force immediate session recheck to ensure UI updates
      await supabase.auth.getSession();
      
      console.log('✅ Signed out successfully');
      
      // Optional: redirect to home page after sign out
      // This ensures clean state even if listeners don't fire
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Force a hard refresh to clear any stale state
      window.location.href = '/';
    }
  };

  // ✱ Smooth scroll for in-page anchors with offset & reduced-motion
  const onAnchorClick = (href: string) => (e: React.MouseEvent) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 88; // ~ h-14 + margins
      const { top } = el.getBoundingClientRect();
      const y = top + window.scrollY - headerOffset;
      if (reduceMotion) window.scrollTo(0, y);
      else window.scrollTo({ top: y, behavior: "smooth" });
    }
    setOpen(false);
  };

  // ✱ If page loads with a hash, auto-offset scroll once content paints
  useEffect(() => {
    const hash = getHash(window.location.href);
    // Ignore OAuth callback hashes (access_token, refresh_token, etc.)
    if (hash && !hash.includes("access_token") && !hash.includes("=")) {
      try {
        const el = document.querySelector(hash) as HTMLElement | null;
        if (el) {
          requestAnimationFrame(() => {
            const headerOffset = 80;
            const { top } = el.getBoundingClientRect();
            window.scrollTo({ top: top + window.scrollY - headerOffset, behavior: "auto" });
          });
        }
      } catch {
        // Invalid selector, ignore
        console.debug("Invalid hash selector:", hash);
      }
    }
  }, []);

  // ✱ Active link computation
  const activeHash = location.hash || "";
  const activePath = location.pathname;

  // ✱ avatar onError fallback
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Desktop bar */}
        <nav
          aria-label="Primary"
          className={clsx(
            "mt-4 flex items-center justify-between rounded-4xl px-4 sm:px-6 py-2",
            "backdrop-blur-md border border-white/10 h-17",
            scrolled && "ring-1 ring-black/10 shadow-[0_8px_24px_rgba(44,230,149,0.15)]"
          )}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group relative" aria-label="Zlyzer home">
            <img
              src="/logo.svg"
              alt="Zlyzer"
              className="w-20 h-16 absolute top-1/2 left-0 -translate-y-1/2"
              loading="eager"
              decoding="async"
            />
            <div className="w-20 h-0" />
          </Link>

          {/* Links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isAnchor = link.href.startsWith("#");
              const isActive =
                (isAnchor && activeHash === link.href) || (!isAnchor && activePath === link.href);
              const base =
                "text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded relative transition-colors";
              const underline =
                "after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#2ce695] after:transition-all after:duration-300";
              const activeUnderline = "after:w-full";
              const color = isActive ? "text-white" : "text-white/80 hover:text-white";
              if (isAnchor) {
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={onAnchorClick(link.href)}
                      className={clsx(base, underline, color, isActive && activeUnderline)}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={link.label}>
                  <Link to={link.href} className={clsx(base, underline, color, isActive && activeUnderline)}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* CTA + User Profile + Mobile controls */}
          <div className="flex items-center gap-3">
            {/* Don't show auth-dependent UI until ready */}
            {!authReady && (
              <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
            )}
            
            {/* Desktop Sign In */}
            {authReady && !user && (
              <button
                type="button"
                onClick={handleSignIn}
                className="
                  hidden sm:inline-flex items-center justify-center
                  rounded-full border border-white/20
                  px-4 py-2 text-sm font-semibold
                  text-white/90 hover:text-white hover:border-white/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                  transition-colors
                "
              >
                Sign In
              </button>
            )}

            {/* Desktop CTA */}
            {authReady && !user && (
              <Link
                to="/video-analysis"
                className="hidden md:inline-flex items-center justify-center rounded-full bg-[#2ce695] px-4 py-2 text-sm font-semibold text-[#0b1b14] shadow-[0_8px_24px_rgba(44,230,149,0.35)] transition hover:brightness-110"
              >
                Start analyzing
              </Link>
            )}

            {/* ✅ Mobile CTA (visible on phones) */}
            {authReady && !user && (
              <Link
                to="/video-analysis"
                className="md:hidden inline-flex items-center justify-center rounded-full bg-[#2ce695] px-3.5 py-2 text-xs font-semibold text-[#0b1b14] shadow-[0_6px_18px_rgba(44,230,149,0.35)] transition hover:brightness-110"
              >
                Start analyzing
              </Link>
            )}

            {/* ✅ Mobile: avatar replaces hamburger when signed in */}
            {authReady && user ? (
              <div className="sm:hidden relative" ref={dropdownRef}>
                <button
                  type="button"
                  ref={dropdownBtnRef}
                  onClick={() => {
                    setShowDropdown((v) => !v);
                    setDropdownIndex(0);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                  aria-controls={`${dropdownMenuId}-mobile`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60"
                >
                  <img
                    src={
                      !avatarError
                        ? user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          "/default-avatar.png"
                        : "/default-avatar.png"
                    }
                    onError={() => setAvatarError(true)}
                    alt={user.user_metadata?.full_name || user.email || "User"}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {showDropdown && (
                  <div
                    id={`${dropdownMenuId}-mobile`}
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#132e53]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,.35)] z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-white/60 truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[0] = el; }}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition focus:outline-none"
                        onClick={() => setShowDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[1] = el; }}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition focus:outline-none"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
                    </div>
                    <div className="border-t border-white/10">
                      <button
                        type="button"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[2] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOut();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition focus:outline-none"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mobile: hamburger for logged-out users */
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="
                  md:hidden inline-flex h-9 w-9 items-center justify-center
                  rounded-lg border border-white/15 text-white/90
                  hover:bg-white/5 transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                "
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label="Toggle menu"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
                  {open ? <path d="M6 6l12 12M18 6L6 18" /> : (<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>)}
                </svg>
              </button>
            )}

            {/* Desktop user dropdown */}
            {authReady && user && (
              <div className="hidden sm:block relative" ref={dropdownRef}>
                <button
                  type="button"
                  ref={dropdownBtnRef}
                  onClick={() => {
                    setShowDropdown((v) => !v);
                    setDropdownIndex(0);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                  aria-controls={dropdownMenuId} // ✱
                  className="
                    flex items-center gap-2 rounded-full border border-white/20
                    px-2 py-2 hover:border-white/40 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                  "
                >
                  <img
                    src={
                      !avatarError
                        ? user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          "/default-avatar.png"
                        : "/default-avatar.png"
                    }
                    onError={() => setAvatarError(true)} // ✱
                    alt={user.user_metadata?.full_name || user.email || "User"}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#2ce695]/30"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm font-medium text-white/90 pr-2 max-w-[120px] truncate">
                    {user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0]}
                  </span>
                  <svg
                    className={clsx("w-4 h-4 text-white/60 transition-transform", showDropdown && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu (desktop) */}
                {showDropdown && (
                  <div
                    id={dropdownMenuId}
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#132e53]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,.35)] z-50 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-white/60 truncate">{user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[0] = el; }} // ✱ focus order
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition focus:outline-none"
                        onClick={() => setShowDropdown(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/settings"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[1] = el; }}
                        className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition focus:outline-none"
                        onClick={() => setShowDropdown(false)}
                      >
                        Settings
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-white/10">
                      <button
                        type="button"
                        role="menuitem"
                        ref={(el) => { dropdownItemsRef.current[2] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOut();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition focus:outline-none"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={clsx(
          "md:hidden overflow-hidden transition-[max-height,opacity] duration-300",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div
          className="
            mx-4 mt-2 rounded-2xl border border-white/10 backdrop-blur-md
            bg-[linear-gradient(90deg,#132e53cc_0%,#191e29cc_100%)]
            shadow-[0_8px_24px_rgba(0,0,0,.25)]
          "
        >
          <ul className="flex flex-col p-3">
            {/* User Info for Mobile (drawer) */}
            {user && (
              <li className="mb-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3 px-3 py-2">
                  <img
                    src={
                      user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture ||
                      "/default-avatar.png"
                    }
                    alt={user.user_metadata?.full_name || user.email || "User"}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#2ce695]/30"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-xs text-white/60 truncate">{user.email}</p>
                  </div>
                </div>
              </li>
            )}

            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("#") ? (
                  <a
                    href={link.href}
                    onClick={onAnchorClick(link.href)}
                    className="
                      block rounded-lg px-3 py-2
                      text-sm font-medium text-white/80
                      hover:bg-white/5 hover:text-white
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                      transition
                    "
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="
                      block rounded-lg px-3 py-2
                      text-sm font-medium text-white/80
                      hover:bg-white/5 hover:text-white
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                      transition
                    "
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}

            {user ? (
              <>
                <li className="mt-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
                  >
                    Settings
                  </Link>
                </li>
                <li className="mt-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                    className="
                      w-full text-left rounded-lg px-3 py-2
                      text-sm font-medium text-red-400
                      hover:bg-red-500/10
                      transition
                    "
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li className="mt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="
                    w-full text-center rounded-full
                    border border-white/20
                    px-4 py-2 text-sm font-semibold
                    text-white/90 hover:text-white hover:border-white/40
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                    transition
                  "
                >
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}
