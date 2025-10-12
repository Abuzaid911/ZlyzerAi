// Generic polling hook to eliminate duplication between video and profile analysis
import { useState, useCallback, useRef, useEffect } from 'react';

const DEFAULT_POLL_INTERVAL = 1000; // 1 second
const DEFAULT_MAX_POLL_ATTEMPTS = 150; // 5 minutes max

type AnalysisStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

interface AnalysisItem {
  id?: string;
  status?: string;
  errorMessage?: string;
  result?: {
    analysisResult?: string;
  };
  profileResult?: {
    analysisResult?: string;
  };
  [key: string]: any;
}

interface CreateResponse {
  requestId?: string;
  jobId?: string;
  status?: string;
  [key: string]: any;
}

interface UsePollingAnalysisConfig<T extends AnalysisItem, R extends CreateResponse> {
  createFn: (input: string, prompt?: string, opts?: any) => Promise<R>;
  getFn: (jobId: string, opts?: any) => Promise<T>;
  pollInterval?: number;
  maxAttempts?: number;
}

export function usePollingAnalysis<T extends AnalysisItem, R extends CreateResponse>({
  createFn,
  getFn,
  pollInterval = DEFAULT_POLL_INTERVAL,
  maxAttempts = DEFAULT_MAX_POLL_ATTEMPTS,
}: UsePollingAnalysisConfig<T, R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScheduledPoll = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const cancelOngoing = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    clearScheduledPoll();
  }, [clearScheduledPoll]);

  useEffect(() => () => cancelOngoing(), [cancelOngoing]);

  const pollAnalysis = useCallback(
    (jobId: string, controller: AbortController) => {
      return new Promise<void>((resolve) => {
        let attempts = 0;

        const tick = async () => {
          if (controller.signal.aborted) {
            if (abortRef.current === controller) abortRef.current = null;
            clearScheduledPoll();
            return resolve();
          }

          try {
            const response = await getFn(jobId, { signal: controller.signal });
            
            if (controller.signal.aborted) {
              if (abortRef.current === controller) abortRef.current = null;
              clearScheduledPoll();
              return resolve();
            }

            setResult(response);

            const normalizedStatus =
              typeof response.status === 'string' ? response.status.toLowerCase() : '';
            const hasResult = Boolean(
              response.result?.analysisResult || response.profileResult?.analysisResult
            );

            if (normalizedStatus === 'failed') {
              setError(response.errorMessage || 'Analysis failed');
              setStatus('failed');
              setLoading(false);
              clearScheduledPoll();
              if (abortRef.current === controller) abortRef.current = null;
              return resolve();
            }

            if (normalizedStatus === 'completed' || normalizedStatus === 'cached' || hasResult) {
              setStatus('completed');
              setLoading(false);
              clearScheduledPoll();
              if (abortRef.current === controller) abortRef.current = null;
              return resolve();
            }

            setStatus(normalizedStatus === 'queued' ? 'queued' : 'processing');

            attempts += 1;
            if (attempts >= maxAttempts) {
              setError('Analysis timeout - please check dashboard for results');
              setStatus('failed');
              setLoading(false);
              clearScheduledPoll();
              if (abortRef.current === controller) abortRef.current = null;
              return resolve();
            }

            pollTimeoutRef.current = setTimeout(() => {
              void tick();
            }, pollInterval);
          } catch (err) {
            if (controller.signal.aborted) {
              if (abortRef.current === controller) abortRef.current = null;
              clearScheduledPoll();
              return resolve();
            }
            console.error('Poll error:', err);
            setError(err instanceof Error ? err.message : 'Polling failed');
            setStatus('failed');
            setLoading(false);
            clearScheduledPoll();
            if (abortRef.current === controller) abortRef.current = null;
            return resolve();
          }
        };

        void tick();
      });
    },
    [clearScheduledPoll, getFn, maxAttempts, pollInterval]
  );

  const submit = useCallback(
    async (input: string, customPrompt?: string) => {
      cancelOngoing();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);
        setResult(null);
        setStatus('idle');
        setRequestId(null);

        const response = await createFn(input, customPrompt, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return response;
        }

        const jobId = response.requestId ?? response.jobId;
        if (!jobId) {
          throw new Error('Analysis request ID missing in response');
        }

        setRequestId(jobId);

        if (response.status && response.status.toLowerCase() === 'cached') {
          const cachedResult = await getFn(jobId, { signal: controller.signal });
          if (controller.signal.aborted) {
            return response;
          }
          setResult(cachedResult);
          setStatus('completed');
          setLoading(false);
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          return response;
        }

        setStatus('queued');
        await pollAnalysis(jobId, controller);
        return response;
      } catch (err) {
        if (controller.signal.aborted) {
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
          return;
        }
        console.error('Submit analysis error:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit analysis');
        setStatus('failed');
        setLoading(false);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        throw err;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [cancelOngoing, createFn, getFn, pollAnalysis]
  );

  const reset = useCallback(() => {
    cancelOngoing();
    setLoading(false);
    setError(null);
    setResult(null);
    setStatus('idle');
    setRequestId(null);
  }, [cancelOngoing]);

  return {
    submit,
    loading,
    error,
    result,
    status,
    reset,
    requestId,
  };
}

