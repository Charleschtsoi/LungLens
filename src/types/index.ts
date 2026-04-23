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
  gate?: GateDecision;
  stage1?: StageBinaryResult;
  stage2?: StageMultiClassResult;
  stage3?: StageClinicalResult | null;
  report?: StageReportResult | null;
  timing_ms?: StageTiming;
  requires_questionnaire?: boolean;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;

/** Alias for clarity in UI code. */
export type PredictionScores = Predictions;

export type GateRoute = "early_stop" | "continue";
export type GateReason = "both_negative" | "positive_detected";

export interface GateDecision {
  route: GateRoute;
  reason: GateReason;
}

export interface StageBinaryResult {
  label: "Pneumonia" | "Normal";
  confidence: number;
}

export interface StageMultiClassResult {
  label: "Normal" | "Lung Opacity" | "Viral Pneumonia" | "Other";
  confidence: number;
}

export type ClinicalSeverity = "low" | "moderate" | "high";
export type ClinicalRiskLevel = "low" | "medium" | "high";
export type ClinicalRecovery = "favorable" | "guarded" | "uncertain";

export interface Stage3QuestionnaireInput {
  age: number;
  fever: boolean;
  coughDurationDays: number;
  smoking: "never" | "former" | "current";
  breathingDifficulty: "none" | "mild" | "severe";
}

export interface StageClinicalResult {
  enabled: boolean;
  severity: ClinicalSeverity;
  risk_level: ClinicalRiskLevel;
  recovery_outlook: ClinicalRecovery;
}

export interface StageReportResult {
  summary: string;
  recommended_actions: string[];
  disclaimer: string;
}

export interface StageTiming {
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  total: number;
}
