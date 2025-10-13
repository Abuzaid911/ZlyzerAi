// components/AnalysisResultCard.tsx
import React, { useMemo, useState, useEffect, useRef, useId, useCallback } from 'react';
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

/**
 * Heuristic formatter to improve readability of plain analysis text.
 * - Splits into lines
 * - Detects simple bullets (-, •, *, "— ") and groups them
 * - Renders paragraphs for other lines
 */
function ReadableText({ text }: { text: string }) {
  const lines = useMemo(
    () =>
      text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean),
    [text]
  );

  const blocks: Array<{ type: 'ul' | 'p'; content: string[] }> = [];
  let currentUl: string[] = [];

  const isBullet = (l: string) => /^(-|\*|•|—)\s+/.test(l);

  lines.forEach(l => {
    if (isBullet(l)) {
      currentUl.push(l.replace(/^(-|\*|•|—)\s+/, ''));
    } else {
      if (currentUl.length) {
        blocks.push({ type: 'ul', content: currentUl });
        currentUl = [];
      }
      blocks.push({ type: 'p', content: [l] });
    }
  });
  if (currentUl.length) blocks.push({ type: 'ul', content: currentUl });

  return (
    <div className="prose prose-invert max-w-none prose-ul:my-2 prose-li:my-1 prose-p:my-2">
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i} className="list-disc pl-6">
            {b.content.map((c, j) => (
              <li key={j}>{sanitizeText(c)}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{sanitizeText(b.content[0])}</p>
        )
      )}
    </div>
  );
}

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{label}</p>
      <div className="mt-1 text-sm text-white/90">{children}</div>
    </div>
  );
}

export default function AnalysisResultCard({
  analysis,
  variant,
  highlight = false,
  loading = false,
}: AnalysisResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expanded, setExpanded] = useState(false); // expand/collapse long text
  const [readable, setReadable] = useState(true); // toggle Raw vs Readable view
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const menuBtnId = useId();
  const status = (typeof analysis.status === 'string' ? analysis.status.toUpperCase() : analysis.status) as keyof typeof STATUS_STYLES;
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.DEFAULT;

  // Close export menu on outside click / ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportMenu(false);
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEsc);
      };
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

  const handleCopy = useCallback(async () => {
    if (!summaryText) return;
    const success = await copyToClipboard(summaryText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [summaryText]);

  const handleExportJSON = () => {
    exportAsJSON(analysis);
    setShowExportMenu(false);
  };

  const handleExportText = () => {
    exportAsText(analysis);
    setShowExportMenu(false);
  };

  // Short preview (first ~400 chars or until newline) for quick scan
  const preview = useMemo(() => {
    if (!summaryText) return '';
    const hardStop = 420;
    const firstBreak = summaryText.indexOf('\n');
    const cut = firstBreak > -1 ? Math.min(firstBreak, hardStop) : hardStop;
    return summaryText.length > cut ? summaryText.slice(0, cut).trim() + '…' : summaryText.trim();
  }, [summaryText]);

  return (
    <section
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-[0_24px_80px_rgba(12,22,38,0.45)] backdrop-blur transition',
        highlight && 'ring-1 ring-[#2ce695]/50'
      )}
      aria-label={`Analysis result for ${variant === 'video' ? 'video' : 'profile'}`}
    >
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                statusStyle
              )}
              aria-live="polite"
            >
              {status}
            </span>
            <a
              href={anchorHref}
              target="_blank"
              rel="noreferrer noopener"
              className="truncate text-sm text-[#2ce695] underline-offset-4 hover:underline hover:text-[#7affd0]"
              title={anchorLabel}
            >
              {variant === 'video' ? 'Open video' : 'Open profile'}
            </a>
          </div>
          <p className="mt-1 text-xs text-white/50">Request ID</p>
          <p className="font-mono text-[13px] text-white/80 break-all">{analysis.id}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white/95 transition"
            aria-label="Copy analysis to clipboard"
            title="Copy to clipboard"
            disabled={!hasResult || loading}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              id={menuBtnId}
              onClick={() => setShowExportMenu(v => !v)}
              className="rounded-lg px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white/95 transition"
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              aria-controls={`${menuBtnId}-menu`}
              title="Export analysis"
              disabled={!hasResult || loading}
            >
              💾 Export
            </button>
            {showExportMenu && (
              <div
                id={`${menuBtnId}-menu`}
                role="menu"
                aria-labelledby={menuBtnId}
                className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#132e53] shadow-xl"
              >
                <button
                  role="menuitem"
                  onClick={handleExportText}
                  className="block w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10 transition-colors"
                >
                  📄 Export as Text
                </button>
                <button
                  role="menuitem"
                  onClick={handleExportJSON}
                  className="block w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10 transition-colors"
                >
                  📊 Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Meta */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetaItem label={variant === 'video' ? 'Video' : 'Profile'}>
          <a
            href={anchorHref}
            target="_blank"
            rel="noreferrer noopener"
            className="break-all text-[#2ce695] hover:text-[#7affd0] transition-colors"
          >
            {anchorLabel}
          </a>
        </MetaItem>
        <MetaItem label="Created">{formatDate(analysis.createdAt)}</MetaItem>
        <MetaItem label="Processing">
          {processingSeconds != null ? `${processingSeconds}s` : '—'}
        </MetaItem>
        <MetaItem label="Custom prompt" >
          <span className="inline-block max-w-full truncate align-top" title={promptLabel}>
            {promptLabel}
          </span>
        </MetaItem>
      </div>

      {/* Analysis Panel */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">AI Analysis</p>

          {/* View toggles */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                className="accent-[#2ce695]"
                checked={readable}
                onChange={(e) => setReadable(e.target.checked)}
                aria-label="Toggle readable view"
              />
              Readable view
            </label>
          </div>
        </div>

        {/* States */}
        {loading && !hasResult ? (
          <div className="mt-4 space-y-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: SKELETON_LOADING_ROWS }, (_, idx) => (
              <div key={idx} className="h-3 w-full rounded bg-white/10 animate-pulse" />
            ))}
            <p className="text-xs text-white/40 mt-3">Processing… fetching updates every second.</p>
          </div>
        ) : failureMessage ? (
          <div
            className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200"
            role="alert"
          >
            {failureMessage}
          </div>
        ) : (
          <div className="mt-4">
            {/* Quick Summary / Expand */}
            {hasResult && summaryText && (
              <>
                {!expanded && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-sm leading-relaxed text-white/90">
                      {sanitizeText(preview)}
                    </p>
                    {summaryText.length > preview.length && (
                      <button
                        onClick={() => setExpanded(true)}
                        className="mt-2 text-xs text-[#2ce695] hover:text-[#7affd0] underline underline-offset-4"
                        aria-expanded={expanded}
                        aria-controls="analysis-full"
                      >
                        Read full analysis
                      </button>
                    )}
                  </div>
                )}

                {/* Full Body */}
                {expanded && (
                  <div id="analysis-full" role="region" aria-label="Full analysis">
                    {readable ? (
                      <ReadableText text={summaryText} />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                        {sanitizeText(summaryText)}
                      </pre>
                    )}
                    <button
                      onClick={() => setExpanded(false)}
                      className="mt-3 text-xs text-[#2ce695] hover:text-[#7affd0] underline underline-offset-4"
                    >
                      Show less
                    </button>
                  </div>
                )}

                {/* If analysis is short, just show it directly */}
                {!expanded && summaryText.length <= preview.length && (
                  <div role="region" aria-label="Analysis result">
                    {readable ? (
                      <ReadableText text={summaryText} />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                        {sanitizeText(summaryText)}
                      </pre>
                    )}
                  </div>
                )}
              </>
            )}

            {!hasResult && !loading && !failureMessage && (
              <p className="text-sm text-white/70">No analysis available yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
