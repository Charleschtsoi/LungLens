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
  /** Binary screening model output (backend `model1`). */
  model1?: StageBinaryResult;
  /** Multi-class classifier output (backend `model2`). */
  model2?: StageMultiClassResult;
  /** Clinical / questionnaire block (backend `model3`). */
  model3?: StageClinicalResult | null;
  /** Report synthesis (backend `model4`; same shape as former `report`). */
  model4?: StageReportResult | null;
  timing_ms?: StageTiming;
  requires_questionnaire?: boolean;
  warnings?: AnalyzeWarning[];
  provenance?: AnalyzeProvenance;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
  error_code?: AnalyzeErrorCode;
  stage?: AnalyzeStageKey;
  retryable?: boolean;
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

/** Model 1 output: binary legacy labels or 3-class ResNet50 labels from backend. */
export interface StageBinaryResult {
  label: "Pneumonia" | "Normal" | "Pneumonia-Bacteria" | "Pneumonia-Virus";
  confidence: number;
  model_name?: string;
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
  model1: number;
  model2: number;
  model3: number;
  model4: number;
  total: number;
}

export type AnalyzeRunMode = "real" | "mock" | "hybrid";
export type AnalyzeStageStatus = "ok" | "fallback" | "failed" | "skipped";
export type AnalyzeStageSource = "model" | "mock" | "rule" | "llm" | "static";
/** Flat provenance tags from backend (`model1_result`, `findings`, …). Uses `rules` (not `rule`). */
export type ProvenanceSectionSource = "model" | "rules" | "mock" | "llm" | "static";
export type AnalyzeStageKey =
  | "pipeline"
  | "model1"
  | "model2"
  | "model3"
  | "model4"
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4";
export type AnalyzeErrorCode =
  | "invalid_api_key"
  | "missing_image"
  | "invalid_request"
  | "payload_too_large"
  | "unsupported_file_type"
  | "model_unavailable"
  | "model_inference_failed"
  | "backend_unavailable"
  | "network_error"
  | "timeout"
  | "internal_error";

export interface StageProvenance {
  source: AnalyzeStageSource;
  status: AnalyzeStageStatus;
  model_id?: string | null;
  model_version?: string | null;
  note?: string | null;
}

export interface ImpactExplanation {
  section: string;
  stage_keys: string[];
  source_type: AnalyzeStageSource;
}

export interface AnalyzeWarning {
  code: string;
  message: string;
  stage?: AnalyzeStageKey;
  /** Backend may send `scope` (e.g. `"pipeline"`) instead of `stage`. */
  scope?: string;
}

export interface AnalyzeProvenance {
  run_mode: AnalyzeRunMode;
  /** Flat section-level tags (backend `model1_result`, `model2_result`, …). */
  model1_result?: string;
  model2_result?: string;
  gate_decision?: string;
  findings?: string;
  doctor_questions?: string;
  report_summary?: string;
  anatomy_guide?: string;
  model1?: StageProvenance;
  model2?: StageProvenance;
  model3?: StageProvenance;
  model4?: StageProvenance;
  explanations?: ImpactExplanation[];
}
