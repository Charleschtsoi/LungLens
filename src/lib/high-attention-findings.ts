import type { AnalyzeSuccessResponse, DenseNetResponse, FindingLabel } from "@/types";
import { model3PredictionString } from "@/lib/dense-net-from-analysis";
import { getMergedNotableFindingsForAiNotice, modelClassKeyToFindingLabel } from "@/lib/findings-utils";

/**
 * Maps `model1` / DenseNet stage strings (e.g. `Pneumonia-Bacteria`, `COVID-19`) to
 * `high_attention_findings` keys accepted by `/api/generate-questions` (FindingLabel).
 */
export function mapModelSignalsToHighAttentionFindings(signals: string[]): FindingLabel[] {
  const out = new Set<FindingLabel>();
  for (const raw of signals) {
    const label = modelClassKeyToFindingLabel(raw);
    if (label) out.add(label);
  }
  return Array.from(out);
}

export function isModel1PositiveFinding(analysis: AnalyzeSuccessResponse): boolean {
  const m1 = analysis.model1;
  if (!m1) return false;
  return m1.label !== "Normal";
}

export function isModel3DenseNetPositive(
  analysis: AnalyzeSuccessResponse,
  denseNetDisplay: DenseNetResponse | null,
): boolean {
  const pred = denseNetDisplay?.success
    ? denseNetDisplay.prediction
    : model3PredictionString(analysis.model3);
  if (!pred) return false;
  return pred !== "Normal";
}

/**
 * Labels to send as `high_attention_findings` (same strings as `predictions` keys / FindingLabel).
 */
export function buildHighAttentionFindingKeys(
  analysis: AnalyzeSuccessResponse,
  denseNetDisplay: DenseNetResponse | null,
): string[] {
  const merged = getMergedNotableFindingsForAiNotice(analysis.predictions, analysis, denseNetDisplay);
  if (merged.length > 0) {
    return Array.from(new Set(merged.map((n) => n.label)));
  }

  const top = analysis.gradcam.top_prediction;
  if (top && analysis.gradcam.confidence >= 0.3) {
    return [top];
  }

  if (isModel1PositiveFinding(analysis)) {
    return ["Pneumonia"];
  }

  if (isModel3DenseNetPositive(analysis, denseNetDisplay)) {
    const pred = denseNetDisplay?.success
      ? denseNetDisplay.prediction
      : model3PredictionString(analysis.model3);
    const n = pred.trim();
    if (n === "COVID-19") return ["COVID-19"];
    if (n === "Pneumonia") return ["Pneumonia"];
    return ["Pneumonia"];
  }

  return [];
}
