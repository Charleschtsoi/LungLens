import type { ProbabilityBarRow } from "@/components/results/ProbabilityBarList";
import { highestProbabilityLabel, probabilityToPercent } from "@/lib/model-summary-display";
import type {
  AnalyzeSuccessResponse,
  CopdScreeningResult,
  Model6TabularResult,
} from "@/types";

export function isModel6Tabular(m: unknown): m is Model6TabularResult {
  if (!m || typeof m !== "object") return false;
  const r = m as Model6TabularResult;
  return r.status === "success" && r.input_type === "tabular";
}

export function formatModel6ClinicalSummary(m: Model6TabularResult): {
  riskText: string;
  confidence: number;
  isHigh: boolean;
} {
  const isHigh = m.prediction === "High COPD Risk";
  const riskText = isHigh
    ? "Elevated Risk Detected"
    : m.prediction === "Low COPD Risk"
      ? "Standard Risk Profile"
      : m.prediction;
  const rows = model6ClinicalProbabilityRows(m);
  const topPct = rows[0]?.pct ?? Math.round(probabilityToPercent(m.confidence ?? 0));
  return {
    riskText,
    confidence: topPct,
    isHigh,
  };
}

export function formatModel6ClinicalHeadline(
  m: Model6TabularResult,
  t: (key: string, fallback?: string) => string,
): string {
  const { riskText, confidence } = formatModel6ClinicalSummary(m);
  return `${riskText} (${highestProbabilityLabel(t, confidence)})`;
}

export function model6ClinicalProbabilityRows(m: Model6TabularResult): ProbabilityBarRow[] {
  const probs = m.probabilities;
  let highPct: number;
  let lowPct: number;
  if (probs && typeof probs["High COPD Risk"] === "number") {
    highPct = probabilityToPercent(probs["High COPD Risk"]);
    lowPct =
      typeof probs["Low COPD Risk"] === "number"
        ? probabilityToPercent(probs["Low COPD Risk"])
        : Math.max(0, Math.min(100, 100 - highPct));
  } else {
    highPct = probabilityToPercent(m.confidence ?? 0);
    lowPct = Math.max(0, Math.min(100, 100 - highPct));
  }
  return [
    { key: "High COPD Risk", label: "High COPD Risk", pct: highPct },
    { key: "Low COPD Risk", label: "Low COPD Risk", pct: lowPct },
  ].sort((a, b) => b.pct - a.pct);
}

export function copdTabularFromAnalyze(
  copd: CopdScreeningResult | Model6TabularResult | undefined,
): Model6TabularResult | undefined {
  if (!copd) return undefined;
  if (isModel6Tabular(copd)) return copd;
  if (copd.status !== "success") return undefined;
  return model6TabularFromLegacyCopd(copd);
}

/** Model 6 tabular COPD — `model6` or legacy `copd_screening` / tabular-shaped `model2`. */
export function model6TabularFromAnalysis(
  analysis: Pick<AnalyzeSuccessResponse, "model6" | "copd_screening" | "model2">,
): Model6TabularResult | undefined {
  if (isModel6Tabular(analysis.model6)) return analysis.model6;
  const fromCopd = copdTabularFromAnalyze(analysis.copd_screening);
  if (fromCopd) return fromCopd;
  if (analysis.model2 && isModel6Tabular(analysis.model2)) return analysis.model2;
  return undefined;
}

export function model6TabularFromLegacyCopd(
  copd: { prediction?: string; confidence?: number; status?: string } | undefined,
): Model6TabularResult | undefined {
  if (!copd || copd.status !== "success") return undefined;
  const confidence = copd.confidence ?? 0;
  const pHigh = probabilityToPercent(confidence);
  const pLow = Math.max(0, Math.min(100, 100 - pHigh));
  return {
    prediction: copd.prediction ?? "",
    confidence: copd.confidence ?? 0,
    status: "success",
    input_type: "tabular",
    model_name: "Chronic Lung Risk (COPD)",
    label: copd.prediction,
    probabilities: {
      "High COPD Risk": pHigh / 100,
      "Low COPD Risk": pLow / 100,
    },
  };
}

/** @deprecated Use `formatModel6ClinicalHeadline` */
export const formatModel2ClinicalHeadline = formatModel6ClinicalHeadline;
/** @deprecated Use `model6TabularFromAnalysis` */
export const model2TabularFromAnalysis = model6TabularFromAnalysis;
