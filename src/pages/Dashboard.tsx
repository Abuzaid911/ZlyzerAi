// pages/Dashboard.tsx
import { useState, useMemo, useCallback, useRef } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { getAnalysis } from '../lib/apiClient';
import type { AnalysisRequest } from '../types/api';
import { QuotaRow, RequestTable, SidePanel, ResultPanelContent } from '../components/dashboard';

/**
 * Normalize different hook shapes into one interface
 */
function normalizeDashboardHook(d: unknown) {
  const raw = d as Record<string, unknown> | null | undefined;
  const loading = raw?.isLoading ?? raw?.loading ?? false;
  const error = (raw?.isError ? raw?.error : raw?.error) ?? null;
  const data = raw?.data ?? null;
  const refetch = raw?.refetch ?? (() => {});
  const refreshing = raw?.isFetching ?? raw?.refreshing ?? false;
  return { data, loading, error, refetch, refreshing } as {
    data: { reqs?: AnalysisRequest[]; videoAnalysisFreeQuota?: number; videoAnalysisPaidQuota?: number; numReqs?: number } | null;
    loading: boolean;
    error: unknown;
    refetch: (opts?: { preserveData?: boolean }) => void;
    refreshing: boolean;
  };
}

/**
 * Dashboard page showing user quotas and analysis history
 */
export default function Dashboard() {
  const raw = useDashboard();
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

  const onRowClick = useCallback(
    (req: AnalysisRequest) => {
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
        .catch((e: Error) => {
          setDetailError(e?.message ?? 'Failed to load details');
          setLoadingDetail(false);
        });
    },
    [getDetail]
  );

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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Your Dashboard</h1>
          <p className="text-white/70 mt-2">Track requests, quotas, and results. Click any row to view the analysis.</p>
        </header>

        {/* Quotas */}
        <QuotaRow
          loading={loading as boolean}
          error={typeof error === 'string' ? error : (error as Error | null)?.message ?? null}
          free={data?.videoAnalysisFreeQuota}
          paid={data?.videoAnalysisPaidQuota}
          total={data?.numReqs}
          onRefresh={handleRefresh}
          refreshing={refreshing as boolean}
        />

        {/* Table */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-md">
          <RequestTable
            loading={loading as boolean}
            error={!!error}
            rows={rows}
            onClickRow={onRowClick}
            refreshing={refreshing as boolean}
          />
        </div>
      </section>

      {/* Side Panel */}
      <SidePanel open={openPanel} onClose={closePanel}>
        <ResultPanelContent request={active} loading={loadingDetail} error={detailError} />
      </SidePanel>
    </main>
  );
}
