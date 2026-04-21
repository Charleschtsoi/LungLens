import type { FindingLabel } from "@/lib/constants";

export type { FindingLabel };

/** Per-condition model scores (educational / technical, not a diagnosis). */
export type Predictions = Record<FindingLabel, number>;

export interface GradcamResult {
  heatmap_base64: string;
  top_prediction: FindingLabel;
  confidence: number;
}

export interface AnalyzeSuccessResponse {
  success: true;
  predictions: Predictions;
  gradcam: GradcamResult;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

/** Alias for clarity in UI code. */
export type PredictionScores = Predictions;
