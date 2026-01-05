// components/Navbar.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { supabase } from '../lib/supabaseClient';
import { useAuthBootstrap } from '../hooks/useAuthBootstrap';
import { useAuthSession } from '../hooks/useAuthSession';
import { useDropdown } from '../hooks/useDropdown';
import { useToast } from './Toast';
import { buildRedirectPath, clearPostAuthRedirect, savePostAuthRedirect } from '../utils/authRedirect';
import { UserDropdown } from './navbar/UserDropdown';
import { MobileNav } from './navbar/MobileNav';

const NAV_LINKS = [
  { label: 'Overview', href: '#hero' },
  { label: 'How it works', href: '#step-flow' },
  { label: 'FAQ', href: '#faq' },
];

// Helper: get hash ('' if none)
const getHash = (path: string) => (path.includes('#') ? path.slice(path.indexOf('#')) : '');

export default function Navbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    []
  );

  const location = useLocation();
  const desktopDropdown = useDropdown();
  const mobileDropdown = useDropdown();
  const desktopDropdownMenuId = useId();
  const mobileDropdownMenuId = useId();
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
    if (isSignedIn && hash && hash.includes('access_token')) {
      const urlWithoutHash = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', urlWithoutHash);
    }
  }, [isSignedIn]);

  // Close mobile drawer & dropdown on route change
  // Note: We use refs to the close functions to avoid re-running this effect on every render
  const desktopCloseRef = useRef(desktopDropdown.close);
  const mobileCloseRef = useRef(mobileDropdown.close);
  desktopCloseRef.current = desktopDropdown.close;
  mobileCloseRef.current = mobileDropdown.close;

  useEffect(() => {
    setMobileNavOpen(false);
    desktopCloseRef.current();
    mobileCloseRef.current();
  }, [location.pathname, location.search, location.hash]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sign in with Google using PKCE flow
  const handleSignIn = async () => {
    try {
      savePostAuthRedirect(buildRedirectPath(location));
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/video-analysis`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  // Sign out with reliable cleanup
  const handleSignOut = async () => {
    try {
      desktopDropdown.close();
      mobileDropdown.close();
      setMobileNavOpen(false);
      localStorage.clear();
      console.log('🔓 Signing out...');

      // Clear all session-related storage BEFORE sign out
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('signed_up_') || key.startsWith('auth_')) {
          sessionStorage.removeItem(key);
        }
      });
      clearPostAuthRedirect();
      // Clear any analysis history from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('zlyzer-')) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      await supabase.auth.getSession();
      console.log('✅ Signed out successfully');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.href = '/';
    }
  };

  // Smooth scroll for in-page anchors with offset & reduced-motion
  const onAnchorClick = useCallback(
    (href: string) => (e: React.MouseEvent) => {
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const headerOffset = 88;
        const { top } = el.getBoundingClientRect();
        const y = top + window.scrollY - headerOffset;
        if (reduceMotion) window.scrollTo(0, y);
        else window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setMobileNavOpen(false);
    },
    [reduceMotion]
  );

  // If page loads with a hash, auto-offset scroll once content paints
  useEffect(() => {
    const hash = getHash(window.location.href);
    if (hash && !hash.includes('access_token') && !hash.includes('=')) {
      try {
        const el = document.querySelector(hash) as HTMLElement | null;
        if (el) {
          requestAnimationFrame(() => {
            const headerOffset = 80;
            const { top } = el.getBoundingClientRect();
            window.scrollTo({ top: top + window.scrollY - headerOffset, behavior: 'auto' });
          });
        }
      } catch {
        console.debug('Invalid hash selector:', hash);
      }
    }
  }, []);

  // Active link computation
  const activeHash = location.hash || '';
  const activePath = location.pathname;

  // Avatar onError fallback
  const [avatarError, setAvatarError] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Desktop bar */}
        <nav
          aria-label="Primary"
          className={clsx(
            'mt-4 flex items-center justify-between rounded-4xl px-4 sm:px-6 py-2',
            'backdrop-blur-md border border-white/10 h-17',
            scrolled && 'ring-1 ring-black/10 shadow-[0_8px_24px_rgba(44,230,149,0.15)]'
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
              const isAnchor = link.href.startsWith('#');
              const isActive = (isAnchor && activeHash === link.href) || (!isAnchor && activePath === link.href);
              const base =
                'text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded relative transition-colors';
              const underline =
                'after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#2ce695] after:transition-all after:duration-300';
              const activeUnderline = 'after:w-full';
              const color = isActive ? 'text-white' : 'text-white/80 hover:text-white';
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
            {!authReady && <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />}

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

            {/* Mobile CTA (visible on phones) */}
            {authReady && !user && (
              <Link
                to="/video-analysis"
                className="md:hidden inline-flex items-center justify-center rounded-full bg-[#2ce695] px-3.5 py-2 text-xs font-semibold text-[#0b1b14] shadow-[0_6px_18px_rgba(44,230,149,0.35)] transition hover:brightness-110"
              >
                Start analyzing
              </Link>
            )}

            {/* Mobile: avatar replaces hamburger when signed in */}
            {authReady && user ? (
              <div className="sm:hidden relative" ref={mobileDropdown.containerRef}>
                <button
                  type="button"
                  ref={mobileDropdown.triggerRef}
                  onClick={() => {
                    mobileDropdown.toggle();
                    desktopDropdown.close();
                    setMobileNavOpen(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={mobileDropdown.open}
                  aria-controls={mobileDropdownMenuId}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60"
                >
                  <img
                    src={
                      !avatarError
                        ? user.user_metadata?.avatar_url || user.user_metadata?.picture || '/default-avatar.png'
                        : '/default-avatar.png'
                    }
                    onError={() => setAvatarError(true)}
                    alt={user.user_metadata?.full_name || user.email || 'User'}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>

                {mobileDropdown.open && (
                  <UserDropdown
                    user={user}
                    menuId={mobileDropdownMenuId}
                    onClose={() => {
                      mobileDropdown.close();
                      setMobileNavOpen(false);
                    }}
                    onSignOut={handleSignOut}
                    registerItem={mobileDropdown.registerItem}
                    variant="mobile"
                  />
                )}
              </div>
            ) : (
              /* Mobile: hamburger for logged-out users */
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="
                  md:hidden inline-flex h-9 w-9 items-center justify-center
                  rounded-lg border border-white/15 text-white/90
                  hover:bg-white/5 transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                "
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                aria-label="Toggle menu"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
                  {mobileNavOpen ? (
                    <path d="M6 6l12 12M18 6L6 18" />
                  ) : (
                    <>
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </>
                  )}
                </svg>
              </button>
            )}

            {/* Desktop user dropdown */}
            {authReady && user && (
              <div className="hidden sm:block relative" ref={desktopDropdown.containerRef}>
                <button
                  type="button"
                  ref={desktopDropdown.triggerRef}
                  onClick={() => {
                    desktopDropdown.toggle();
                    mobileDropdown.close();
                  }}
                  aria-haspopup="menu"
                  aria-expanded={desktopDropdown.open}
                  aria-controls={desktopDropdownMenuId}
                  className="
                    flex items-center gap-2 rounded-full border border-white/20
                    px-2 py-2 hover:border-white/40 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ce695]/60
                  "
                >
                  <img
                    src={
                      !avatarError
                        ? user.user_metadata?.avatar_url || user.user_metadata?.picture || '/default-avatar.png'
                        : '/default-avatar.png'
                    }
                    onError={() => setAvatarError(true)}
                    alt={user.user_metadata?.full_name || user.email || 'User'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#2ce695]/30"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm font-medium text-white/90 pr-2 max-w-[120px] truncate">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                  <svg
                    className={clsx('w-4 h-4 text-white/60 transition-transform', desktopDropdown.open && 'rotate-180')}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu (desktop) */}
                {desktopDropdown.open && (
                  <UserDropdown
                    user={user}
                    menuId={desktopDropdownMenuId}
                    onClose={() => {
                      desktopDropdown.close();
                      mobileDropdown.close();
                    }}
                    onSignOut={handleSignOut}
                    registerItem={desktopDropdown.registerItem}
                    variant="desktop"
                  />
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        user={user}
        navLinks={NAV_LINKS}
        onClose={() => setMobileNavOpen(false)}
        onAnchorClick={onAnchorClick}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
