import { FINDING_LABELS } from "@/lib/constants";
import type { AnalyzeSuccessResponse, FindingLabel } from "@/types";

const SESSION_KEY = "lunglens.analyze.success.v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidAnalyzeSuccess(value: unknown): value is AnalyzeSuccessResponse {
  if (!isRecord(value) || value.success !== true) return false;
  const preds = value.predictions;
  if (!isRecord(preds)) return false;
  for (const label of FINDING_LABELS) {
    if (typeof preds[label] !== "number" || Number.isNaN(preds[label] as number)) return false;
  }
  const gradcam = value.gradcam;
  if (!isRecord(gradcam)) return false;
  if (typeof gradcam.heatmap_base64 !== "string" || !gradcam.heatmap_base64) return false;
  if (typeof gradcam.top_prediction !== "string") return false;
  if (!FINDING_LABELS.includes(gradcam.top_prediction as FindingLabel)) return false;
  if (typeof gradcam.confidence !== "number" || Number.isNaN(gradcam.confidence)) return false;
  return true;
}

/** Persist successful analyze payload for results-page refresh (no image re-upload). */
export function persistAnalyzeSuccessToSession(analysis: AnalyzeSuccessResponse): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(analysis));
  } catch {
    /* quota or private mode — ignore */
  }
}

/** Restore analyze payload after navigation refresh; returns null if missing or invalid. */
export function readPersistedAnalyzeSuccessFromSession(): AnalyzeSuccessResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidAnalyzeSuccess(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPersistedAnalyzeSuccessSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
