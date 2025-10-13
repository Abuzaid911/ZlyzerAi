// hooks/useAuthSession.ts
import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthSessionState {
  session: Session | null;
  user: User | null;
  isSignedIn: boolean;
  authReady: boolean;
}

/**
 * Custom hook to manage authentication session state
 * 
 * Features:
 * - Tracks authReady state to prevent premature UI rendering
 * - Always derives user and isSignedIn from session
 * - Subscribes to auth state changes for real-time updates
 * - Single source of truth for authentication state
 */
export function useAuthSession(): AuthSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let refreshInterval: number | undefined;

    // Initial session check with refresh
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get session:', error);
        }
        
        if (mounted) {
          setSession(currentSession);
          setAuthReady(true);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (mounted) {
          setSession(null);
          setAuthReady(true);
        }
      }
    };

    void checkSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // Handle token refresh
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed');
      }
      
      // Handle expired token
      if (event === 'SIGNED_OUT') {
        console.log('🔓 User signed out or token expired');
      }

      setSession(newSession);
      
      // If not ready yet, mark as ready now
      if (!authReady) {
        setAuthReady(true);
      }
    });

    // Revalidate session when page becomes visible (handles background tab throttling)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab became visible, rechecking session...');
        void checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic session validation (every 5 minutes)
    // This catches expired tokens before API calls fail
    refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []); // Only run on mount

  return {
    session,
    user: session?.user ?? null,
    isSignedIn: !!session?.user,
    authReady,
  };
}

/**
 * Force recheck the current session
 * Useful after operations that might invalidate the session
 */
export async function recheckSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Failed to recheck session:', error);
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('Session recheck error:', err);
    return null;
  }
}

