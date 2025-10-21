// pages/VideoAnalysis.tsx - Refactored version
import { useCreateAnalysis } from '../hooks/useCreateAnalysis';
// import { useCreateProfileAnalysis } from '../hooks/useCreateProfileAnalysis';
import { useAnalysisForm } from '../hooks/useAnalysisForm';
import { useAuthSession } from '../hooks/useAuthSession';
// import { normalizeHandle } from '../utils/validation';
import AnalysisForm from '../components/AnalysisForm';
import AnalysisLoader from '../components/AnalysisLoader';
import AnalysisHistory from '../components/AnalysisHistory';
import { useToast } from '../components/Toast';

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
      await submitAnalysis(url, prompt);
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
      toast.error(`Analysis failed: ${String(error)}`);
    },
  });

  // // Profile analysis hook
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
  //     toast.error(`Analysis failed: ${String(error)}`);
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

        {/* Profile Analysis Section */}
        {/* <section className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_20px_60px_rgba(19,46,83,0.45)]">
          <h2 className="text-2xl font-bold text-white">Analyze a TikTok Profile</h2>
          <p className="mt-2 text-sm text-white/70">
            Enter a profile handle (e.g. <span className="font-mono">@creator</span>). Zlyzer summarizes
            their content themes, posting rhythm, and audience sentiment.
          </p>

          <div className="mt-6">
            <AnalysisForm
              onSubmit={profileForm.handleSubmit}
              input={profileForm.input}
              setInput={profileForm.setInput}
              prompt={profileForm.prompt}
              setPrompt={profileForm.setPrompt}
              loading={profileForm.loading}
              redirecting={profileForm.redirecting}
              variant="profile"
              inputPlaceholder="Enter TikTok handle"
              promptPlaceholder="Summarize content pillars and posting cadence"
              buttonText="Analyze profile"
              isSignedIn={isSignedIn}
            />
          </div>

          {(profileStatus === 'queued' || profileStatus === 'processing') && (
            <AnalysisLoader
              status={profileStatus}
              message={profileStatus === 'queued' ? 'Queueing your profile analysis...' : 'Analyzing profile with AI...'}
            />
          )}

          {(profileError || profileForm.redirectError) && (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {profileForm.redirectError ?? profileError}
            </div>
          )}

          {(profileResult || profileForm.history.length > 0) && (
            <AnalysisHistory
              history={profileForm.history}
              currentResult={profileResult}
              variant="profile"
              resultRef={profileForm.resultRef}
              currentStatus={profileStatus}
            />
          )}
        </section> */}
      </div>
    </main>
  );
}
