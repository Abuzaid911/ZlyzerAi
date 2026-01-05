// components/dashboard/QuotaRow.tsx
import { memo } from 'react';

// Brand colors
const BRAND_GREEN = '#2ce695';

interface QuotaRowProps {
  loading: boolean;
  error: string | null;
  free?: number;
  paid?: number;
  total?: number;
  onRefresh: () => void;
  refreshing: boolean;
}

/**
 * Displays quota metrics (free, paid, total) with loading and error states
 */
export const QuotaRow = memo(function QuotaRow({
  loading,
  error,
  free = 0,
  paid = 0,
  total = 0,
  onRefresh,
  refreshing,
}: QuotaRowProps) {
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
});

/**
 * Individual metric card with label, value, and progress bar
 */
const MetricCard = memo(function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md p-5 hover:bg-white/[.06] transition-all">
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-3 h-1.5 w-full rounded bg-white/10 overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: '65%',
            background: `linear-gradient(90deg, ${BRAND_GREEN}, rgba(44,230,149,.35))`,
            boxShadow: '0 0 10px rgba(44,230,149,.35)',
          }}
        />
      </div>
    </div>
  );
});

