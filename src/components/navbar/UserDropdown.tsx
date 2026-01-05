// components/navbar/UserDropdown.tsx
import { Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

interface UserDropdownProps {
  user: User;
  menuId: string;
  onClose: () => void;
  onSignOut: () => void;
  registerItem: (index: number) => (el: HTMLAnchorElement | HTMLButtonElement | null) => void;
  variant?: 'desktop' | 'mobile';
}

/**
 * User dropdown menu with profile info, dashboard link, and sign out
 */
export function UserDropdown({
  user,
  menuId,
  onClose,
  onSignOut,
  registerItem,
  variant = 'desktop',
}: UserDropdownProps) {
  const widthClass = variant === 'desktop' ? 'w-64' : 'w-56';

  return (
    <div
      id={menuId}
      role="menu"
      aria-label="User menu"
      className={`absolute right-0 mt-2 ${widthClass} rounded-xl border border-white/10 bg-[#132e53]/95 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,.35)] z-50 overflow-hidden`}
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm font-medium text-white">
          {user.user_metadata?.full_name || 'User'}
        </p>
        <p className="text-xs text-white/60 truncate">{user.email}</p>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <Link
          to="/dashboard"
          role="menuitem"
          ref={registerItem(0)}
          className="block px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition focus:outline-none"
          onClick={onClose}
        >
          Dashboard
        </Link>
      </div>

      {/* Sign Out */}
      <div className="border-t border-white/10">
        <button
          type="button"
          role="menuitem"
          ref={registerItem(1)}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            onSignOut();
          }}
          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition focus:outline-none"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

