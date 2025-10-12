// hooks/useAuthBootstrap.ts
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { authSignup } from '../lib/apiClient';

/**
 * Auto-signup user after Supabase login
 * Call this once near app root (e.g., in Navbar or Layout)
 */
export function useAuthBootstrap() {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const ensureSignup = async (session: Session) => {
      const user = session.user;
      if (!user) return;

      const signedUpKey = `signed_up_${user.id}`;
      const status = sessionStorage.getItem(signedUpKey);

      if (status === 'true') {
        if (isMounted) setIsSignedUp(true);
        return;
      }

      try {
        const message = await authSignup();
        console.log('Auth signup:', message);
        sessionStorage.setItem(signedUpKey, 'true');
        if (isMounted) setError(null);
      } catch (signupErr) {
        console.warn('⚠️ Backend signup failed (backend might be offline):', signupErr);
        sessionStorage.setItem(signedUpKey, 'pending');
        if (isMounted) {
          setError(signupErr instanceof Error ? signupErr.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setIsSignedUp(true);
      }
    };

    const checkAndSignup = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const session = data.session;
        if (session?.user) {
          await ensureSignup(session);
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void checkAndSignup();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await ensureSignup(session);
        } else if (event === 'SIGNED_OUT') {
          setIsSignedUp(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isSignedUp, loading, error };
}
