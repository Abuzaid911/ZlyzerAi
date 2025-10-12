// hooks/useCreateProfileAnalysis.ts
import { createProfileAnalysis, getProfileAnalysis } from '../lib/apiClient';
import type { ProfileAnalysisRequest, CreateAnalysisResponse } from '../types/api';
import { usePollingAnalysis } from './usePollingAnalysis';

export function useCreateProfileAnalysis() {
  const { submit, ...rest } = usePollingAnalysis<ProfileAnalysisRequest, CreateAnalysisResponse>({
    createFn: createProfileAnalysis,
    getFn: getProfileAnalysis,
  });

  return {
    submitProfile: submit,
    ...rest,
  };
}
