import type { AnalyzeSuccessResponse, DenseNetAnalyzeModel3, DenseNetResponse } from "@/types";
import {
  isDenseNetProbabilities,
  isDistinctDenseNetInputPreview,
  normalizeDenseNetConfidence,
  normalizeDenseNetPrediction,
} from "@/lib/densenet-normalize";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Top-level string, nested `{ class_name }`, or backend `class_name` field on `model3`. */
function denseNetRawClassName(m: DenseNetAnalyzeModel3): string {
  const p = m.prediction;
  if (typeof p === "string" && p.trim()) return p;
  if (isRecord(p) && typeof p.class_name === "string") return p.class_name;
  if (typeof m.class_name === "string" && m.class_name.trim()) return m.class_name;
  return "";
}

function denseNetNestedConfidence(m: DenseNetAnalyzeModel3): number | undefined {
  const p = m.prediction;
  if (isRecord(p) && typeof p.confidence_score === "number" && Number.isFinite(p.confidence_score)) {
    return p.confidence_score;
  }
  return undefined;
}

/** True when `model3` is the DenseNet block (not questionnaire clinical risk). */
function isAnalyzeDenseNetBlock(m: DenseNetAnalyzeModel3): boolean {
  const name = typeof m.model_name === "string" ? m.model_name.trim() : "";
  if (name && /densenet/i.test(name)) return true;
  const probMap =
    (isRecord(m.all_probabilities) ? m.all_probabilities : undefined) ??
    (isRecord(m.probabilities) ? m.probabilities : undefined);
  const raw = denseNetRawClassName(m);
  if (raw.trim() && probMap) {
    return isDenseNetProbabilities(probMap);
  }
  if (probMap && isDenseNetProbabilities(probMap) && typeof m.gradcam === "string" && m.gradcam.trim()) {
    return true;
  }
  if (typeof m.error === "string" && m.error.trim() && name && /densenet/i.test(name)) return true;
  return false;
}

/**
 * Maps `/api/v1/analyze` `model3` (DenseNet-121) into the same shape as `predictDenseNet`.
 * Grad-CAM may be absent when the backend omits it; supplemental `/api/predict/densenet` can still fill in.
 */
export function denseNetResponseFromAnalyzeModel3(
  analysis: AnalyzeSuccessResponse,
): DenseNetResponse | null {
  const m = analysis.model3;
  if (!m || !isAnalyzeDenseNetBlock(m)) return null;

  const probs = (
    (m.all_probabilities && isRecord(m.all_probabilities) ? m.all_probabilities : undefined) ??
    (m.probabilities && isRecord(m.probabilities) ? m.probabilities : undefined) ??
    {}
  ) as Record<string, number>;
  const rawPrediction = denseNetRawClassName(m);
  const prediction = normalizeDenseNetPrediction(rawPrediction, probs);
  const nestedConf = denseNetNestedConfidence(m);
  let confRaw =
    typeof m.confidence === "number" && Number.isFinite(m.confidence) ? m.confidence : NaN;
  if (!Number.isFinite(confRaw) && nestedConf !== undefined) confRaw = nestedConf;
  let confidence = normalizeDenseNetConfidence(confRaw);
  const gradcam = typeof m.gradcam === "string" ? m.gradcam : "";
  const fromBase64 =
    typeof m.input_preview_base64 === "string" ? m.input_preview_base64.trim() : "";
  const fromAlias = typeof m.input_preview === "string" ? m.input_preview.trim() : "";
  let inputPreviewRaw = fromBase64 || fromAlias;
  if (inputPreviewRaw && !isDistinctDenseNetInputPreview(inputPreviewRaw, gradcam)) {
    inputPreviewRaw = "";
  }
  const err = typeof m.error === "string" && m.error.trim() ? m.error.trim() : "";

  if (!prediction || !isDenseNetProbabilities(probs)) {
    if (err) {
      return {
        success: false,
        prediction: "",
        confidence: 0,
        probabilities: {},
        gradcam: "",
        error: err,
      };
    }
    return null;
  }

  if (!Number.isFinite(confidence)) {
    const p = probs[prediction];
    confidence = normalizeDenseNetConfidence(typeof p === "number" ? p : NaN);
  }
  if (!Number.isFinite(confidence)) {
    return {
      success: false,
      prediction: "",
      confidence: 0,
      probabilities: {},
      gradcam: "",
      error: err || "Invalid confidence in analyze model3.",
    };
  }

  return {
    success: true,
    prediction,
    confidence,
    probabilities: probs,
    gradcam,
    ...(inputPreviewRaw ? { input_preview_base64: inputPreviewRaw } : {}),
  };
}

/** Canonical class label from `model3` (`prediction`, nested prediction, or top-level `class_name`). */
export function model3PredictionString(m: AnalyzeSuccessResponse["model3"]): string {
  if (!m) return "";
  return denseNetRawClassName(m);
}

/**
 * Prefer DenseNet from `/analyze` when successful; fill Grad-CAM from supplemental fetch when analyze omits it.
 */
export function mergeDenseNetDisplayForUi(
  fromAnalyze: DenseNetResponse | null,
  supplemental: DenseNetResponse | null,
): DenseNetResponse | null {
  if (fromAnalyze?.success && supplemental?.success) {
    const mergedGradcam =
      fromAnalyze.gradcam?.trim() || supplemental.gradcam?.trim() || "";
    let mergedPreview =
      fromAnalyze.input_preview_base64?.trim() ||
      supplemental.input_preview_base64?.trim() ||
      "";
    if (mergedPreview && !isDistinctDenseNetInputPreview(mergedPreview, mergedGradcam)) {
      mergedPreview = "";
    }
    const previewOut: string | undefined = mergedPreview || undefined;
    const gradcamEq = mergedGradcam === (fromAnalyze.gradcam?.trim() || "");
    const previewEq =
      (previewOut || "") === (fromAnalyze.input_preview_base64?.trim() || "");
    if (!gradcamEq || !previewEq) {
      return {
        ...fromAnalyze,
        gradcam: mergedGradcam,
        /** Always set — never omit: omitting left `...fromAnalyze`'s bad duplicate when previewOut is cleared. */
        input_preview_base64: previewOut,
      };
    }
  }
  if (fromAnalyze?.success) return fromAnalyze;
  if (supplemental?.success) return supplemental;
  return fromAnalyze ?? supplemental;
}
