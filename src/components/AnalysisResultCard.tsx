// Reusable component to display analysis results
import React, { useMemo, useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { AnalysisRequest, ProfileAnalysisRequest } from '../types/api';
import { formatDate, buildProfileLabel, buildProfileLink } from '../utils/formatters';
import { sanitizeText } from '../utils/validation';
import { STATUS_STYLES, SKELETON_LOADING_ROWS } from '../constants/analysis';
import { exportAsJSON, exportAsText, copyToClipboard } from '../utils/export';

type AnalysisType = AnalysisRequest | ProfileAnalysisRequest;

interface AnalysisResultCardProps {
  analysis: AnalysisType;
  variant: 'video' | 'profile';
  highlight?: boolean;
  loading?: boolean;
}

// Removed unused function - using variant prop directly

export default function AnalysisResultCard({
  analysis,
  variant,
  highlight = false,
  loading = false,
}: AnalysisResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  const status = typeof analysis.status === 'string' ? analysis.status.toUpperCase() : analysis.status;
  
  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);
  
  const processingSeconds = useMemo(() => {
    return (
      analysis.result?.processingTime ??
      (typeof analysis.profileResult?.processingTime === 'number'
        ? analysis.profileResult.processingTime
        : undefined)
    );
  }, [analysis]);

  const { anchorHref, anchorLabel } = useMemo(() => {
    if (variant === 'video') {
      const url = (analysis as AnalysisRequest).url;
      return { anchorHref: url, anchorLabel: url };
    }
    
    const profileReference =
      (analysis as ProfileAnalysisRequest).profileHandle || analysis.url || null;
    return {
      anchorHref: buildProfileLink(profileReference),
      anchorLabel: buildProfileLabel(profileReference),
    };
  }, [analysis, variant]);

  const promptLabel = useMemo(
    () => analysis.customPrompt || (variant === 'video' ? 'Default Zlyzer brief' : 'Default profile brief'),
    [analysis.customPrompt, variant]
  );

  const summaryText = useMemo(() => {
    if (variant === 'profile') {
      return analysis.profileResult?.analysisResult ?? analysis.result?.analysisResult ?? null;
    }
    return analysis.result?.analysisResult ?? null;
  }, [analysis, variant]);

  const hasResult = Boolean(summaryText);

  const failureMessage = useMemo(
    () =>
      status === 'FAILED'
        ? analysis.errorMessage || 'Analysis failed — please try again later.'
        : null,
    [status, analysis.errorMessage]
  );

  const statusStyle = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.DEFAULT;

  const handleCopy = async () => {
    if (!summaryText) return;
    const success = await copyToClipboard(summaryText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportJSON = () => {
    exportAsJSON(analysis);
    setShowExportMenu(false);
  };

  const handleExportText = () => {
    exportAsText(analysis);
    setShowExportMenu(false);
  };

  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-[0_24px_80px_rgba(12,22,38,0.45)] backdrop-blur transition',
        highlight && 'ring-1 ring-[#2ce695]/50'
      )}
      role="article"
      aria-label={`Analysis result for ${variant === 'video' ? 'video' : 'profile'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Request ID</p>
          <p className="mt-1 font-mono text-[13px] text-white/80">{analysis.id}</p>
        </div>
        <span
          className={clsx(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
            statusStyle
          )}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-4 text-sm text-white/80">
        <MetaItem label={variant === 'video' ? 'Video' : 'Profile'}>
          <a
            href={anchorHref}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[#2ce695] hover:text-[#7affd0] transition-colors"
          >
            {anchorLabel}
          </a>
        </MetaItem>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetaItem label="Created">{formatDate(analysis.createdAt)}</MetaItem>
          <MetaItem label="Processing">
            {processingSeconds != null ? `${processingSeconds}s` : '—'}
          </MetaItem>
          <MetaItem label="Custom prompt">{promptLabel}</MetaItem>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">AI Analysis</p>
          {hasResult && !loading && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
                aria-label="Copy analysis to clipboard"
                title="Copy to clipboard"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
                  aria-label="Export analysis"
                  aria-expanded={showExportMenu}
                  aria-haspopup="true"
                  title="Export analysis"
                >
                  💾 Export
                </button>
                {showExportMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-white/10 bg-[#132e53] shadow-xl overflow-hidden"
                    role="menu"
                  >
                    <button
                      onClick={handleExportText}
                      className="block w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      role="menuitem"
                    >
                      📄 Export as Text
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="block w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                      role="menuitem"
                    >
                      📊 Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {loading && !hasResult ? (
          <div className="mt-3 space-y-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: SKELETON_LOADING_ROWS }, (_, idx) => (
              <div key={idx} className="h-3 w-full rounded bg-white/10 animate-pulse" />
            ))}
            <p className="text-xs text-white/40 mt-3">Processing… fetching updates every second.</p>
          </div>
        ) : failureMessage ? (
          <div 
            className="mt-3 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200"
            role="alert"
          >
            {failureMessage}
          </div>
        ) : (
          <pre 
            className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/90"
            role="region"
            aria-label="Analysis result text"
          >
            {summaryText ? sanitizeText(summaryText) : 'No analysis available yet.'}
          </pre>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{label}</p>
      <div className="mt-1 text-sm text-white/80">{children}</div>
    </div>
  );
}

