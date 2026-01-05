// components/AnalysisResultCard.tsx
import { useMemo, useState, useEffect, useRef, useId, useCallback } from 'react';
import clsx from 'clsx';
import type { AnalysisRequest, ProfileAnalysisRequest } from '../types/api';
import { formatDate, buildProfileLabel, buildProfileLink } from '../utils/formatters';
import { sanitizeText } from '../utils/validation';
import { STATUS_STYLES, SKELETON_LOADING_ROWS } from '../constants/analysis';
import { exportAsJSON, exportAsText, copyToClipboard } from '../utils/export';
import { useToast } from './Toast';
import { exportVideoAnalysisReport, type ReportExportStatus } from './VideoAnalysisReport';
import { MarkdownRenderer } from './analysis';

type AnalysisType = AnalysisRequest | ProfileAnalysisRequest;

interface AnalysisResultCardProps {
  analysis: AnalysisType;
  variant: 'video' | 'profile';
  highlight?: boolean;
  loading?: boolean;
}

/* ---------- Section Parsing ---------- */

type ParsedSection = {
  id: string;
  title: string;
  icon: string;
  lines: string[];
};

const SECTION_CONFIG: Record<string, { aliases: string[]; icon: string }> = {
  'Executive Summary': {
    aliases: ['executive summary', 'summary', 'overview', 'tldr', 'tl;dr'],
    icon: '📋',
  },
  'Key Insights': {
    aliases: ['key insights', 'insights', 'findings', 'highlights', 'key findings'],
    icon: '💡',
  },
  Recommendations: {
    aliases: ['recommendations', 'next steps', 'suggestions', 'improvements', 'action items'],
    icon: '🎯',
  },
  'Content Analysis': {
    aliases: ['scene breakdown', 'scenes', 'timeline', 'chapters', 'content analysis', 'video analysis'],
    icon: '🎬',
  },
  'Audience & Engagement': {
    aliases: ['audience', 'engagement', 'retention', 'demographics', 'viewer'],
    icon: '👥',
  },
  'Risks & Limitations': {
    aliases: ['risks', 'limitations', 'constraints', 'issues', 'concerns'],
    icon: '⚠️',
  },
  Transcript: {
    aliases: ['transcript', 'full transcript', 'captions'],
    icon: '📝',
  },
};

const HEADING_MATCHER = new RegExp(
  `^\\s*(?:\\d+\\.|[-*•]|—)?\\s*(${Object.values(SECTION_CONFIG)
    .flatMap((c) => c.aliases)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})\\b[\\s:–—-]*`,
  'i'
);

function canonicalSection(raw: string): { title: string; icon: string } {
  const lower = raw.toLowerCase();
  for (const [title, config] of Object.entries(SECTION_CONFIG)) {
    if (config.aliases.some((a) => lower.includes(a))) {
      return { title, icon: config.icon };
    }
  }
  return { title: raw.replace(/^\w/, (c) => c.toUpperCase()), icon: '📌' };
}

function parseAnalysisSections(text: string): ParsedSection[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const sections: ParsedSection[] = [];
  let currentTitle = 'Executive Summary';
  let currentIcon = '📋';
  let current: string[] = [];

  const pushCurrent = () => {
    if (!current.length) return;
    const id = currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    sections.push({ id, title: currentTitle, icon: currentIcon, lines: current.slice() });
    current = [];
  };

  for (const line of lines) {
    const m = line.match(HEADING_MATCHER);
    if (m) {
      pushCurrent();
      const { title, icon } = canonicalSection(m[1]);
      currentTitle = title;
      currentIcon = icon;
    } else {
      current.push(line);
    }
  }
  pushCurrent();

  // If only one unnamed bucket, treat as "no sections"
  if (sections.length === 1 && sections[0].title === 'Executive Summary') return [];

  // Merge duplicate titles
  const merged: Record<string, ParsedSection> = {};
  for (const s of sections) {
    const key = s.title;
    if (!merged[key]) merged[key] = { ...s };
    else merged[key].lines.push(...s.lines);
  }
  return Object.values(merged);
}

/* ---------- Components ---------- */

function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">{label}</p>
      <div className="mt-1 text-sm text-white/90">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  id,
  defaultExpanded = true,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  id: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section
      id={id}
      className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.04] to-white/[.02] overflow-hidden transition-all hover:border-white/15"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[.02] transition-colors"
        aria-expanded={expanded}
        aria-controls={`${id}-content`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <h4 className="text-sm font-semibold tracking-wide text-white/90">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`#${id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-white/30 hover:text-white/50 transition-colors"
            title="Copy link to section"
          >
            #
          </a>
          <svg
            className={clsx(
              'w-4 h-4 text-white/40 transition-transform duration-200',
              expanded && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div
        id={`${id}-content`}
        className={clsx(
          'transition-all duration-300 ease-out overflow-hidden',
          expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-5 pt-1">{children}</div>
      </div>
    </section>
  );
}

function TocChips({ sections, activeId }: { sections: ParsedSection[]; activeId?: string }) {
  if (!sections.length) return null;

  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Section navigation">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all',
            activeId === s.id
              ? 'border-[#2ce695]/40 bg-[#2ce695]/10 text-[#2ce695]'
              : 'border-white/10 bg-white/[.04] text-white/70 hover:bg-white/[.08] hover:border-white/20'
          )}
        >
          <span>{s.icon}</span>
          <span>{s.title}</span>
        </a>
      ))}
    </nav>
  );
}

function StatusBadge({ status, style }: { status: string; style: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold',
        style
      )}
      aria-live="polite"
    >
      {status === 'COMPLETED' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'PROCESSING' && (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {status}
    </span>
  );
}

/* ---------- Main Component ---------- */

export default function AnalysisResultCard({
  analysis,
  variant,
  highlight = false,
  loading = false,
}: AnalysisResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'markdown' | 'raw'>('structured');
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const menuBtnId = useId();
  const toast = useToast();

  const status = (
    typeof analysis.status === 'string' ? analysis.status.toUpperCase() : analysis.status
  ) as keyof typeof STATUS_STYLES;
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
    () =>
      analysis.customPrompt || (variant === 'video' ? 'Default Zlyzer brief' : 'Default profile brief'),
    [analysis.customPrompt, variant]
  );

  const summaryText = useMemo(() => {
    if (variant === 'profile') {
      return analysis.profileResult?.analysisResult ?? analysis.result?.analysisResult ?? null;
    }
    return analysis.result?.analysisResult ?? null;
  }, [analysis, variant]);

  const hasResult = Boolean(summaryText);

  const parsedSections = useMemo(() => {
    if (!summaryText) return [];
    return parseAnalysisSections(summaryText);
  }, [summaryText]);

  const failureMessage = useMemo(
    () =>
      status === 'FAILED' ? analysis.errorMessage || 'Analysis failed — please try again later.' : null,
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

  const handleExportReport = useCallback(async () => {
    if (variant !== 'video' || !hasResult || loading) return;
    setExportingReport(true);
    try {
      const exportStatus: ReportExportStatus = exportVideoAnalysisReport(analysis as AnalysisRequest);
      if (exportStatus === 'anchor') {
        toast.info('Report download opened. If you do not see it, enable pop-ups for this site.');
      } else {
        toast.success('Report opened in a new tab. Use your browser to save it as PDF.');
      }
    } catch (error) {
      console.error('Report export failed:', error);
      toast.error("We couldn't build the report. Please try again.");
    } finally {
      setExportingReport(false);
      setShowExportMenu(false);
    }
  }, [analysis, variant, hasResult, loading, toast]);

  // Short preview for quick scan
  const preview = useMemo(() => {
    if (!summaryText) return '';
    const hardStop = 350;
    const firstBreak = summaryText.indexOf('\n\n');
    const cut = firstBreak > -1 && firstBreak < hardStop ? firstBreak : hardStop;
    return summaryText.length > cut ? summaryText.slice(0, cut).trim() + '…' : summaryText.trim();
  }, [summaryText]);

  return (
    <section
      className={clsx(
        'rounded-2xl border bg-gradient-to-br from-white/[.05] to-white/[.02] p-6 shadow-[0_24px_80px_rgba(12,22,38,0.45)] backdrop-blur transition-all',
        highlight ? 'border-[#2ce695]/40 ring-1 ring-[#2ce695]/20' : 'border-white/10'
      )}
      aria-label={`Analysis result for ${variant === 'video' ? 'video' : 'profile'}`}
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={status} style={statusStyle} />
            <a
              href={anchorHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-[#2ce695] hover:text-[#7affd0] transition-colors"
              title={anchorLabel}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {variant === 'video' ? 'Open video' : 'Open profile'}
            </a>
          </div>
          <p className="text-xs text-white/40 mb-0.5">Request ID</p>
          <p className="font-mono text-[12px] text-white/60 break-all">{analysis.id}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!hasResult || loading}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
              copied
                ? 'bg-[#2ce695]/20 text-[#2ce695]'
                : 'text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label="Copy analysis to clipboard"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              id={menuBtnId}
              onClick={() => setShowExportMenu((v) => !v)}
              disabled={!hasResult || loading}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-haspopup="menu"
              aria-expanded={showExportMenu}
              aria-controls={`${menuBtnId}-menu`}
              title="Export analysis"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div
                id={`${menuBtnId}-menu`}
                role="menu"
                aria-labelledby={menuBtnId}
                className="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#132e53]/95 backdrop-blur-md shadow-xl"
              >
                {variant === 'video' && (
                  <button
                    role="menuitem"
                    onClick={handleExportReport}
                    disabled={!hasResult || loading || exportingReport}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-base">📑</span>
                    {exportingReport ? 'Preparing...' : 'Export PDF Report'}
                  </button>
                )}
                <button
                  role="menuitem"
                  onClick={handleExportText}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors"
                >
                  <span className="text-base">📄</span>
                  Export as Text
                </button>
                <button
                  role="menuitem"
                  onClick={handleExportJSON}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors"
                >
                  <span className="text-base">📊</span>
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Meta Grid */}
      <div className="mt-5 grid gap-4 grid-cols-2 sm:grid-cols-4 p-4 rounded-xl bg-black/20 border border-white/5">
        <MetaItem label={variant === 'video' ? 'Video' : 'Profile'}>
          <a
            href={anchorHref}
            target="_blank"
            rel="noreferrer noopener"
            className="break-all text-[#2ce695] hover:text-[#7affd0] transition-colors text-xs"
          >
            {anchorLabel.length > 40 ? anchorLabel.slice(0, 40) + '...' : anchorLabel}
          </a>
        </MetaItem>
        <MetaItem label="Created">{formatDate(analysis.createdAt)}</MetaItem>
        <MetaItem label="Processing">
          {processingSeconds != null ? `${processingSeconds}s` : '—'}
        </MetaItem>
        <MetaItem label="Prompt">
          <span className="inline-block max-w-full truncate text-xs" title={promptLabel}>
            {promptLabel.length > 30 ? promptLabel.slice(0, 30) + '...' : promptLabel}
          </span>
        </MetaItem>
      </div>

      {/* Analysis Panel */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <span className="text-[#2ce695]">✦</span> AI Analysis
          </h3>

          {/* View Mode Toggle */}
          {hasResult && !loading && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {(['structured', 'markdown', 'raw'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={clsx(
                    'px-3 py-1 text-[11px] font-medium rounded-md transition-all capitalize',
                    viewMode === mode
                      ? 'bg-[#2ce695]/20 text-[#2ce695]'
                      : 'text-white/50 hover:text-white/70'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !hasResult && (
          <div
            className="p-5 rounded-xl border border-white/10 bg-black/20 space-y-3"
            aria-busy="true"
            aria-live="polite"
          >
            {Array.from({ length: SKELETON_LOADING_ROWS }, (_, idx) => (
              <div
                key={idx}
                className="h-3 rounded bg-white/10 animate-pulse"
                style={{ width: `${85 - idx * 8}%` }}
              />
            ))}
            <p className="text-xs text-white/40 mt-4 flex items-center gap-2">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Processing... fetching updates every second.
            </p>
          </div>
        )}

        {/* Error State */}
        {failureMessage && (
          <div
            className="p-5 rounded-xl border border-rose-400/30 bg-rose-500/10 text-sm text-rose-200"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{failureMessage}</span>
            </div>
          </div>
        )}

        {/* Result Content */}
        {hasResult && summaryText && !failureMessage && (
          <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            {/* Preview (collapsed) */}
            {!expanded && (
              <div className="p-5">
                <p className="text-sm leading-relaxed text-white/85">{sanitizeText(preview)}</p>
                {summaryText.length > preview.length && (
                  <button
                    onClick={() => setExpanded(true)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-[#2ce695] hover:text-[#7affd0] font-medium transition-colors"
                    aria-expanded={expanded}
                    aria-controls="analysis-full"
                  >
                    <span>Read full analysis</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Full Content (expanded) */}
            {expanded && (
              <div id="analysis-full" className="p-5">
                {/* Structured View */}
                {viewMode === 'structured' && parsedSections.length > 0 && (
                  <>
                    <TocChips sections={parsedSections} />
                    <div className="space-y-4">
                      {parsedSections.map((s, idx) => (
                        <SectionCard
                          key={s.id}
                          id={s.id}
                          title={s.title}
                          icon={s.icon}
                          defaultExpanded={idx < 3}
                        >
                          <MarkdownRenderer content={s.lines.join('\n')} />
                        </SectionCard>
                      ))}
                    </div>
                  </>
                )}

                {/* Markdown View */}
                {(viewMode === 'markdown' || (viewMode === 'structured' && !parsedSections.length)) && (
                  <MarkdownRenderer content={summaryText} />
                )}

                {/* Raw View */}
                {viewMode === 'raw' && (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white/80 font-mono">
                    {sanitizeText(summaryText)}
                  </pre>
                )}

                {/* Collapse Button */}
                <button
                  onClick={() => setExpanded(false)}
                  className="mt-6 inline-flex items-center gap-2 text-sm text-[#2ce695] hover:text-[#7affd0] font-medium transition-colors"
                >
                  <svg
                    className="w-4 h-4 rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span>Show less</span>
                </button>
              </div>
            )}

            {/* Short content - always show full */}
            {!expanded && summaryText.length <= preview.length && parsedSections.length > 0 && (
              <div className="p-5 border-t border-white/5">
                {viewMode === 'structured' && (
                  <>
                    <TocChips sections={parsedSections} />
                    <div className="space-y-4">
                      {parsedSections.map((s) => (
                        <SectionCard key={s.id} id={s.id} title={s.title} icon={s.icon}>
                          <MarkdownRenderer content={s.lines.join('\n')} />
                        </SectionCard>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Result State */}
        {!hasResult && !loading && !failureMessage && (
          <div className="p-6 rounded-xl border border-white/10 bg-black/20 text-center">
            <p className="text-sm text-white/50">No analysis available yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}
