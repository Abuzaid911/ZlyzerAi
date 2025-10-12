// hooks/useCreateAnalysis.ts
import { createAnalysis, getAnalysis } from '../lib/apiClient';
import type { AnalysisRequest, CreateAnalysisResponse } from '../types/api';
import { usePollingAnalysis } from './usePollingAnalysis';

export function useCreateAnalysis() {
  const { submit, ...rest } = usePollingAnalysis<AnalysisRequest, CreateAnalysisResponse>({
    createFn: createAnalysis,
    getFn: getAnalysis,
  });

  return {
    submitAnalysis: submit,
    ...rest,
  };
}
