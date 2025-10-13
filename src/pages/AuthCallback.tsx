// pages/AuthCallback.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    
    const handleCallback = async () => {
      try {
        // Supabase automatically processes OAuth callbacks via its internal listeners
        // We just need to wait for the session to become available
        
        // Small delay to let Supabase's automatic processing complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error.message);
          throw new Error("Failed to get session");
        }

        if (!data?.session) {
          // Session not ready yet, retry after a short delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data: retryData, error: retryError } = await supabase.auth.getSession();
          
          if (retryError || !retryData?.session) {
            throw new Error("Session not established after OAuth");
          }
        }

        if (!mounted) return;

        // Clean up hash tokens from URL if present (security)
        if (location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        // Get redirect destination
        const next = sessionStorage.getItem("postAuthRedirect") || "/video-analysis";
        sessionStorage.removeItem("postAuthRedirect");
        sessionStorage.removeItem("auth_redirect_to");

        // Redirect to destination
        navigate(next, { replace: true });
      } catch (err) {
        if (!mounted) return;
        
        // Avoid logging the full error (could include tokens in some envs)
        console.error("Auth callback error:", (err as Error)?.message || err);
        sessionStorage.removeItem("postAuthRedirect");
        sessionStorage.removeItem("auth_redirect_to");
        navigate("/", { replace: true });
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [location, navigate]);

  // Minimal loading UI
  return (
    <main className="min-h-screen grid place-items-center bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
      <div className="flex items-center gap-3 text-white/80">
        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
        </svg>
        <span>Completing sign in…</span>
      </div>
    </main>
  );
}
