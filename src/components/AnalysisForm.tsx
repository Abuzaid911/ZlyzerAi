import React, { useRef } from 'react';
import clsx from 'clsx';

interface AnalysisFormProps {
  onSubmit: (e: React.FormEvent) => void;
  input: string;
  setInput: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  loading: boolean;
  redirecting: boolean;
  variant: 'video' | 'profile';
  inputPlaceholder: string;
  promptPlaceholder: string;
  buttonText: string;
  inputType?: string; // optional override
}

export default function AnalysisForm({
  onSubmit,
  input,
  setInput,
  prompt,
  setPrompt,
  loading,
  redirecting,
  variant,
  inputPlaceholder,
  promptPlaceholder,
  buttonText,
  inputType,
}: AnalysisFormProps) {
  const buttonColor = variant === 'video' ? 'bg-[#2ce695]' : 'bg-[#18CCFC]';
  const focusColor =
    variant === 'video' ? 'focus:border-[#2ce695]/60' : 'focus:border-[#18CCFC]/60';

  const inputId = `${variant}-input`;
  const promptId = `${variant}Prompt`;
  const formId = `${variant}-analysis-form`;

  // NEW: guard against re-entrant submits (extra safety)
  const submittingRef = useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    if (submittingRef.current || loading || redirecting) {
      e.preventDefault();
      return;
    }
    submittingRef.current = true;
    onSubmit(e);
    // allow parent to flip loading/redirecting; release guard soon
    setTimeout(() => { submittingRef.current = false; }, 250);
  };

  const isBusy = loading || redirecting;

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label={`${variant} analysis form`}
      // NEW: make the whole form busy for AT
      aria-busy={isBusy}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            {variant === 'video' ? 'TikTok video URL' : 'TikTok profile handle'}
          </label>
          <input
            id={inputId}
            type={inputType ?? (variant === 'video' ? 'url' : 'text')}  // NEW: semantic type
            required
            placeholder={inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isBusy}
            autoComplete={variant === 'video' ? 'url' : 'username'}      // NEW
            inputMode={variant === 'video' ? 'url' : 'text'}             // NEW
            // Optional URL hint (loose):
            pattern={variant === 'video' ? 'https?://.*' : undefined}    // NEW
            aria-label={variant === 'video' ? 'TikTok video URL input' : 'TikTok profile handle input'}
            aria-required="true"
            aria-describedby={`${inputId}-description`}
            className={clsx(
              'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder-white/40 outline-none transition-colors',
              focusColor,
              isBusy && 'opacity-60 cursor-not-allowed'
            )}
          />
          <span id={`${inputId}-description`} className="sr-only">
            Enter {variant === 'video' ? 'a TikTok video URL' : 'a TikTok profile handle'} to analyze
          </span>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          aria-label={
            redirecting
              ? 'Redirecting to sign in'
              : loading
              ? `Analyzing ${variant}`
              : `Submit ${variant} for analysis`
          }
          aria-busy={isBusy}
          className={clsx(
            'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-[#0b1b14] transition',
            buttonColor,
            isBusy && 'opacity-70 cursor-not-allowed'
          )}
        >
          {/* NEW: tiny spinner */}
          {(loading || redirecting) && (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" fill="none" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          )}
          {redirecting ? 'Redirecting to sign in…' : loading ? 'Analyzing…' : buttonText}
        </button>
      </div>

      {/* Loading status announcement for screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && `Analyzing ${variant}...`}
        {redirecting && 'Redirecting to sign in...'}
      </div>

      <div className="text-left">
        <label
          htmlFor={promptId}
          className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50"
        >
          Custom prompt (optional)
        </label>
        <textarea
          id={promptId}
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptPlaceholder}
          disabled={isBusy}
          aria-label="Custom analysis prompt"
          aria-describedby={`${promptId}-description`}
          className={clsx(
            'mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors',
            focusColor,
            isBusy && 'opacity-60 cursor-not-allowed'
          )}
        />
        <p id={`${promptId}-description`} className="mt-1 text-xs text-white/40">
          Zlyzer will tailor the summary using your instruction.
        </p>
      </div>
    </form>
  );
}
