// Reusable analysis form component
import React from 'react';
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
  inputType?: string;
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
  inputType = 'text',
}: AnalysisFormProps) {
  const buttonColor = variant === 'video' ? 'bg-[#2ce695]' : 'bg-[#18CCFC]';
  const focusColor =
    variant === 'video' ? 'focus:border-[#2ce695]/60' : 'focus:border-[#18CCFC]/60';
  
  const inputId = `${variant}-input`;
  const promptId = `${variant}Prompt`;
  const formId = `${variant}-analysis-form`;

  return (
    <form 
      id={formId}
      onSubmit={onSubmit} 
      className="flex flex-col gap-4"
      aria-label={`${variant} analysis form`}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            {variant === 'video' ? 'TikTok video URL' : 'TikTok profile handle'}
          </label>
          <input
            id={inputId}
            type={inputType}
            required
            placeholder={inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || redirecting}
            aria-label={variant === 'video' ? 'TikTok video URL input' : 'TikTok profile handle input'}
            aria-required="true"
            aria-describedby={`${inputId}-description`}
            className={clsx(
              'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder-white/40 outline-none transition-colors',
              focusColor,
              (loading || redirecting) && 'opacity-60 cursor-not-allowed'
            )}
          />
          <span id={`${inputId}-description`} className="sr-only">
            Enter {variant === 'video' ? 'a TikTok video URL' : 'a TikTok profile handle'} to analyze
          </span>
        </div>
        <button
          type="submit"
          disabled={loading || redirecting}
          aria-label={
            redirecting 
              ? 'Redirecting to sign in' 
              : loading 
              ? `Analyzing ${variant}` 
              : `Submit ${variant} for analysis`
          }
          aria-busy={loading || redirecting}
          className={clsx(
            'rounded-xl px-6 py-3.5 text-sm font-semibold text-[#0b1b14] transition',
            buttonColor,
            (loading || redirecting) && 'opacity-70 cursor-not-allowed'
          )}
        >
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
          disabled={loading || redirecting}
          aria-label="Custom analysis prompt"
          aria-describedby={`${promptId}-description`}
          className={clsx(
            'mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors',
            focusColor,
            (loading || redirecting) && 'opacity-60 cursor-not-allowed'
          )}
        />
        <p id={`${promptId}-description`} className="mt-1 text-xs text-white/40">
          Zlyzer will tailor the summary using your instruction.
        </p>
      </div>
    </form>
  );
}

