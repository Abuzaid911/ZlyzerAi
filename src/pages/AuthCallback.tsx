// pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * OAuth callback handler page
 * 
 * This page:
 * 1. Exchanges the auth code for a session
 * 2. Retrieves the intended redirect path from sessionStorage
 * 3. Redirects the user to their intended destination or dashboard
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically handles the code exchange via URL hash
        // We just need to verify the session was created
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session created after authentication');
        }

        // Get the intended redirect path from sessionStorage
        const intendedPath = sessionStorage.getItem('auth_redirect_to');
        sessionStorage.removeItem('auth_redirect_to'); // Clean up

        // Redirect to intended path or default to dashboard
        const redirectPath = intendedPath || '/dashboard';
        
        // Small delay to ensure session is fully established
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        
        // Redirect to home with error after a delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    void handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-rose-400">Authentication Failed</h1>
          <p className="mt-2 text-white/70">{error}</p>
          <p className="mt-4 text-sm text-white/50">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] px-6 text-white">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center">
          <svg
            className="h-16 w-16 animate-spin text-[#2ce695]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="4"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              stroke="currentColor"
              strokeWidth="4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Completing Sign In...</h1>
        <p className="mt-2 text-white/70">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}

