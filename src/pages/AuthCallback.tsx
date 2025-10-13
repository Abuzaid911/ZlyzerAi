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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        const code = searchParams.get('code');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        let session = null;

        // ✅ PREFERRED: PKCE flow with authorization code
        if (code) {
          console.log('🔐 Processing PKCE authorization code...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw new Error(`Failed to exchange code: ${exchangeError.message}`);
          }
          
          session = data.session;
          console.log('✅ PKCE session established');
        }
        
        // ⚠️ LEGACY: Hash-based tokens (implicit flow) - for backwards compatibility
        else if (accessToken && refreshToken) {
          console.warn('⚠️ Using legacy hash token flow. Please migrate to PKCE.');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            throw new Error(`Failed to set session: ${sessionError.message}`);
          }
          
          session = data.session;
          
          // Clean up the hash from URL immediately (security best practice)
          const cleanUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', cleanUrl);
          console.log('🧹 Cleaned legacy tokens from URL');
        }
        
        // ❌ No valid auth data found
        else {
          throw new Error('No authorization code or tokens found in callback URL');
        }

        // Verify session was created
        if (!session) {
          throw new Error('No session created after authentication');
        }

        // Get the intended redirect path from sessionStorage
        const postAuthRedirect = sessionStorage.getItem('postAuthRedirect');
        sessionStorage.removeItem('postAuthRedirect'); // Clean up
        
        // Also clean up legacy key if it exists
        sessionStorage.removeItem('auth_redirect_to');

        // Determine where to redirect
        const redirectPath = postAuthRedirect || '/dashboard';
        
        console.log(`✅ Authentication successful, redirecting to: ${redirectPath}`);
        
        // Small delay to ensure session is fully propagated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 100);

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

