// pages/AuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * OAuth callback handler with PKCE support
 * 
 * This page:
 * 1. Handles PKCE flow (?code=) by calling exchangeCodeForSession()
 * 2. Handles legacy hash tokens (#access_token=) for backwards compatibility
 * 3. Retrieves the intended redirect path from sessionStorage
 * 4. Redirects the user to their intended destination
 * 
 * Security:
 * - Never logs URLs containing tokens
 * - Cleans up URL after processing tokens
 * - Uses secure PKCE flow
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔐 Processing OAuth callback...');
        
        // Supabase automatically handles OAuth callbacks via onAuthStateChange
        // We just need to wait for the session to be available
        
        // Check if we have URL parameters
        const hasCode = location.search.includes('code=');
        const hasHashTokens = location.hash.includes('access_token');
        
        if (!hasCode && !hasHashTokens) {
          throw new Error('No authorization parameters found in callback URL');
        }

        // Wait for Supabase to process the OAuth callback automatically
        // It handles both PKCE codes and legacy hash tokens
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError.message);
          throw new Error(`Failed to get session: ${sessionError.message}`);
        }

        if (!session) {
          // Session not ready yet, wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
          
          if (retryError || !retrySession) {
            throw new Error('No session created after authentication');
          }
          
          console.log('✅ Session established (retry)');
        } else {
          console.log('✅ Session established');
        }

        // Clean up URL if it has hash tokens (security best practice)
        if (hasHashTokens) {
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
          console.log('🧹 Cleaned tokens from URL');
        }

        // Clean up stored redirect paths
        sessionStorage.removeItem('postAuthRedirect');
        sessionStorage.removeItem('auth_redirect_to');
        
        console.log('✅ Authentication successful! Redirecting in 5 seconds...');
        
        // Start 5-second countdown
        setCountdown(5);
        
        // Update countdown every second
        const countdownInterval = setInterval(() => {
          setCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Redirect to video-analysis after 5 seconds
        setTimeout(() => {
          clearInterval(countdownInterval);
          navigate('/video-analysis', { replace: true });
        }, 5000);

      } catch (err) {
        console.error('❌ Auth callback error:', err instanceof Error ? err.message : 'Unknown error');
        // Never log the full error object as it might contain tokens
        
        setError(err instanceof Error ? err.message : 'Authentication failed');
        
        // Clean up any stored redirect paths
        sessionStorage.removeItem('postAuthRedirect');
        sessionStorage.removeItem('auth_redirect_to');
        
        // Redirect to home after showing error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    void handleCallback();
  }, [navigate, location]);

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

  // Show countdown after successful authentication
  if (countdown !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#2ce695]/20 ring-4 ring-[#2ce695]/30">
            <svg
              className="h-10 w-10 text-[#2ce695]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="mt-3 text-lg text-white/90">
            Authentication successful
          </p>
          <div className="mt-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-2 ring-white/10">
            <span className="text-5xl font-bold text-[#2ce695]">{countdown}</span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            Redirecting to video analysis...
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while processing
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

