// Component to display analysis history
import React, { useMemo } from 'react';
import AnalysisResultCard from './AnalysisResultCard';
import type { AnalysisRequest, ProfileAnalysisRequest } from '../types/api';

interface AnalysisHistoryProps {
  history: (AnalysisRequest | ProfileAnalysisRequest)[];
  currentResult: AnalysisRequest | ProfileAnalysisRequest | null;
  variant: 'video' | 'profile';
  resultRef: React.RefObject<HTMLDivElement | null>;
  currentStatus: string;
}

export default function AnalysisHistory({
  history,
  currentResult,
  variant,
  resultRef,
  currentStatus,
}: AnalysisHistoryProps) {
  const filteredHistory = useMemo(
    () => history.filter((entry) => entry.id !== currentResult?.id),
    [history, currentResult?.id]
  );

  const showHistory = filteredHistory.length > 0;
  const historyTitle = variant === 'video' ? 'Previous analyses' : 'Previous profile analyses';

  if (!currentResult && history.length === 0) {
    return null;
  }

  return (
    <div ref={resultRef} className={variant === 'video' ? 'mt-12 space-y-6 text-left' : 'mt-8 space-y-6'}>
      {currentResult && (
        <AnalysisResultCard
          analysis={currentResult}
          variant={variant}
          loading={currentStatus === 'queued' || currentStatus === 'processing'}
          highlight
        />
      )}

      {showHistory && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
            {historyTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filteredHistory.map((analysis) => (
              <AnalysisResultCard key={analysis.id} analysis={analysis} variant={variant} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

