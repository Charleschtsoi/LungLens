import type { FindingLabel } from "@/lib/constants";

export type { FindingLabel };

/** Per-condition model scores (educational / technical, not a diagnosis). */
export type Predictions = Record<FindingLabel, number>;

export type PneumoniaNoticeKind = "default" | "pneumonia_bacterial" | "pneumonia_viral";

export interface AiNoticeFindingRow {
  id: string;
  label: FindingLabel;
  score: number;
  noticeKind: PneumoniaNoticeKind;
}

export interface GradcamResult {
  heatmap_base64: string;
  top_prediction: FindingLabel;
  confidence: number;
}

/** Nested prediction object some production backends send instead of a top-level string. */
export interface DenseNetNestedPrediction {
  class_name?: string;
  confidence_score?: number;
}

/** DenseNet-121 block inside `POST /api/v1/analyze` (`model3`). */
export interface DenseNetAnalyzeModel3 {
  /** Backend typically sends `"DenseNet-121"`. */
  model_name?: string;
  /** Plain string or nested `{ class_name, confidence_score }` (match `/api/v1/analyze` production). */
  prediction?: string | DenseNetNestedPrediction;
  /** Some backends send class metadata alongside or instead of `prediction` string. */
  class_id?: number;
  class_name?: string;
  confidence_score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  /** New backend alias for class probability map. */
  all_probabilities?: Record<string, number>;
  gradcam?: string;
  /** Same 224×224 center crop as model input (PNG base64); aligns with `gradcam` framing. */
  input_preview_base64?: string;
  /** Some backends may use this alias; treat like `input_preview_base64` (never Grad-CAM). */
  input_preview?: string;
  error?: string;
}

export interface AnalyzeSuccessResponse {
  success: true;
  predictions: Predictions;
  gradcam: GradcamResult;
  gate?: GateDecision;
  /** Model 1 output: PyTorch ResNet-50 3-class (backend `model1`). */
  model1?: StageBinaryResult;
  /** Model 2 — Edward ResNet-152V2 vision (3-class X-ray). */
  model2?: Model2VisionResult | StageMultiClassResult;
  /** Model 6 — tabular Chronic Lung Risk (COPD) from questionnaire. */
  model6?: Model6TabularResult | CopdScreeningResult;
  /** Clinical / questionnaire severity (backend `clinical_risk`; legacy: clinical-shaped `model3`). */
  clinical_risk?: StageClinicalResult | null;
  /** Alias for Model 6 tabular when backend uses `copd_screening`. */
  copd_screening?: CopdScreeningResult | Model6TabularResult;
  /** Swin-T Vision Transformer output from backend `model4_swint`. */
  model4_swint?: SwinTScreeningResult;
  /** Expansion DenseNet-121 ensemble slot from backend `model5_densenet`. */
  model5_densenet?: Model5DenseNetResult;
  /** @deprecated Pre-alignment field; BFF maps to `model2` when present. */
  model6_vision_h5?: Model2VisionResult;
  /**
   * DenseNet-121 3-class + Grad-CAM (backend `model3`).
   * Separate from questionnaire clinical block.
   */
  model3?: DenseNetAnalyzeModel3 | null;
  /** Report synthesis (backend `model4`; same shape as former `report`). */
  model4?: StageReportResult | null;
  /** Optional BYOK Gemini evaluator output from backend. */
  llm_evaluation?: LlmEvaluationResult;
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

/** Model 1 row shape: 3-class ResNet-50 labels from backend when neural runs (UI type name is legacy). */
export interface StageBinaryResult {
  label: "Pneumonia" | "Normal" | "Pneumonia-Bacteria" | "Pneumonia-Virus";
  confidence: number;
  model_name?: string;
  /** Base64 PNG Grad-CAM overlay (PyTorch ResNet50) when backend provides it. */
  gradcam?: string;
  probabilities?: Record<string, number>;
}

/** Model 6 — tabular COPD classifier (questionnaire + scaler). */
export interface Model6TabularResult {
  prediction: string;
  /** P(High COPD Risk), even when displayed label is Low. */
  confidence: number;
  status: string;
  input_type: "tabular";
  model_name?: string;
  label?: string;
  probabilities?: Record<string, number>;
}

/** @deprecated Use `Model6TabularResult` */
export type Model2TabularResult = Model6TabularResult;

/** Legacy multi-class row (ResNet-152V2 labels). */
export interface StageMultiClassResult {
  label: "Normal" | "Lung Opacity" | "Viral Pneumonia" | "Other";
  confidence: number;
  probabilities?: Record<string, number>;
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

export interface CopdScreeningResult {
  prediction: string;
  confidence: number;
  status: string;
}

/** Standard classifier block (`model4_swint`, `model5_densenet`; see `sample_response.json`). */
export interface ClassifierModelBlock {
  prediction: string;
  confidence: number;
  status: string;
  probabilities?: Record<string, number>;
  model_name?: string;
}

export type SwinTScreeningResult = ClassifierModelBlock;

export type Model5DenseNetResult = ClassifierModelBlock;

/** Model 2 — 3-class ResNet-152V2 (Keras H5) — `H5_MODEL2_LABELS`. */
export interface Model2VisionResult extends ClassifierModelBlock {
  gradcam?: string;
  input_type?: "vision";
  label?: string;
}

/** @deprecated Use `Model2VisionResult` */
export type Model6VisionH5Result = Model2VisionResult;

export interface StageReportResult {
  summary: string;
  recommended_actions: string[];
  disclaimer: string;
}

/** Optional per-locale educator markdown from the backend (`text_by_locale` or aliases). */
export interface LlmEvaluationTextByLocale {
  en?: string;
  "zh-Hans"?: string;
  "zh-Hant"?: string;
}

export interface LlmEvaluationResult {
  status: string;
  text: string;
  /** When set, the UI can show EN / 繁中 / 簡中 tabs; `text` remains the legacy single string. */
  text_by_locale?: LlmEvaluationTextByLocale;
}

export interface StageTiming {
  model1: number;
  model2: number;
  model3: number;
  model4: number;
  model6?: number;
  total: number;
}

/** Backend `/api/v1/generate-questions` suggested prompts for the doctor Q&A card. */
export interface SuggestedDoctorQuestion {
  id: string;
  text: string;
  finding_trigger: string;
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
  model6_result?: string;
  model3_result?: string;
  clinical_risk_result?: string;
  gate_decision?: string;
  findings?: string;
  doctor_questions?: string;
  report_summary?: string;
  anatomy_guide?: string;
  model1?: StageProvenance;
  model2?: StageProvenance;
  model6?: StageProvenance;
  /** DenseNet-121 / neural model3. */
  model3?: StageProvenance;
  model4?: StageProvenance;
  clinical_risk?: StageProvenance;
  explanations?: ImpactExplanation[];
}

/** Standalone backend POST /predict/densenet (not part of analyze pipeline). */
export interface DenseNetResponse {
  success: boolean;
  prediction: string;
  /** Display confidence as percentage 0–100 after client normalization (backend may send 0–1 or 0–100). */
  confidence: number;
  /** Class probabilities, typically 0–1 per class (same as backend). */
  probabilities: Record<string, number>;
  /** Raw base64 PNG or data URL from backend. */
  gradcam: string;
  /** Same 224×224 center crop as model input when backend sends it (analyze or /predict/densenet). */
  input_preview_base64?: string;
  error?: string;
}
