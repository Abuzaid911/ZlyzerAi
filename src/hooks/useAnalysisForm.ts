// Custom hook to manage analysis form state and logic
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PROGRESS_CONSTANTS, MAX_HISTORY_ITEMS, COOLDOWN_MS } from '../constants/analysis';
import { usePersistedHistory } from './usePersistedHistory';
import { clearPostAuthRedirect, savePostAuthRedirect } from '../utils/authRedirect';

interface AnalysisItem {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface UseAnalysisFormOptions<T extends AnalysisItem> {
  submitFn: (input: string, prompt?: string) => Promise<void>;
  result: T | null;
  status: string;
  loading: boolean;
  error: string | null;
  processInput?: (input: string) => string;
  storageKey: string;
  onSuccess?: (result: T) => void;
  onError?: (error: string) => void;
}

export function useAnalysisForm<T extends AnalysisItem>({
  submitFn,
  result,
  status,
  loading,
  error,
  processInput = (input) => input,
  storageKey,
  onSuccess,
  onError,
}: UseAnalysisFormOptions<T>) {
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [progress, setProgress] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const resultRef = useRef<HTMLDivElement | null>(null);
  
  // Use persisted history
  const { history, setHistory } = usePersistedHistory<T>(storageKey, MAX_HISTORY_ITEMS);
  
  // Track which results and errors we've already notified about to prevent duplicate toasts
  const notifiedResultsRef = useRef(new Set<string>());
  const notifiedErrorsRef = useRef(new Set<string>());

  // Manage progress animation
  useEffect(() => {
    if (status === 'queued' || status === 'processing') {
      let currentProgress = 0;
      const intervalId = setInterval(() => {
        currentProgress = Math.min(
          currentProgress + Math.random() * PROGRESS_CONSTANTS.INCREMENT_MAX,
          PROGRESS_CONSTANTS.MAX_FAKE_PROGRESS
        );
        setProgress(currentProgress);
      }, PROGRESS_CONSTANTS.UPDATE_INTERVAL_MS);
      return () => clearInterval(intervalId);
    }
    
    if (status === 'completed') {
      setProgress(PROGRESS_CONSTANTS.COMPLETED_PROGRESS);
    } else if (status === 'failed') {
      setProgress(PROGRESS_CONSTANTS.FAILED_PROGRESS);
    } else {
      setProgress(0);
    }
  }, [status]);

  // Manage history and scroll to results
  useEffect(() => {
    if (status === 'completed' && result) {
      setHistory((prev: T[]) => {
        const ids = new Set(prev.map((r: T) => r.id));
        if (ids.has(result.id)) return prev;
        
        // Keep only the most recent MAX_HISTORY_ITEMS
        const newHistory = [result, ...prev];
        return newHistory.slice(0, MAX_HISTORY_ITEMS);
      });

      // Scroll to result with a small delay to ensure DOM is updated
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
      // Call success callback only once per result to prevent duplicate toasts
      if (!notifiedResultsRef.current.has(result.id)) {
        notifiedResultsRef.current.add(result.id);
        onSuccess?.(result);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, result, setHistory]); // Intentionally omit onSuccess to prevent infinite loop
  
  // Handle errors - only notify once per unique error message
  useEffect(() => {
    if (error && !notifiedErrorsRef.current.has(error)) {
      notifiedErrorsRef.current.add(error);
      onError?.(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]); // Intentionally omit onError to prevent infinite loop

  // Clear redirecting state when user is authenticated
  useEffect(() => {
    if (redirecting) {
      const checkAuth = async () => {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setRedirecting(false);
        }
      };
      checkAuth();
    }
  }, [redirecting]);

  const ensureSignedIn = async () => {
    setRedirectError(null);
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Failed to check auth session:', sessionError);
    }
    
    const user = data?.session?.user;
    if (user) {
      return true;
    }

    // Store current path for redirect after auth using new key
    savePostAuthRedirect();
    
    setRedirecting(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Always use explicit callback URL, never window.location.href
        redirectTo: `${window.location.origin}/auth/callback`,
        // Request PKCE flow for better security
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (signInError) {
      console.error('Sign-in redirect failed:', signInError);
      setRedirectError('We could not start the sign-in flow. Disable pop-up blockers and try again.');
      setRedirecting(false);
      clearPostAuthRedirect(); // Clean up on error
    }
    
    return false;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < COOLDOWN_MS) {
      setRedirectError('Please wait a moment before submitting again.');
      setTimeout(() => setRedirectError(null), 2000);
      return;
    }

    const signedIn = await ensureSignedIn();
    if (!signedIn) return;

    setLastSubmitTime(now);
    setProgress(0);
    
    try {
      const processedInput = processInput(trimmedInput);
      await submitFn(processedInput, prompt.trim() || undefined);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Analysis submission failed:', err);
    }
  };

  return {
    input,
    setInput,
    prompt,
    setPrompt,
    history,
    progress,
    redirecting,
    redirectError,
    resultRef,
    handleSubmit,
    loading,
    error,
  };
}
