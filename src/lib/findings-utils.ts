import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import { denseNetResponseFromAnalyzeModel3 } from "@/lib/dense-net-from-analysis";
import { model2VisionFromAnalysis } from "@/lib/model2-vision";
import type {
  AiNoticeFindingRow,
  AnalyzeSuccessResponse,
  DenseNetResponse,
  Predictions,
  PneumoniaNoticeKind,
} from "@/types";

export type { AiNoticeFindingRow, PneumoniaNoticeKind } from "@/types";

const THRESHOLD = 0.3;

/** Per-class model probabilities above this (exclusive) surface in "What the AI noticed" alongside fusion scores. */
const MODEL_NOTICE_THRESHOLD = 0.5;

export type ConfidenceTier = "Low" | "Moderate" | "High";

export function confidenceTier(score: number): ConfidenceTier {
  if (score < 0.45) return "Low";
  if (score < 0.65) return "Moderate";
  return "High";
}

export function tierBarSegments(tier: ConfidenceTier): 1 | 2 | 3 {
  if (tier === "Low") return 1;
  if (tier === "Moderate") return 2;
  return 3;
}

export function formatConditionName(label: FindingLabel): string {
  return label.replace(/_/g, " ");
}

/** Top findings above threshold, sorted by score descending, max 3. */
export function getNotableFindings(predictions: Predictions): { label: FindingLabel; score: number }[] {
  return (FINDING_LABELS as readonly FindingLabel[])
    .map((label) => ({ label, score: predictions[label] }))
    .filter((x) => x.score > THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

const FINDING_LABEL_SET = new Set<string>(FINDING_LABELS as readonly string[]);

/** Normalize backend probability to 0–1 (handles 0–100 percentages). */
export function normalizeProbabilityToUnit(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  if (raw > 1 + 1e-9) return Math.min(1, raw / 100);
  return Math.min(1, Math.max(0, raw));
}

/**
 * Maps a pipeline / DenseNet class key to a dashboard finding label.
 * Skips non-actionable classes (`Normal`, `Other`).
 */
export function modelClassKeyToFindingLabel(className: string): FindingLabel | null {
  const s = typeof className === "string" ? className.trim() : "";
  if (!s || s === "Normal" || s === "Other") return null;
  if (s === "COVID-19") return "COVID-19";
  if (s === "Lung Opacity" || s === "Infiltration") return "Lung Opacity";
  if (s === "Pneumonia" || s.includes("Pneumonia")) return "Pneumonia";
  if (FINDING_LABEL_SET.has(s)) return s as FindingLabel;
  return null;
}

/** Classifies pneumonia-related probability keys for separate bacterial vs viral notice rows. */
export function classifyPneumoniaSubtype(classKey: string): "bacterial" | "viral" | "generic" | "none" {
  const s = classKey.trim();
  const lower = s.toLowerCase();
  const isPneumoniaClass =
    lower.includes("pneumonia") || s === "Viral Pneumonia" || lower === "viral pneumonia";
  if (!isPneumoniaClass) return "none";
  if (
    s === "Pneumonia-Bacteria" ||
    lower.includes("bacterial") ||
    (lower.includes("pneumonia") && lower.includes("bacteria"))
  ) {
    return "bacterial";
  }
  if (
    s === "Pneumonia-Virus" ||
    s === "Viral Pneumonia" ||
    lower.includes("viral") ||
    (lower.includes("pneumonia") && lower.includes("virus"))
  ) {
    return "viral";
  }
  return "generic";
}

type ModelNoticeAgg = {
  pneumoBacterial: number;
  pneumoViral: number;
  pneumoGeneric: number;
  other: Map<FindingLabel, number>;
};

function emptyAgg(): ModelNoticeAgg {
  return { pneumoBacterial: 0, pneumoViral: 0, pneumoGeneric: 0, other: new Map() };
}

function absorbProbs(agg: ModelNoticeAgg, probabilities: Record<string, number> | undefined | null) {
  if (!probabilities) return;
  for (const [key, raw] of Object.entries(probabilities)) {
    const score = normalizeProbabilityToUnit(raw);
    if (!(score > MODEL_NOTICE_THRESHOLD)) continue;
    const ps = classifyPneumoniaSubtype(key);
    if (ps === "bacterial") {
      agg.pneumoBacterial = Math.max(agg.pneumoBacterial, score);
    } else if (ps === "viral") {
      agg.pneumoViral = Math.max(agg.pneumoViral, score);
    } else if (ps === "generic") {
      agg.pneumoGeneric = Math.max(agg.pneumoGeneric, score);
    } else {
      const lab = modelClassKeyToFindingLabel(key);
      if (!lab) continue;
      agg.other.set(lab, Math.max(agg.other.get(lab) ?? 0, score));
    }
  }
}

function collectModelNoticeAggregate(
  analysis: AnalyzeSuccessResponse,
  denseNetDisplay: DenseNetResponse | null,
): ModelNoticeAgg {
  const agg = emptyAgg();
  absorbProbs(agg, analysis.model1?.probabilities);
  absorbProbs(agg, model2VisionFromAnalysis(analysis)?.probabilities);
  absorbProbs(agg, analysis.model4_swint?.probabilities);
  absorbProbs(agg, analysis.model5_densenet?.probabilities);
  if (denseNetDisplay?.success && denseNetDisplay.probabilities) {
    absorbProbs(agg, denseNetDisplay.probabilities);
  } else {
    const fromAnalyze = denseNetResponseFromAnalyzeModel3(analysis);
    if (fromAnalyze?.success && fromAnalyze.probabilities) {
      absorbProbs(agg, fromAnalyze.probabilities);
    }
  }
  return agg;
}

/** Align fusion “Pneumonia” notice with pipeline primary classes (model 1, then model 6 viral). */
function fusionPneumoniaNoticeKind(analysis: AnalyzeSuccessResponse): PneumoniaNoticeKind {
  const m1 = analysis.model1?.label;
  if (m1 === "Pneumonia-Bacteria") return "pneumonia_bacterial";
  if (m1 === "Pneumonia-Virus") return "pneumonia_viral";
  const m2Vision = model2VisionFromAnalysis(analysis);
  const m6Pred = m2Vision?.prediction?.trim() ?? m2Vision?.label?.trim();
  if (m6Pred === "Viral Pneumonia") return "pneumonia_viral";
  return "default";
}

function upsertNoticeRow(map: Map<string, AiNoticeFindingRow>, row: AiNoticeFindingRow) {
  const mergeKey = `${row.label}::${row.noticeKind}`;
  const prev = map.get(mergeKey);
  if (!prev || row.score > prev.score) {
    map.set(mergeKey, row);
  }
}

/**
 * When model-specific bacterial/viral rows exist, drop the aggregate `Pneumonia::default` row and
 * fold its score into subtype rows so we do not show duplicate generic + pattern pneumonia notices.
 */
function foldPneumoniaDefaultWhenSubtypesPresent(byKey: Map<string, AiNoticeFindingRow>) {
  const defKey = "Pneumonia::default";
  const def = byKey.get(defKey);
  if (!def) return;

  const bacterialKey = "Pneumonia::pneumonia_bacterial";
  const viralKey = "Pneumonia::pneumonia_viral";
  const bacterial = byKey.get(bacterialKey);
  const viral = byKey.get(viralKey);
  if (!bacterial && !viral) return;

  if (bacterial) {
    byKey.set(bacterialKey, {
      ...bacterial,
      score: Math.max(bacterial.score, def.score),
    });
  }
  if (viral) {
    byKey.set(viralKey, {
      ...viral,
      score: Math.max(viral.score, def.score),
    });
  }
  byKey.delete(defKey);
}

/**
 * Notable findings for the AI notice card and downstream sections: fusion scores above {@link FINDINGS_CONFIDENCE_THRESHOLD}
 * **or** any pipeline model class probability strictly above 50%, with bacterial vs viral pneumonia as separate rows when present.
 */
export function getMergedNotableFindingsForAiNotice(
  predictions: Predictions,
  analysis: AnalyzeSuccessResponse,
  denseNetDisplay: DenseNetResponse | null,
): AiNoticeFindingRow[] {
  const byKey = new Map<string, AiNoticeFindingRow>();

  for (const { label, score } of getNotableFindings(predictions)) {
    const noticeKind: PneumoniaNoticeKind =
      label === "Pneumonia" ? fusionPneumoniaNoticeKind(analysis) : "default";
    upsertNoticeRow(byKey, {
      id: `fusion-${label}`,
      label,
      score,
      noticeKind,
    });
  }

  const agg = collectModelNoticeAggregate(analysis, denseNetDisplay);

  if (agg.pneumoBacterial > MODEL_NOTICE_THRESHOLD) {
    upsertNoticeRow(byKey, {
      id: "model-pneumonia-bacterial",
      label: "Pneumonia",
      score: agg.pneumoBacterial,
      noticeKind: "pneumonia_bacterial",
    });
  }
  if (agg.pneumoViral > MODEL_NOTICE_THRESHOLD) {
    upsertNoticeRow(byKey, {
      id: "model-pneumonia-viral",
      label: "Pneumonia",
      score: agg.pneumoViral,
      noticeKind: "pneumonia_viral",
    });
  }
  if (agg.pneumoGeneric > MODEL_NOTICE_THRESHOLD) {
    upsertNoticeRow(byKey, {
      id: "model-pneumonia-generic",
      label: "Pneumonia",
      score: agg.pneumoGeneric,
      noticeKind: "default",
    });
  }
  for (const [label, score] of Array.from(agg.other.entries())) {
    upsertNoticeRow(byKey, {
      id: `model-${label}`,
      label,
      score,
      noticeKind: "default",
    });
  }

  foldPneumoniaDefaultWhenSubtypesPresent(byKey);

  return Array.from(byKey.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export { THRESHOLD as FINDINGS_CONFIDENCE_THRESHOLD };
