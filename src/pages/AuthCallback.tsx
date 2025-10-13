// pages/AuthCallback.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        // 1) Detect which flow we got
        const hasCode = location.search.includes("code=");
        const hasLegacyTokens =
          location.hash.startsWith("#access_token=") ||
          location.hash.includes("access_token=");

        if (!hasCode && !hasLegacyTokens) {
          throw new Error("No authorization code or tokens found in callback URL");
        }

        // 2) Process authentication
        if (hasLegacyTokens) {
          // TEMP: legacy hash flow -> setSession using hash tokens
          const params = new URLSearchParams(location.hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");

          if (!access_token || !refresh_token) {
            throw new Error("Missing legacy tokens");
          }
          await supabase.auth.setSession({ access_token, refresh_token });

          // Scrub tokens from URL (security)
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } else {
          // PKCE: exchange ?code=... for a session
          const params = new URLSearchParams(location.search);
          const code = params.get("code");
          
          if (!code) {
            throw new Error("Missing authorization code");
          }
          
          await supabase.auth.exchangeCodeForSession(code);
        }

        // 3) Confirm session exists
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data?.session) throw new Error("Session not established");

        // 4) Figure out where to go next
        const next = sessionStorage.getItem("postAuthRedirect") || "/video-analysis";
        sessionStorage.removeItem("postAuthRedirect");
        sessionStorage.removeItem("auth_redirect_to");

        // 5) Redirect
        navigate(next, { replace: true });
      } catch (err) {
        // Avoid logging the full error (could include tokens in some envs)
        console.error("Auth callback error:", (err as Error)?.message || err);
        sessionStorage.removeItem("postAuthRedirect");
        sessionStorage.removeItem("auth_redirect_to");
        navigate("/", { replace: true });
      }
    })();
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
