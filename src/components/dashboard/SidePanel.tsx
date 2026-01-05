// components/dashboard/SidePanel.tsx
import React, { useState, memo } from 'react';
import clsx from 'clsx';
import type { AnalysisRequest } from '../../types/api';
import { formatDate } from '../../utils/formatters';
import { StatusChip } from './RequestTable';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Slide-in side panel with backdrop
 */
export function SidePanel({ open, onClose, children }: SidePanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={clsx(
          'fixed top-0 right-0 z-50 h-full w-full max-w-2xl',
          'bg-[linear-gradient(180deg,rgba(25,30,41,.98),rgba(19,46,83,.96))] border-l border-white/10',
          'transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-white/5">
          <h3 className="text-lg font-semibold">Analysis Result</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-64px)] overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}

interface ResultPanelContentProps {
  request: AnalysisRequest | null;
  loading: boolean;
  error: string | null;
}

/**
 * Content for the analysis result side panel
 */
export function ResultPanelContent({ request, loading, error }: ResultPanelContentProps) {
  if (!request) {
    return (
      <div className="p-6 text-center text-white/70">
        <p>Select a request to view details.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Meta Information */}
      <div className="rounded-xl border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-white/70 font-medium">STATUS</div>
          <StatusChip status={request.status} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Meta label="Request ID" value={request.id} mono />
          <Meta label="Created" value={formatDate(request.createdAt)} />
          {request.result?.processingTime != null && (
            <Meta label="Processing time" value={`${request.result.processingTime}s`} />
          )}
          {request.result?.tiktokVideoId && <Meta label="Video ID" value={request.result.tiktokVideoId} mono />}
        </div>
      </div>

      {/* Analysis Result */}
      <div className="rounded-xl border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-white/70 font-medium">ANALYSIS RESULT</div>
          <CopyButton text={request.result?.analysisResult ?? ''} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-300">
            <p className="font-medium mb-1">Error loading details:</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : request.result?.analysisResult ? (
          <div className="rounded-lg bg-black/20 p-4 border border-white/5">
            <pre className="whitespace-pre-wrap leading-relaxed text-sm text-white/90 font-sans">
              {request.result.analysisResult}
            </pre>
          </div>
        ) : request.status === 'FAILED' ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-400/20 text-rose-300">
            <p>This analysis failed. {request.errorMessage || 'Please try again with another video.'}</p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-white/5 text-white/70">
            <p>No result yet. If this request is stuck, please try again later or contact support.</p>
          </div>
        )}
      </div>

      {/* Video URL */}
      <div className="rounded-xl border border-white/10 bg-white/[.04] p-5 backdrop-blur-sm">
        <div className="text-sm text-white/70 font-medium mb-2">VIDEO URL</div>
        <a
          href={request.url}
          target="_blank"
          rel="noreferrer"
          className="text-[#2ce695] hover:text-[#3ef9a9] underline decoration-[#2ce695]/30 hover:decoration-[#2ce695] transition-all break-all"
        >
          {request.url}
        </a>
      </div>
    </div>
  );
}

/**
 * Metadata display row
 */
const Meta = memo(function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">{label}</div>
      <div className={clsx('text-sm text-white/90 truncate', mono && 'font-mono text-xs')}>{value}</div>
    </div>
  );
});

/**
 * Copy to clipboard button
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all',
        copied
          ? 'border-emerald-300 text-emerald-300 bg-emerald-500/10'
          : 'border-white/15 text-white/80 hover:bg-white/5 hover:border-white/30'
      )}
      disabled={!text}
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </span>
      ) : (
        'Copy'
      )}
    </button>
  );
}

