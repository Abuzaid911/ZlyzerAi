// pages/Dashboard.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { getAnalysis } from '../lib/apiClient';
import type { AnalysisRequest } from '../types/api';
import clsx from 'clsx';

// Brand colors
const BRAND = {
  green: '#2ce695',
  bg1: '#132e53',
  bg2: '#191e29',
};

// Normalize different hook shapes into one interface
function normalizeDashboardHook(d: any) {
  const loading = d?.isLoading ?? d?.loading ?? false;
  // prefer explicit .isError, otherwise pass through string/null
  const error =
    (d?.isError ? d?.error : d?.error) ??
    null;
  const data = d?.data ?? null;
  const refetch = d?.refetch ?? (() => {});
  const refreshing = d?.isFetching ?? d?.refreshing ?? false;
  return { data, loading, error, refetch, refreshing };
}

// ----------------------------- Main Page -----------------------------

export default function Dashboard() {
  const raw = useDashboard() as any;
  const { data, loading, error, refetch, refreshing } = normalizeDashboardHook(raw);

  const [openPanel, setOpenPanel] = useState(false);
  const [active, setActive] = useState<AnalysisRequest | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailCache = useRef<Map<string, AnalysisRequest>>(new Map());
  const pendingDetails = useRef<Map<string, Promise<AnalysisRequest>>>(new Map());

  const rows = useMemo(() => data?.reqs ?? [], [data?.reqs]);

  const getDetail = useCallback((req: AnalysisRequest) => {
    const cached = detailCache.current.get(req.id);
    if (cached) {
      return Promise.resolve(cached);
    }

    const inflight = pendingDetails.current.get(req.id);
    if (inflight) {
      return inflight;
    }

    const request = getAnalysis(req.id)
      .then((full) => {
        detailCache.current.set(req.id, full);
        return full;
      })
      .finally(() => {
        pendingDetails.current.delete(req.id);
      });

    pendingDetails.current.set(req.id, request);
    return request;
  }, []);

  const onRowClick = useCallback((req: AnalysisRequest) => {
    setDetailError(null);
    setOpenPanel(true);

    const cached = detailCache.current.get(req.id);
    if (cached) {
      setActive(cached);
      setLoadingDetail(false);
      return;
    }

    setActive(req);
    setLoadingDetail(true);

    getDetail(req)
      .then((full) => {
        setActive(full);
        setLoadingDetail(false);
      })
      .catch((e: any) => {
        setDetailError(e?.message ?? 'Failed to load details');
        setLoadingDetail(false);
      });
  }, [getDetail]);

  const handleRefresh = useCallback(() => {
    if (typeof refetch === 'function') {
      return refetch({ preserveData: true });
    }
    return undefined;
  }, [refetch]);

  const closePanel = () => {
    setOpenPanel(false);
    setTimeout(() => setActive(null), 200);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)] text-white">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Your Dashboard
          </h1>
          <p className="text-white/70 mt-2">
            Track requests, quotas, and results. Click any row to view the analysis.
          </p>
        </header>

        {/* Quotas */}
        <QuotaRow
          loading={loading}
          error={
            typeof error === 'string'
              ? error
              : (error as any)?.message ?? null
          }
          free={data?.videoAnalysisFreeQuota}
          paid={data?.videoAnalysisPaidQuota}
          total={data?.numReqs}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        {/* Table */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md">
          <RequestTable
            loading={loading}
            error={!!error}
            rows={rows}
            onClickRow={onRowClick}
            refreshing={refreshing}
          />
        </div>
      </section>

      {/* Side Panel */}
      <SidePanel open={openPanel} onClose={closePanel}>
        <ResultPanelContent
          request={active}
          loading={loadingDetail}
          error={detailError}
        />
      </SidePanel>
    </main>
  );
}

// ----------------------------- Quotas -----------------------------

function QuotaRow({
  loading,
  error,
  free = 0,
  paid = 0,
  total = 0,
  onRefresh,
  refreshing,
}: {
  loading: boolean;
  error: string | null;
  free?: number;
  paid?: number;
  total?: number;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/[.06] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-rose-500/10 text-rose-200 p-4 flex items-center justify-between">
        <div>{error}</div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded-lg border border-rose-200/30 px-3 py-1.5 hover:bg-rose-200/10 transition"
        >
          {refreshing ? 'Refreshing...' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Free quota" value={String(free)} />
        <MetricCard label="Paid quota" value={String(paid)} />
        <MetricCard label="Total requests" value={String(total)} />
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="absolute -top-3 right-0 flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/[.1] transition disabled:opacity-60"
      >
        {refreshing && (
          <svg
            className="h-3 w-3 animate-spin text-[#2ce695]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 4v2m5.657 0.343l-1.414 1.414M20 12h-2m-0.343 5.657l-1.414-1.414M12 20v-2m-5.657 0.343l1.414-1.414M4 12h2m0.343-5.657l1.414 1.414" />
          </svg>
        )}
        {refreshing ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md p-5 hover:bg-white/[.06] transition-all">
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-3 h-1.5 w-full rounded bg-white/10 overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: '65%',
            background: `linear-gradient(90deg, ${BRAND.green}, rgba(44,230,149,.35))`,
            boxShadow: '0 0 10px rgba(44,230,149,.35)',
          }}
        />
      </div>
    </div>
  );
}

// ----------------------------- Table -----------------------------

const VIRTUAL_ROW_HEIGHT = 72;
const VIRTUAL_OVERSCAN = 6;

function RequestTable({
  rows,
  loading,
  error,
  onClickRow,
  refreshing,
}: {
  rows: AnalysisRequest[];
  loading: boolean;
  error: boolean;
  onClickRow: (r: AnalysisRequest) => void;
  refreshing: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState({ start: 0, end: Math.min(rows.length, 20) });
  const [containerHeight, setContainerHeight] = useState(0);

  const updateRange = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const baseCount = el.clientHeight ? Math.ceil(el.clientHeight / VIRTUAL_ROW_HEIGHT) : 10;
    const scrollTop = el.scrollTop;
    const firstVisible = Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT);
    const start = Math.max(0, firstVisible - VIRTUAL_OVERSCAN);
    const end = Math.min(rows.length, start + baseCount + VIRTUAL_OVERSCAN * 2);

    setRange((prev) => {
      if (prev.start === start && prev.end === end) {
        return prev;
      }
      return { start, end };
    });
  }, [rows.length]);

  const handleScroll = useCallback(() => {
    updateRange();
  }, [updateRange]);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      setContainerHeight(node.clientHeight);
      updateRange();
    }
  }, [updateRange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight);
      updateRange();
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [updateRange]);

  useEffect(() => {
    if (!rows.length) {
      setRange({ start: 0, end: 0 });
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      return;
    }

    const baseCount = containerHeight ? Math.ceil(containerHeight / VIRTUAL_ROW_HEIGHT) : 10;
    setRange({ start: 0, end: Math.min(rows.length, baseCount + VIRTUAL_OVERSCAN * 2) });
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [rows, containerHeight]);

  const visibleRows = useMemo(() => rows.slice(range.start, range.end), [rows, range]);
  const totalHeight = rows.length * VIRTUAL_ROW_HEIGHT;
  const topPadding = range.start * VIRTUAL_ROW_HEIGHT;
  const renderedHeight = visibleRows.length * VIRTUAL_ROW_HEIGHT;
  const bottomPadding = Math.max(0, totalHeight - topPadding - renderedHeight);

  if (loading) {
    return (
      <div className="p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-white/10">
            <div className="w-8 h-5 rounded bg-white/10 animate-pulse" />
            <div className="flex-1 h-5 rounded bg-white/10 animate-pulse" />
            <div className="w-24 h-6 rounded bg-white/10 animate-pulse" />
            <div className="w-28 h-5 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-rose-200">Failed to load requests.</div>;
  }

  if (!rows?.length) {
    return (
      <div className="p-6 text-white/70 text-center">
        <p className="mb-2">No requests yet.</p>
        <p className="text-sm text-white/50">Try analyzing a TikTok URL to see your results here.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-white/70">
          <tr className="border-b border-white/10">
            <Th>ID</Th>
            <Th>Video URL</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </tr>
        </thead>
      </table>
      <div
        ref={setContainerRef}
        className="max-h-[28rem] overflow-y-auto"
        onScroll={handleScroll}
      >
        <table className="min-w-full text-sm">
          <tbody>
            {topPadding > 0 && (
              <tr aria-hidden style={{ height: topPadding }}>
                <td colSpan={4} />
              </tr>
            )}
            {visibleRows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/[.04] cursor-pointer transition-colors"
                onClick={() => onClickRow(r)}
                style={{ height: VIRTUAL_ROW_HEIGHT }}
              >
                <Td mono className="max-w-[160px] truncate">{r.id}</Td>
                <Td className="max-w-[420px] truncate">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/90 hover:text-[#2ce695] underline decoration-white/20 hover:decoration-[#2ce695] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {r.url}
                  </a>
                </Td>
                <Td><StatusChip status={r.status} /></Td>
                <Td mono>{formatDate(r.createdAt)}</Td>
              </tr>
            ))}
            {bottomPadding > 0 && (
              <tr aria-hidden style={{ height: bottomPadding }}>
                <td colSpan={4} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {refreshing && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end bg-black/20">
          <div className="mb-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#132e53]/80 px-3 py-1.5 text-xs text-white/70">
            <svg
              className="h-3 w-3 animate-spin text-[#2ce695]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 4v2m5.657.343-1.414 1.414M20 12h-2m-.343 5.657-1.414-1.414M12 20v-2m-5.657.343 1.414-1.414M4 12h2m.343-5.657 1.414 1.414" />
            </svg>
            Refreshing data…
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-4 py-3">{children}</th>;
}

function Td({
  children,
  className,
  mono,
}: {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <td className={clsx("px-4 py-3 align-middle", mono && "font-mono tracking-tight text-xs", className)}>
      {children}
    </td>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-white/5', text: 'text-white/70' },
    PROCESSING: { bg: 'bg-white/5', text: 'text-white/70' },
    CACHED: { bg: 'bg-[rgba(44,230,149,0.12)]', text: 'text-[#2ce695]' },
    COMPLETED: { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
    FAILED: { bg: 'bg-rose-500/10', text: 'text-rose-300' },
  };
  const s = map[status] || map.PENDING;
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', s.bg, s.text)}>
      {status}
    </span>
  );
}

// ----------------------------- Side Panel -----------------------------

function SidePanel({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
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

function ResultPanelContent({
  request,
  loading,
  error,
}: {
  request: AnalysisRequest | null;
  loading: boolean;
  error: string | null;
}) {
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
          {request.result?.tiktokVideoId && (
            <Meta label="Video ID" value={request.result.tiktokVideoId} mono />
          )}
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

function Meta({
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
      <div className={clsx('text-sm text-white/90 truncate', mono && 'font-mono text-xs')}>
        {value}
      </div>
    </div>
  );
}

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

function formatDate(d?: Date | string) {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(d);
  }
}
