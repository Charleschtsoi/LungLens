import type { AnalyzeSuccessResponse, FindingLabel, Predictions } from "@/lib/types/analyze";
import { FINDING_LABELS } from "@/lib/types/analyze";

const MOCK_DELAY_MS = 1500;

/** Tiny valid PNG (1×1) — placeholder until real Grad-CAM is wired. */
const PLACEHOLDER_HEATMAP_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const BASE_PREDICTIONS: Predictions = {
  Atelectasis: 0.12,
  Cardiomegaly: 0.03,
  Effusion: 0.78,
  Infiltration: 0.45,
  Mass: 0.02,
  Nodule: 0.05,
  Pneumonia: 0.67,
  Pneumothorax: 0.01,
  Consolidation: 0.34,
  Edema: 0.08,
  Emphysema: 0.02,
  Fibrosis: 0.04,
  Pleural_Thickening: 0.06,
  Hernia: 0.01,
};

function jitterPredictions(seed: number): Predictions {
  const out = { ...BASE_PREDICTIONS };
  (Object.keys(out) as FindingLabel[]).forEach((key, i) => {
    const noise = ((Math.sin(seed + i * 1.7) + 1) / 2) * 0.08 - 0.04;
    out[key] = Math.min(0.99, Math.max(0.01, out[key] + noise));
  });
  return out;
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

export async function mockAnalyze(_imageBuffer: Buffer): Promise<AnalyzeSuccessResponse> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
  const seed = Date.now() % 1000;
  const predictions = jitterPredictions(seed);
  const { label, confidence } = topFinding(predictions);
  return {
    success: true,
    predictions,
    gradcam: {
      heatmap_base64: PLACEHOLDER_HEATMAP_BASE64,
      top_prediction: label,
      confidence,
    },
  };
}
