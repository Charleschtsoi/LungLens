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

type HeatmapFocus = {
  x: number;
  y: number;
  radius: number;
  intensity: number;
};

export type MockScenario = {
  id: string;
  primary: FindingLabel;
  scores: Partial<Record<FindingLabel, number>>;
  heatmapFoci: HeatmapFocus[];
};

const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: "right-lower-opacity",
    primary: "Consolidation",
    scores: {
      Consolidation: 0.82,
      Infiltration: 0.64,
      Pneumonia: 0.58,
      Effusion: 0.34,
    },
    heatmapFoci: [
      { x: 0.34, y: 0.58, radius: 0.22, intensity: 1 },
      { x: 0.42, y: 0.48, radius: 0.14, intensity: 0.66 },
    ],
  },
  {
    id: "left-perihilar-pneumonia",
    primary: "Pneumonia",
    scores: {
      Pneumonia: 0.86,
      Infiltration: 0.57,
      Edema: 0.38,
      Atelectasis: 0.31,
    },
    heatmapFoci: [
      { x: 0.64, y: 0.44, radius: 0.19, intensity: 1 },
      { x: 0.56, y: 0.55, radius: 0.12, intensity: 0.7 },
    ],
  },
  {
    id: "basal-effusion",
    primary: "Effusion",
    scores: {
      Effusion: 0.79,
      Pleural_Thickening: 0.52,
      Atelectasis: 0.42,
      Cardiomegaly: 0.33,
    },
    heatmapFoci: [
      { x: 0.28, y: 0.72, radius: 0.18, intensity: 0.9 },
      { x: 0.68, y: 0.74, radius: 0.2, intensity: 1 },
    ],
  },
  {
    id: "upper-zone-nodule",
    primary: "Nodule",
    scores: {
      Nodule: 0.74,
      Mass: 0.45,
      Fibrosis: 0.35,
    },
    heatmapFoci: [
      { x: 0.62, y: 0.3, radius: 0.13, intensity: 1 },
      { x: 0.34, y: 0.33, radius: 0.1, intensity: 0.58 },
    ],
  },
];

const fileScenarioCache = new WeakMap<File, MockScenario>();

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function selectScenario(file?: File): MockScenario {
  if (file) {
    const cached = fileScenarioCache.get(file);
    if (cached) return cached;
  }

  const scenario = MOCK_SCENARIOS[Math.floor(Math.random() * MOCK_SCENARIOS.length)];
  if (file) fileScenarioCache.set(file, scenario);
  return scenario;
}

/** Scenario-based scores with small jitter so repeated demos do not look identical. */
export function generateMockPredictions(scenario: MockScenario = selectScenario()): Predictions {
  const predictions = {} as Predictions;
  for (const label of FINDING_LABELS) {
    const scenarioScore = scenario.scores[label];
    const base = scenarioScore ?? randomBetween(0.02, 0.18);
    const jitter = scenarioScore ? randomBetween(-0.045, 0.045) : randomBetween(-0.015, 0.035);
    predictions[label] = Number(clamp01(base + jitter).toFixed(4));
  }
  predictions[scenario.primary] = Math.max(predictions[scenario.primary], 0.72);
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

function drawGradcamFocus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  focus: HeatmapFocus,
) {
  const cx = width * focus.x;
  const cy = height * focus.y;
  const radius = Math.max(width, height) * focus.radius;
  const alpha = focus.intensity;

  const outer = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  outer.addColorStop(0, `rgba(220, 38, 38, ${0.8 * alpha})`);
  outer.addColorStop(0.18, `rgba(249, 115, 22, ${0.68 * alpha})`);
  outer.addColorStop(0.34, `rgba(250, 204, 21, ${0.55 * alpha})`);
  outer.addColorStop(0.52, `rgba(34, 197, 94, ${0.34 * alpha})`);
  outer.addColorStop(0.72, `rgba(6, 182, 212, ${0.2 * alpha})`);
  outer.addColorStop(1, "rgba(37, 99, 235, 0)");

  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.34);
  core.addColorStop(0, `rgba(185, 28, 28, ${0.72 * alpha})`);
  core.addColorStop(0.5, `rgba(239, 68, 68, ${0.52 * alpha})`);
  core.addColorStop(1, "rgba(239, 68, 68, 0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.36, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Grad-CAM-like transparent PNG as base64.
 * Uses image dimensions when the file is a decodable bitmap.
 */
export async function createPlaceholderHeatmapBase64(
  file: File,
  scenario: MockScenario = selectScenario(file),
): Promise<string> {
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

  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const lowActivation = ctx.createRadialGradient(
    width * 0.5,
    height * 0.52,
    0,
    width * 0.5,
    height * 0.52,
    Math.max(width, height) * 0.58,
  );
  lowActivation.addColorStop(0, "rgba(34, 197, 94, 0.1)");
  lowActivation.addColorStop(0.45, "rgba(6, 182, 212, 0.1)");
  lowActivation.addColorStop(0.8, "rgba(37, 99, 235, 0.06)");
  lowActivation.addColorStop(1, "rgba(37, 99, 235, 0)");
  ctx.fillStyle = lowActivation;
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "lighter";
  for (const focus of scenario.heatmapFoci) {
    drawGradcamFocus(ctx, width, height, focus);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  return base64 || FALLBACK_HEATMAP_BASE64;
}

/**
 * Simulates the ML API: delay, scenario-based scores, Grad-CAM-like heatmap, top prediction.
 * Intended to run in the browser (uses Canvas).
 */
export async function mockAnalyze(
  image: File,
  opts?: { questionnaire?: Stage3QuestionnaireInput | null },
): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const t0 = performance.now?.() ?? Date.now();
  const scenario = selectScenario(image);
  const predictions = generateMockPredictions(scenario);
  const { label, confidence } = topFinding(predictions);
  const heatmap_base64 = await createPlaceholderHeatmapBase64(image, scenario);
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
