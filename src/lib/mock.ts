import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import { PIPELINE } from "@/lib/constants";
import type {
  AnalyzeSuccessResponse,
  Model2VisionResult,
  Model6TabularResult,
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
    id: "lung-opacity-predominant",
    primary: "Lung Opacity",
    scores: {
      "Lung Opacity": 0.82,
      Pneumonia: 0.48,
      "COVID-19": 0.22,
    },
    heatmapFoci: [
      { x: 0.34, y: 0.58, radius: 0.22, intensity: 1 },
      { x: 0.42, y: 0.48, radius: 0.14, intensity: 0.66 },
    ],
  },
  {
    id: "pneumonia-predominant",
    primary: "Pneumonia",
    scores: {
      Pneumonia: 0.86,
      "Lung Opacity": 0.52,
      "COVID-19": 0.2,
    },
    heatmapFoci: [
      { x: 0.64, y: 0.44, radius: 0.19, intensity: 1 },
      { x: 0.56, y: 0.55, radius: 0.12, intensity: 0.7 },
    ],
  },
  {
    id: "covid-predominant",
    primary: "COVID-19",
    scores: {
      "COVID-19": 0.79,
      "Lung Opacity": 0.5,
      Pneumonia: 0.36,
    },
    heatmapFoci: [
      { x: 0.45, y: 0.5, radius: 0.2, intensity: 1 },
      { x: 0.55, y: 0.42, radius: 0.12, intensity: 0.72 },
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
  const lungSignal = Math.max(preds.Pneumonia, preds["COVID-19"], preds["Lung Opacity"]);
  const normalProxy = 1 - lungSignal;
  const pneumonia = lungSignal >= 0.5;
  return {
    label: pneumonia ? "Pneumonia" : "Normal",
    confidence: Number((pneumonia ? lungSignal : normalProxy).toFixed(4)),
  };
}

function stage2FromPredictions(preds: Predictions): StageMultiClassResult {
  const viral = Math.max(preds.Pneumonia, preds["COVID-19"]);
  const opacity = preds["Lung Opacity"];
  const normal = Math.max(0.05, 1 - Math.max(viral, opacity));
  if (normal >= viral && normal >= opacity) {
    return { label: "Normal", confidence: Number(normal.toFixed(4)) };
  }
  if (viral >= opacity) {
    return { label: "Viral Pneumonia", confidence: Number(viral.toFixed(4)) };
  }
  return { label: "Lung Opacity", confidence: Number(opacity.toFixed(4)) };
}

/** Model 2 — Edward ResNet-152V2 (`model2`); class order: Normal, Viral Pneumonia, Lung Opacity. */
function model2VisionFromPredictions(preds: Predictions): Model2VisionResult {
  const viral = Math.max(preds.Pneumonia, preds["COVID-19"]);
  const opacity = preds["Lung Opacity"];
  const normal = Math.max(0.05, 1 - Math.max(viral, opacity));
  const sum = normal + viral + opacity || 1;
  const stage2 = stage2FromPredictions(preds);
  return {
    prediction: stage2.label,
    confidence: stage2.confidence,
    status: "success",
    model_name: "ResNet-152V2 (Edward)",
    input_type: "vision",
    probabilities: {
      Normal: Number((normal / sum).toFixed(2)),
      "Viral Pneumonia": Number((viral / sum).toFixed(2)),
      "Lung Opacity": Number((opacity / sum).toFixed(2)),
    },
    gradcam: "",
  };
}

function gateFromStages(stage1: StageBinaryResult, stage2: StageMultiClassResult) {
  const positive =
    stage1.label === "Pneumonia" ||
    (stage2.label !== "Normal" && stage2.confidence >= PIPELINE.gateThreshold);
  return positive
    ? { route: "continue" as const, reason: "positive_detected" as const }
    : { route: "early_stop" as const, reason: "both_negative" as const };
}

function model6TabularFromQuestionnaire(q: Stage3QuestionnaireInput): Model6TabularResult {
  const clinical = stage3FromQuestionnaire(q);
  const high =
    clinical.risk_level === "high" ||
    (clinical.risk_level === "medium" && clinical.severity === "high");
  const pHigh = high ? 0.72 : 0.18;
  const prediction = high ? "High COPD Risk" : "Low COPD Risk";
  return {
    prediction,
    confidence: Number(pHigh.toFixed(2)),
    status: "success",
    input_type: "tabular",
    model_name: "Chronic Lung Risk (COPD)",
    label: prediction,
    probabilities: {
      "High COPD Risk": pHigh,
      "Low COPD Risk": Number((1 - pHigh).toFixed(2)),
    },
  };
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
  const visionStage2 = stage2FromPredictions(predictions);
  const gate = gateFromStages(stage1, visionStage2);
  const top = topThree(predictions);

  const needsQuestionnaire =
    gate.route === "continue" && PIPELINE.questionnaireRequiredOnContinue && !opts?.questionnaire;
  const stage3 = opts?.questionnaire ? stage3FromQuestionnaire(opts.questionnaire) : null;
  const model4 = needsQuestionnaire ? null : buildReport(gate, top, stage3);
  const total = Math.round((performance.now?.() ?? Date.now()) - t0);

  return {
    success: true,
    predictions,
    gradcam: {
      heatmap_base64,
      top_prediction: label,
      confidence,
    },
    model1: stage1,
    model2: model2VisionFromPredictions(predictions),
    model6: opts?.questionnaire ? model6TabularFromQuestionnaire(opts.questionnaire) : undefined,
    copd_screening: opts?.questionnaire ? model6TabularFromQuestionnaire(opts.questionnaire) : undefined,
    gate,
    clinical_risk: stage3,
    model3: {
      model_name: "DenseNet-121",
      prediction: "Normal",
      confidence_score: 0.86,
      probabilities: {
        "COVID-19": 0.04,
        Normal: 0.86,
        Pneumonia: 0.1,
      },
    },
    model4,
    model4_swint: {
      prediction: "Normal",
      confidence: 0.91,
      status: "success",
      model_name: "Swin-T",
      probabilities: {
        Atelectasis: 0.02,
        Cardiomegaly: 0.03,
        Consolidation: 0.01,
        Edema: 0.01,
        Effusion: 0.02,
        Normal: 0.91,
      },
    },
    model5_densenet: {
      prediction: "No Finding",
      confidence: 0.78,
      status: "success",
      model_name: "DenseNet-121",
      probabilities: {
        "No Finding": 0.78,
        Atelectasis: 0.04,
        Cardiomegaly: 0.03,
        Effusion: 0.03,
        Infiltration: 0.04,
        Mass: 0.02,
        Nodule: 0.02,
        Pneumonia: 0.02,
        Pneumothorax: 0.01,
        Consolidation: 0.01,
      },
    },
    llm_evaluation: {
      status: "success",
      text: "### 🩺 Clinical Observation\n\nThis is **mock** educational output for local testing. Imaging models did not flag a dominant abnormality in this demo run.\n\n### 📋 Suggested Next Steps\n\n- Share your official radiology report with your clinician.\n- Discuss any symptoms that worry you, even when automated scores look low.\n\n### Questions to ask your doctor\n\n- What did my official radiology report conclude?\n- Could these patterns match infection, inflammation, or something else?\n- Do I need follow-up imaging or labs based on my symptoms?",
    },
    requires_questionnaire: needsQuestionnaire,
    timing_ms: {
      model1: Math.max(40, Math.round(total * 0.12)),
      model2: Math.max(40, Math.round(total * 0.14)),
      model3: Math.max(15, Math.round(total * 0.08)),
      model4: model4 ? Math.max(60, Math.round(total * 0.2)) : 0,
      total,
    },
    provenance: {
      run_mode: "mock",
      model1_result: "mock",
      model2_result: "mock",
      model3_result: "skipped",
      clinical_risk_result: stage3 ? "mock" : "skipped",
      gate_decision: "mock",
      findings: "mock",
      doctor_questions: "mock",
      report_summary: "mock",
      anatomy_guide: "static",
      model1: { source: "mock", status: "ok", model_id: "mock-model1", model_version: "demo-v1" },
      model2: { source: "mock", status: "ok", model_id: "mock-model2", model_version: "demo-v1" },
      model3: {
        source: "mock",
        status: "skipped",
        model_id: "mock-densenet121",
        model_version: "demo-v1",
      },
      clinical_risk: stage3
        ? { source: "mock", status: "ok", model_id: "mock-clinical", model_version: "demo-v1" }
        : { source: "mock", status: "skipped", model_id: "mock-clinical", model_version: "demo-v1" },
      model4: model4
        ? { source: "mock", status: "ok", model_id: "mock-model4", model_version: "demo-v1" }
        : { source: "mock", status: "skipped", model_id: "mock-model4", model_version: "demo-v1" },
      explanations: [
        {
          section: "pipeline-summary",
          stage_keys: ["model1", "model2", "clinical_risk", "model3"],
          source_type: "mock",
        },
        { section: "report-summary", stage_keys: ["model4"], source_type: "mock" },
        { section: "anatomy-guide", stage_keys: ["pipeline"], source_type: "static" },
      ],
    },
    warnings: [
      {
        code: "mock_data",
        message:
          "This report is generated from mock data for demo/testing and does not represent live model inference.",
        stage: "pipeline",
      },
    ],
  };
}
