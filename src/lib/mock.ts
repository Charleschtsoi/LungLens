import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import type { AnalyzeSuccessResponse, Predictions } from "@/types";

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
export async function mockAnalyze(image: File): Promise<AnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const predictions = generateMockPredictions();
  const { label, confidence } = topFinding(predictions);
  const heatmap_base64 = await createPlaceholderHeatmapBase64(image);

  return {
    success: true,
    predictions,
    gradcam: {
      heatmap_base64,
      top_prediction: label,
      confidence,
    },
  };
}
