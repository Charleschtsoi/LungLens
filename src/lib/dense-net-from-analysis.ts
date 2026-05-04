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

/** True when `model3` is the DenseNet block (not questionnaire clinical risk). */
function isAnalyzeDenseNetBlock(m: DenseNetAnalyzeModel3): boolean {
  const name = typeof m.model_name === "string" ? m.model_name.trim() : "";
  if (name && /densenet/i.test(name)) return true;
  if (typeof m.prediction === "string" && m.prediction.trim() && isRecord(m.probabilities)) {
    return isDenseNetProbabilities(m.probabilities);
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

  const probs = (m.probabilities && isRecord(m.probabilities) ? m.probabilities : {}) as Record<
    string,
    number
  >;
  const rawPrediction = typeof m.prediction === "string" ? m.prediction : "";
  const prediction = normalizeDenseNetPrediction(rawPrediction, probs);
  const confRaw =
    typeof m.confidence === "number" && Number.isFinite(m.confidence) ? m.confidence : NaN;
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

/**
 * Prefer DenseNet from `/analyze` when successful; fill Grad-CAM from supplemental fetch when analyze omits it.
 * If analyze DenseNet failed or is absent, use supplemental success when available.
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
