// pages/VideoAnalysis.tsx - Refactored version (with TikTok short-link expansion)
import { useCreateAnalysis } from '../hooks/useCreateAnalysis';
// import { useCreateProfileAnalysis } from '../hooks/useCreateProfileAnalysis';
import { useAnalysisForm } from '../hooks/useAnalysisForm';
import { useAuthSession } from '../hooks/useAuthSession';
// import { normalizeHandle } from '../utils/validation';
import AnalysisForm from '../components/AnalysisForm';
import AnalysisLoader from '../components/AnalysisLoader';
import AnalysisHistory from '../components/AnalysisHistory';
import { useToast } from '../components/Toast';

// ---------- Helpers: normalize + expand TikTok URLs ----------
async function expandRedirect(url: string, timeoutMs = 4000): Promise<string | null> {
  // Try to follow redirects client-side and read final URL.
  // Note: Some browsers return an opaque response due to CORS; we then return null to let caller fallback.
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
    // If CORS allows, response.url will be the final expanded URL.
    if (res && typeof res.url === 'string' && res.url.trim()) {
      return res.url;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function ensureHttps(u: string) {
  const trimmed = u.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function stripTrackingParams(u: string) {
  try {
    const url = new URL(u);
    // Keep only meaningful params; drop common tracking noise
    const allow = new Set(['lang', 'langCode']); // extend if you need
    [...url.searchParams.keys()].forEach((k) => {
      if (!allow.has(k)) url.searchParams.delete(k);
    });
    return url.toString();
  } catch {
    return u;
  }
}

async function normalizeTikTokUrl(raw: string): Promise<string> {
  let input = ensureHttps(raw);

  // Basic canonicalization for standard TikTok URLs
  try {
    const u = new URL(input);
    const host = u.hostname.toLowerCase();

    // If it's a short link, try to expand
    if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
      const expanded = await expandRedirect(u.toString());
      if (expanded) {
        return stripTrackingParams(expanded);
      }
      // Fallback: keep the short URL but ensure https + strip params (backend should still handle)
      return stripTrackingParams(u.toString());
    }

    // If it's already a canonical TikTok domain, just tidy params
    if (
      host.endsWith('tiktok.com') ||
      host.endsWith('www.tiktok.com') ||
      host.endsWith('m.tiktok.com')
    ) {
      return stripTrackingParams(u.toString());
    }
  } catch {
    // ignore parse errors, return best-effort https input
  }

  return input;
}

export default function VideoAnalysis() {
  const toast = useToast();

  // Use centralized auth session hook
  const { isSignedIn, authReady } = useAuthSession();

  // Video analysis hook
  const {
    submitAnalysis,
    loading: videoLoading,
    error: videoError,
    result: videoResult,
    status: videoStatus,
  } = useCreateAnalysis();

  // Video form management
  const videoForm = useAnalysisForm({
    submitFn: async (url: string, prompt?: string) => {
      // ✅ Normalize/expand TikTok short links before sending to backend
      const normalized = await normalizeTikTokUrl(url);

      // Optional: surface a tiny hint if we changed the input
      if (normalized !== url) {
        toast.info('Expanded TikTok link before analysis.');
      }

      await submitAnalysis(normalized, prompt);
    },
    result: videoResult,
    status: videoStatus,
    loading: videoLoading,
    error: videoError,
    storageKey: 'zlyzer-video-analysis-history',
    onSuccess: () => {
      toast.success('Video analysis completed successfully!');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error}`);
    },
  });

  // // Profile analysis hook (kept commented as in your original)
  // const {
  //   submitProfile,
  //   loading: profileLoading,
  //   error: profileError,
  //   result: profileResult,
  //   status: profileStatus,
  // } = useCreateProfileAnalysis();

  // // Profile form management
  // const profileForm = useAnalysisForm({
  //   submitFn: async (handle: string, prompt?: string) => {
  //     await submitProfile(handle, prompt);
  //   },
  //   result: profileResult,
  //   status: profileStatus,
  //   loading: profileLoading,
  //   error: profileError,
  //   processInput: normalizeHandle,
  //   storageKey: 'zlyzer-profile-analysis-history',
  //   onSuccess: () => {
  //     toast.success('Profile analysis completed successfully!');
  //   },
  //   onError: (error) => {
  //     toast.error(`Analysis failed: ${error}`);
  //   },
  // });

  // Show loading skeleton while auth is being checked
  if (!authReady) {
    return (
      <main className="min-h-screen px-6 py-12 text-white mt-28">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-16">
          <section className="text-center">
            <div className="h-12 w-3/4 mx-auto animate-pulse rounded-lg bg-white/10" />
            <div className="mt-3 h-6 w-2/3 mx-auto animate-pulse rounded-lg bg-white/5" />
            <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_20px_60px_rgba(19,46,83,0.45)]">
              <div className="h-12 animate-pulse rounded-xl bg-white/5" />
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12 text-white mt-28">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16">
        {/* Video Analysis Section */}
        <section className="text-center">
          <h1 className="text-4xl font-extrabold md:text-5xl">Analyze Your TikTok Video</h1>
          <p className="mt-3 text-white/70">
            Paste a video or profile below. Zlyzer will analyze it with AI and surface hooks, sentiment,
            and opportunities.
          </p>

          <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_20px_60px_rgba(19,46,83,0.45)]">
            <AnalysisForm
              onSubmit={videoForm.handleSubmit}
              input={videoForm.input}
              setInput={videoForm.setInput}
              prompt={videoForm.prompt}
              setPrompt={videoForm.setPrompt}
              loading={videoForm.loading}
              redirecting={videoForm.redirecting}
              variant="video"
              inputPlaceholder="Paste TikTok video URL"
              promptPlaceholder="Focus on retention hooks and sentiment"
              buttonText="Analyze"
              inputType="url"
              isSignedIn={isSignedIn}
            />
          </div>

          {(videoStatus === 'queued' || videoStatus === 'processing') && (
            <AnalysisLoader
              status={videoStatus}
              message={videoStatus === 'queued' ? 'Queueing your video analysis...' : 'Analyzing video with AI...'}
            />
          )}

          {(videoError || videoForm.redirectError) && (
            <div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {videoForm.redirectError ?? videoError}
            </div>
          )}

          {(videoResult || videoForm.history.length > 0) && (
            <AnalysisHistory
              history={videoForm.history}
              currentResult={videoResult}
              variant="video"
              resultRef={videoForm.resultRef}
              currentStatus={videoStatus}
            />
          )}
        </section>

        {/* Profile Analysis Section (optional) */}
        {/* ...unchanged, commented out... */}
      </div>
    </main>
  );
}
