import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import type { AnalyzeSuccessResponse, DenseNetResponse } from "@/types";
import { model3PredictionString } from "@/lib/dense-net-from-analysis";
import { getNotableFindings } from "@/lib/findings-utils";

const FINDING_SET = new Set<string>(FINDING_LABELS as readonly string[]);

/**
 * Maps `model1` / DenseNet stage strings (e.g. `Pneumonia-Bacteria`, `COVID-19`) to
 * `high_attention_findings` keys accepted by `/api/generate-questions` (FindingLabel).
 */
export function mapModelSignalsToHighAttentionFindings(signals: string[]): FindingLabel[] {
  const out = new Set<FindingLabel>();
  for (const raw of signals) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (!s || s === "Normal") continue;
    if (s === "COVID-19") {
      out.add("COVID-19");
      continue;
    }
    if (s === "Lung Opacity" || s === "Infiltration") {
      out.add("Lung Opacity");
      continue;
    }
    if (s === "Pneumonia" || s.includes("Pneumonia")) {
      out.add("Pneumonia");
      continue;
    }
    if (FINDING_SET.has(s)) {
      out.add(s as FindingLabel);
    }
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
  const notable = getNotableFindings(analysis.predictions);
  const fromScores = notable.map((n) => n.label);
  if (fromScores.length > 0) {
    return Array.from(new Set(fromScores));
  }

  const top = analysis.gradcam.top_prediction;
  if (top) {
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
