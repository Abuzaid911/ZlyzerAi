// types/api.ts
// Type definitions aligned to the uploaded Elysia documentation spec:contentReference[oaicite:1]{index=1}

/** Server-status values are UPPERCASE on the wire */
export type AnalysisStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CACHED'
  | 'COMPLETED'
  | 'FAILED';

/** Single-video analysis result (returned on GET /api/analysis-requests/{id}) */
export interface AnalysisResult {
  id: string;
  tiktokVideoId: string;
  analysisResult: string;
  analysisMetadata: Record<string, any>;
  processingTime: number; // ms
  createdAt: Date;
}

/** Profile (batch) analysis result shape (when present on GET /api/analysis-requests/{id}) */
export interface ProfileVideoItem {
  title: string | null;
  description: string | null;
  duration: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  processingTime: number;
  analysisResult: string;
  analyzedAt: Date | string | number;
}

export interface ProfileResult {
  analysisResult?: string;
  processingTime: number;
  createdAt: Date | string | number;
  videos: ProfileVideoItem[];
}

export interface AnalysisRequest {
  id: string;
  userId: string | null;
  type: string;               // as provided by backend
  url: string;                // video/profile URL (or identifier)
  status: AnalysisStatus;     // UPPERCASE per server
  customPrompt: string | null;
  videoResultId: string | null;
  profileResultId: string | null; // <-- present in API responses:contentReference[oaicite:2]{index=2}
  errorMessage?: string;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;

  /** When a single video analysis is complete */
  result?: AnalysisResult;

  /** When a profile analysis is complete */
  profileResult?: ProfileResult;
}

export interface ProfileAnalysisRequest extends AnalysisRequest {
  profileHandle?: string;
}

/** Dashboard aggregate */
export interface DashboardData {
  numReqs: number;
  videoAnalysisFreeQuota: number;
  videoAnalysisPaidQuota: number;
  reqs: AnalysisRequest[];
}

/**
 * POST /api/analysis-requests/ response
 * - 200 (cached): returns prior result info
 * - 202 (queued): queued with ETA and optional queue position
 * Matches the spec’s shapes & required fields:contentReference[oaicite:3]{index=3}.
 */
export type CreateAnalysisResponse =
  | {
      message: 'Analysis already exists';
      jobId: string;
      status: 'cached';
      resultId: string;
      resultAnalysis: string;
    }
  | {
      message: string; // server message
      jobId: string;
      status: 'queued';
      estimatedWait: string;
      queuePosition?: number;
    };

/** Generic error envelope used by some error paths */
export interface ApiError {
  error: string;
}
