// hooks/useDashboard.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboard } from '../lib/apiClient';
import type { DashboardData } from '../types/api';

export function useDashboard(autoFetch = true) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasDataRef = useRef(false);

  const fetchDashboard = useCallback(async ({ preserveData = false }: { preserveData?: boolean } = {}) => {
    const useRefreshing = preserveData && hasDataRef.current;

    try {
      if (useRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const dashboardData = await getDashboard();
      setData(dashboardData);
      hasDataRef.current = true;
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      if (useRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      void fetchDashboard();
    }
  }, [autoFetch, fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard,
    refreshing,
  };
}
