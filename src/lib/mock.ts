import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import { PIPELINE } from "@/lib/constants";
import type {
  AnalyzeSuccessResponse,
  Predictions,
  Stage3QuestionnaireInput,
  StageClinicalResult,
  StageMultiClassResult,
  StageBinaryResult,
} from "@/types";

/** Alias for mock / ML success payloads. */
export type AnalysisResult = AnalyzeSuccessResponse;

const MOCK_DELAY_MS = 2000;

/** 1×1 PNG fallback if canvas is unavailable. */
const FALLBACK_HEATMAP_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Random scores with 2–3 conditions above 0.3 (simulated “findings”). */
export function generateMockPredictions(): Predictions {
  const shuffled = shuffle(FINDING_LABELS);
  const nHigh = 2 + Math.floor(Math.random() * 2);
  const highLabels = new Set(shuffled.slice(0, nHigh));

  const predictions = {} as Predictions;
  for (const label of FINDING_LABELS) {
    if (highLabels.has(label)) {
      predictions[label] = Number(randomBetween(0.32, 0.94).toFixed(4));
    } else {
      predictions[label] = Number(randomBetween(0.02, 0.28).toFixed(4));
    }
  }
  return predictions;
}

function topThree(preds: Predictions): Array<{ label: FindingLabel; score: number }> {
  return [...FINDING_LABELS]
    .map((label) => ({ label, score: preds[label] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function stage1FromPredictions(preds: Predictions): StageBinaryResult {
  const likelyPneumonia = Math.max(preds.Pneumonia, preds.Consolidation, preds.Infiltration);
  const normalProxy = 1 - likelyPneumonia;
  const pneumonia = likelyPneumonia >= 0.5;
  return {
    label: pneumonia ? "Pneumonia" : "Normal",
    confidence: Number((pneumonia ? likelyPneumonia : normalProxy).toFixed(4)),
  };
}

function stage2FromPredictions(preds: Predictions): StageMultiClassResult {
  const viral = preds.Pneumonia;
  const opacity = Math.max(preds.Infiltration, preds.Consolidation, preds.Effusion);
  const normal = Math.max(0.05, 1 - Math.max(viral, opacity));
  if (normal >= viral && normal >= opacity) {
    return { label: "Normal", confidence: Number(normal.toFixed(4)) };
  }
  if (viral >= opacity) {
    return { label: "Viral Pneumonia", confidence: Number(viral.toFixed(4)) };
  }
  return { label: "Lung Opacity", confidence: Number(opacity.toFixed(4)) };
}

function gateFromStages(stage1: StageBinaryResult, stage2: StageMultiClassResult) {
  const positive =
    stage1.label === "Pneumonia" ||
    (stage2.label !== "Normal" && stage2.confidence >= PIPELINE.gateThreshold);
  return positive
    ? { route: "continue" as const, reason: "positive_detected" as const }
    : { route: "early_stop" as const, reason: "both_negative" as const };
}

function stage3FromQuestionnaire(q: Stage3QuestionnaireInput): StageClinicalResult {
  let score = 0;
  if (q.age >= 65) score += 2;
  if (q.fever) score += 1;
  if (q.coughDurationDays >= 7) score += 1;
  if (q.smoking === "current") score += 2;
  if (q.smoking === "former") score += 1;
  if (q.breathingDifficulty === "mild") score += 1;
  if (q.breathingDifficulty === "severe") score += 3;

  if (score >= 7) {
    return { enabled: true, severity: "high", risk_level: "high", recovery_outlook: "guarded" };
  }
  if (score >= 4) {
    return { enabled: true, severity: "moderate", risk_level: "medium", recovery_outlook: "uncertain" };
  }
  return { enabled: true, severity: "low", risk_level: "low", recovery_outlook: "favorable" };
}

function buildReport(
  gate: { route: "early_stop" | "continue" },
  top: Array<{ label: FindingLabel; score: number }>,
  stage3?: StageClinicalResult | null,
) {
  if (gate.route === "early_stop") {
    return {
      summary:
        "Both imaging stages did not flag high-risk patterns above the gate threshold. This is consistent with no significant findings in this educational run.",
      recommended_actions: [
        "Review your official radiology report with your clinician.",
        "Monitor symptoms and seek care if breathing symptoms worsen.",
      ],
      disclaimer: PIPELINE.reportDisclaimer,
    };
  }
  const topLabels = top
    .slice(0, 2)
    .map((x) => x.label.replace(/_/g, " "))
    .join(", ");
  const risk = stage3 ? `Clinical questionnaire suggests ${stage3.risk_level} risk.` : "Clinical questionnaire is pending.";
  return {
    summary: `Imaging models flagged patterns associated with: ${topLabels}. ${risk}`,
    recommended_actions: [
      "Discuss these highlighted regions with your doctor.",
      "Bring your symptom history and timeline to your next visit.",
      "Do not self-diagnose based on this educational output.",
    ],
    disclaimer: PIPELINE.reportDisclaimer,
  };
}

function topFinding(preds: Predictions): { label: FindingLabel; confidence: number } {
  let label: FindingLabel = FINDING_LABELS[0];
  let max = preds[label];
  for (const k of FINDING_LABELS) {
    if (preds[k] > max) {
      max = preds[k];
      label = k;
    }
  }
  return { label, confidence: max };
}

/**
 * Red → yellow gradient PNG as base64 (placeholder heatmap).
 * Uses image dimensions when the file is a decodable bitmap.
 */
export async function createPlaceholderHeatmapBase64(file: File): Promise<string> {
  if (typeof document === "undefined") {
    return FALLBACK_HEATMAP_BASE64;
  }

  let width = 256;
  let height = 256;

  try {
    if (file.type.startsWith("image/")) {
      const bitmap = await createImageBitmap(file);
      width = Math.min(512, Math.max(64, bitmap.width));
      height = Math.min(512, Math.max(64, bitmap.height));
      bitmap.close();
    }
  } catch {
    /* DICOM or unsupported — default size */
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return FALLBACK_HEATMAP_BASE64;

  const g = ctx.createLinearGradient(0, height, width, 0);
  g.addColorStop(0, "rgba(220, 38, 38, 0.82)");
  g.addColorStop(0.45, "rgba(251, 191, 36, 0.65)");
  g.addColorStop(1, "rgba(254, 249, 195, 0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const radial = ctx.createRadialGradient(
    width * 0.35,
    height * 0.35,
    0,
    width * 0.45,
    height * 0.4,
    Math.max(width, height) * 0.55,
  );
  radial.addColorStop(0, "rgba(255, 80, 0, 0.5)");
  radial.addColorStop(1, "rgba(255, 200, 0, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  return base64 || FALLBACK_HEATMAP_BASE64;
}

/**
 * Simulates the ML API: delay, random scores (2–3 above 0.3), gradient heatmap, top prediction.
 * Intended to run in the browser (uses Canvas).
 */
export async function mockAnalyze(
  image: File,
  opts?: { questionnaire?: Stage3QuestionnaireInput | null },
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const t0 = performance.now?.() ?? Date.now();
  const predictions = generateMockPredictions();
  const { label, confidence } = topFinding(predictions);
  const heatmap_base64 = await createPlaceholderHeatmapBase64(image);
  const stage1 = stage1FromPredictions(predictions);
  const stage2 = stage2FromPredictions(predictions);
  const gate = gateFromStages(stage1, stage2);
  const top = topThree(predictions);

  const needsQuestionnaire =
    gate.route === "continue" && PIPELINE.questionnaireRequiredOnContinue && !opts?.questionnaire;
  const stage3 = opts?.questionnaire ? stage3FromQuestionnaire(opts.questionnaire) : null;
  const report = needsQuestionnaire ? null : buildReport(gate, top, stage3);
  const total = Math.round((performance.now?.() ?? Date.now()) - t0);

  return {
    success: true,
    predictions,
    gradcam: {
      heatmap_base64,
      top_prediction: label,
      confidence,
    },
    stage1,
    stage2,
    gate,
    stage3,
    report,
    requires_questionnaire: needsQuestionnaire,
    timing_ms: {
      stage1: Math.max(40, Math.round(total * 0.12)),
      stage2: Math.max(40, Math.round(total * 0.14)),
      stage3: stage3 ? Math.max(20, Math.round(total * 0.1)) : 0,
      stage4: report ? Math.max(60, Math.round(total * 0.2)) : 0,
      total,
    },
  };
}
