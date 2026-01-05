// components/dashboard/RequestTable.tsx
import React, { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import clsx from 'clsx';
import type { AnalysisRequest } from '../../types/api';
import { formatDate } from '../../utils/formatters';

const VIRTUAL_ROW_HEIGHT = 72;
const VIRTUAL_OVERSCAN = 6;

interface RequestTableProps {
  rows: AnalysisRequest[];
  loading: boolean;
  error: boolean;
  onClickRow: (r: AnalysisRequest) => void;
  refreshing: boolean;
}

/**
 * Virtualized table for displaying analysis requests
 */
export function RequestTable({
  rows,
  loading,
  error,
  onClickRow,
  refreshing,
}: RequestTableProps) {
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

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        setContainerHeight(node.clientHeight);
        updateRange();
      }
    },
    [updateRange]
  );

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
            <Th>Video URL</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </tr>
        </thead>
      </table>
      <div ref={setContainerRef} className="max-h-[28rem] overflow-y-auto" onScroll={handleScroll}>
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
                <Td>
                  <StatusChip status={r.status} />
                </Td>
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
    <td className={clsx('px-4 py-3 align-middle', mono && 'font-mono tracking-tight text-xs', className)}>
      {children}
    </td>
  );
}

/**
 * Status chip with color coding
 */
export const StatusChip = memo(function StatusChip({ status }: { status: string }) {
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
});

