// components/AnalysisHistory.tsx
import React, { useMemo } from "react";
import AnalysisResultCard from "./AnalysisResultCard";
import type { AnalysisRequest, ProfileAnalysisRequest } from "../types/api";

type AnalysisItem = AnalysisRequest | ProfileAnalysisRequest;
type Variant = "video" | "profile";
type PollStatus = "idle" | "queued" | "processing" | "completed" | "failed";

interface AnalysisHistoryProps {
  history: AnalysisItem[];
  currentResult: AnalysisItem | null;
  variant: Variant;
  resultRef: React.RefObject<HTMLDivElement>; // null allowed at runtime
  currentStatus: PollStatus;
}

export default function AnalysisHistory({
  history,
  currentResult,
  variant,
  resultRef,
  currentStatus,
}: AnalysisHistoryProps) {
  const filteredHistory = useMemo(() => {
    const currentId = currentResult?.id;
    // keep only items with ids and not equal to current
    const base = history.filter((e): e is AnalysisItem & { id: string } => Boolean(e?.id));
    // sort desc by createdAt if available, fallback to stable order
    const sorted = [...base].sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });
    return currentId ? sorted.filter((e) => e.id !== currentId) : sorted;
  }, [history, currentResult?.id]);

  const showHistory = filteredHistory.length > 0;
  const historyTitleId = "analysis-history-title";
  const historyTitle =
    variant === "video" ? "Previous analyses" : "Previous profile analyses";

  if (!currentResult && history.length === 0) return null;

  return (
    <div
      ref={resultRef}
      className={variant === "video" ? "mt-12 space-y-6 text-left" : "mt-8 space-y-6"}
      role="region"
      aria-labelledby={showHistory ? historyTitleId : undefined}
    >
      {currentResult && (
        <AnalysisResultCard
          analysis={currentResult}
          variant={variant}
          loading={currentStatus === "queued" || currentStatus === "processing"}
          highlight
        />
      )}

      {showHistory && (
        <div>
          <h2
            id={historyTitleId}
            className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50"
          >
            {historyTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {filteredHistory.map((analysis) => (
              <AnalysisResultCard
                key={analysis.id} // guaranteed defined by filter
                analysis={analysis}
                variant={variant}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
