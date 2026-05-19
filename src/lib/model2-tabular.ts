import type { ProbabilityBarRow } from "@/components/results/ProbabilityBarList";
import { highestProbabilityLabel, probabilityToPercent } from "@/lib/model-summary-display";
import type {
  AnalyzeSuccessResponse,
  CopdScreeningResult,
  Model2TabularResult,
  StageMultiClassResult,
} from "@/types";

export function isModel2Tabular(m: unknown): m is Model2TabularResult {
  if (!m || typeof m !== "object") return false;
  const r = m as Model2TabularResult;
  return r.status === "success" && r.input_type === "tabular";
}

/** ResNet-152V2 vision block on `model2` (not tabular COPD). */
export function isModel2Vision(m: unknown): m is StageMultiClassResult {
  if (!m || typeof m !== "object") return false;
  if (isModel2Tabular(m)) return false;
  const r = m as StageMultiClassResult;
  return typeof r.label === "string" && typeof r.confidence === "number";
}

export function formatModel2ClinicalSummary(m: Model2TabularResult): {
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
  const rows = model2ClinicalProbabilityRows(m);
  const topPct = rows[0]?.pct ?? Math.round(probabilityToPercent(m.confidence ?? 0));
  return {
    riskText,
    confidence: topPct,
    isHigh,
  };
}

/** Headline aligned with visual models: e.g. "Elevated Risk Detected (72% — highest probability)". */
export function formatModel2ClinicalHeadline(
  m: Model2TabularResult,
  t: (key: string, fallback?: string) => string,
): string {
  const { riskText, confidence } = formatModel2ClinicalSummary(m);
  return `${riskText} (${highestProbabilityLabel(t, confidence)})`;
}

/** Bar rows for Model 2 (High / Low COPD risk), sorted highest first. */
export function model2ClinicalProbabilityRows(m: Model2TabularResult): ProbabilityBarRow[] {
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
  copd: CopdScreeningResult | Model2TabularResult | undefined,
): Model2TabularResult | undefined {
  if (!copd) return undefined;
  if (isModel2Tabular(copd)) return copd;
  if (copd.status !== "success") return undefined;
  return model2TabularFromLegacyCopd(copd);
}

/** Model 2 tabular COPD — primary `model2` or alias `copd_screening` from analyze response. */
export function model2TabularFromAnalysis(
  analysis: Pick<AnalyzeSuccessResponse, "model2" | "copd_screening">,
): Model2TabularResult | undefined {
  if (isModel2Tabular(analysis.model2)) return analysis.model2;
  const fromCopd = copdTabularFromAnalyze(analysis.copd_screening);
  if (fromCopd) return fromCopd;
  if (analysis.model2 && !isModel2Vision(analysis.model2)) {
    return copdTabularFromAnalyze(analysis.model2 as CopdScreeningResult);
  }
  return undefined;
}

/** Map legacy `copd_screening` shape to tabular display model. */
export function model2TabularFromLegacyCopd(
  copd: { prediction?: string; confidence?: number; status?: string } | undefined,
): Model2TabularResult | undefined {
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
