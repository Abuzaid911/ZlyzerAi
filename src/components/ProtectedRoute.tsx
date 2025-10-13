// components/ProtectedRoute.tsx
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';
import { buildRedirectPath, savePostAuthRedirect } from '../utils/authRedirect';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: string;
}

export default function ProtectedRoute({ children, fallback = '/' }: ProtectedRouteProps) {
  const { authReady, isSignedIn } = useAuthSession();
  const location = useLocation();

  const targetPath = useMemo(() => buildRedirectPath(location), [location]);

  useEffect(() => {
    if (authReady && !isSignedIn) {
      savePostAuthRedirect(targetPath);
    }
  }, [authReady, isSignedIn, targetPath]);

  if (!authReady) {
    return (
      <main className="min-h-screen grid place-items-center bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
        <div className="flex items-center gap-3 text-white/80">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
          </svg>
          <span>Checking your session…</span>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
