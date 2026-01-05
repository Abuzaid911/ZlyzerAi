// components/navbar/MobileNav.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { User } from '@supabase/supabase-js';

interface NavLink {
  label: string;
  href: string;
}

interface MobileNavProps {
  isOpen: boolean;
  user: User | null;
  navLinks: NavLink[];
  onClose: () => void;
  onAnchorClick: (href: string) => (e: React.MouseEvent) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

/**
 * Mobile navigation drawer with nav links and auth actions
 */
export function MobileNav({
  isOpen,
  user,
  navLinks,
  onClose,
  onAnchorClick,
  onSignIn,
  onSignOut,
}: MobileNavProps) {
  return (
    <div
      id="mobile-nav"
      className={clsx(
        'md:hidden overflow-hidden transition-[max-height,opacity] duration-300',
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
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
                    '/default-avatar.png'
                  }
                  alt={user.user_metadata?.full_name || user.email || 'User'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#2ce695]/30"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-white/60 truncate">{user.email}</p>
                </div>
              </div>
            </li>
          )}

          {navLinks.map((link) => (
            <li key={link.label}>
              {link.href.startsWith('#') ? (
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
                  onClick={onClose}
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
                  onClick={onClose}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition"
                >
                  Dashboard
                </Link>
              </li>
              <li className="mt-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
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
                onClick={onSignIn}
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
  );
}

